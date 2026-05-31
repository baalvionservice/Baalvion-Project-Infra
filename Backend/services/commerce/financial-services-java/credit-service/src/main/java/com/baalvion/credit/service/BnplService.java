package com.baalvion.credit.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.credit.config.CreditProperties;
import com.baalvion.credit.domain.BnplInstallment;
import com.baalvion.credit.domain.BnplInstallment.InstallmentStatus;
import com.baalvion.credit.domain.BnplPlan;
import com.baalvion.credit.domain.BnplPlan.BnplStatus;
import com.baalvion.credit.domain.BnplPlan.TermType;
import com.baalvion.credit.domain.BnplRepayment;
import com.baalvion.credit.dto.*;
import com.baalvion.credit.exception.NotFoundException;
import com.baalvion.credit.repository.BnplInstallmentRepository;
import com.baalvion.credit.repository.BnplPlanRepository;
import com.baalvion.credit.repository.BnplRepaymentRepository;
import com.baalvion.credit.risk.CreditRiskEngine;
import com.baalvion.credit.risk.RiskAssessment;
import com.baalvion.credit.risk.RiskInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Trade BNPL. Creating a plan risk-assesses the buyer, prices a finance charge and builds the
 * repayment schedule; disbursement pays the merchant up-front; repayments are allocated to the
 * earliest owing installments; overdue installments accrue late fees and drive delinquency. All
 * money movements are emitted to the ledger/payment services via the transactional outbox.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BnplService {

  private static final int MONEY_SCALE = 4;
  private static final int RATE_SCALE = 6;
  private static final BigDecimal YEAR_DAYS = new BigDecimal("365");

  private final BnplPlanRepository planRepository;
  private final BnplInstallmentRepository installmentRepository;
  private final BnplRepaymentRepository repaymentRepository;
  private final CreditRiskEngine riskEngine;
  private final OutboxService outbox;
  private final CreditProperties props;

  // ------------------------------------------------------------------- create (assess + schedule)

  public BnplPlanResponse create(UUID tenantId, CreateBnplPlanRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = planRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      return BnplPlanResponse.from(existing.get(),
        installmentRepository.findByPlanIdOrderBySequenceNoAsc(existing.get().getId()));
    }

    validateCurrency(req.getCurrency());
    TermType termType = parseTerm(req.getTermType());
    int installmentCount = termType == TermType.BULLET ? 1 : Math.max(1, req.getInstallmentCount());
    int tenorDays = termType == TermType.BULLET
      ? (req.getTenorDays() != null ? req.getTenorDays() : 30)
      : installmentCount * 30;
    if (tenorDays <= 0) {
      throw new IllegalArgumentException("tenorDays must be positive");
    }
    BigDecimal principal = req.getPrincipal().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    RiskAssessment risk = riskEngine.assess(buildRiskInput(tenantId, req.getBuyerId(), principal, tenorDays, req.getCurrency()));

    BnplPlan plan = BnplPlan.builder()
      .tenantId(tenantId)
      .reference(generateReference(tenantId))
      .idempotencyKey(idem)
      .orderRef(req.getOrderRef())
      .buyerId(req.getBuyerId())
      .buyerName(req.getBuyerName())
      .merchantId(req.getMerchantId())
      .merchantName(req.getMerchantName())
      .principal(principal)
      .currency(req.getCurrency().toUpperCase())
      .termType(termType)
      .installmentCount(installmentCount)
      .tenorDays(tenorDays)
      .riskGrade(risk.getGrade().name())
      .riskScore(risk.getScore())
      .riskRationale(risk.getRationale())
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .build();

    if (!risk.isApproved()) {
      plan.setStatus(BnplStatus.REJECTED);
      log.info("BNPL rejected by risk: tenant={}, grade={}, score={}", tenantId, risk.getGrade(), risk.getScore());
      return BnplPlanResponse.from(planRepository.save(plan), List.of());
    }

    BigDecimal effectiveRate = props.getBnplAnnualInterestRate()
      .multiply(BigDecimal.valueOf(tenorDays)).divide(YEAR_DAYS, RATE_SCALE, RoundingMode.HALF_UP)
      .multiply(risk.getPricingMultiplier()).setScale(RATE_SCALE, RoundingMode.HALF_UP);
    BigDecimal interest = principal.multiply(effectiveRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal totalPayable = principal.add(interest);

    plan.setStatus(BnplStatus.APPROVED);
    plan.setInterestRate(effectiveRate);
    plan.setInterestAmount(interest);
    plan.setTotalPayable(totalPayable);
    plan.setOutstanding(totalPayable);
    BnplPlan saved = planRepository.save(plan);

    List<BnplInstallment> schedule = buildSchedule(saved, principal, interest, totalPayable);
    installmentRepository.saveAll(schedule);

    log.info("BNPL approved: ref={}, tenant={}, principal={} {}, interest={}, payable={}, {} installment(s), grade={}",
      saved.getReference(), tenantId, principal, saved.getCurrency(), interest, totalPayable, installmentCount, risk.getGrade());
    return BnplPlanResponse.from(saved, schedule);
  }

  @Transactional(readOnly = true)
  public BnplPlanResponse get(UUID tenantId, UUID id) {
    BnplPlan plan = load(tenantId, id);
    return BnplPlanResponse.from(plan, installmentRepository.findByPlanIdOrderBySequenceNoAsc(id));
  }

  @Transactional(readOnly = true)
  public Page<BnplPlanResponse> list(UUID tenantId, String status, UUID buyerId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<BnplPlan> result;
    if (status != null) {
      result = planRepository.findByTenantIdAndStatus(tenantId, parseStatus(status), pageable);
    } else if (buyerId != null) {
      result = planRepository.findByTenantIdAndBuyerId(tenantId, buyerId, pageable);
    } else {
      result = planRepository.findByTenantId(tenantId, pageable);
    }
    return result.map(BnplPlanResponse::from);
  }

  // ------------------------------------------------------------------- disburse / repay

  /** Pays the merchant the principal up-front (APPROVED → ACTIVE). */
  public BnplPlanResponse disburse(UUID tenantId, UUID id) {
    BnplPlan plan = load(tenantId, id);
    if (plan.getStatus() != BnplStatus.APPROVED) {
      throw new IllegalStateException("Only an APPROVED plan can be disbursed (was " + plan.getStatus() + ")");
    }
    plan.setStatus(BnplStatus.ACTIVE);
    plan.setDisbursedAt(LocalDateTime.now());
    BnplPlan saved = planRepository.save(plan);
    log.info("BNPL disbursed: ref={}, tenant={}, principal={} {} → merchant", saved.getReference(), tenantId, saved.getPrincipal(), saved.getCurrency());

    outbox.enqueue(tenantId, "credit.bnpl.disbursed", id.toString(), MovementEvent.builder()
      .planId(id).tenantId(tenantId).counterpartyId(plan.getMerchantId())
      .amount(plan.getPrincipal()).currency(plan.getCurrency()).reference(plan.getReference()).build());
    return BnplPlanResponse.from(saved, installmentRepository.findByPlanIdOrderBySequenceNoAsc(id));
  }

  /** Allocates a buyer repayment across the earliest owing installments. */
  public BnplPlanResponse repay(UUID tenantId, UUID id, RepaymentRequest req) {
    BnplPlan plan = load(tenantId, id);
    if (plan.getStatus() != BnplStatus.ACTIVE && plan.getStatus() != BnplStatus.DELINQUENT) {
      throw new IllegalStateException("Repayments only apply to an ACTIVE/DELINQUENT plan (was " + plan.getStatus() + ")");
    }
    BigDecimal amount = req.getAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    if (amount.compareTo(plan.getOutstanding()) > 0) {
      throw new IllegalArgumentException("Repayment " + amount + " exceeds the outstanding balance " + plan.getOutstanding());
    }

    BigDecimal remaining = amount;
    List<BnplInstallment> owing = installmentRepository.findByPlanIdAndStatusInOrderBySequenceNoAsc(
      id, List.of(InstallmentStatus.DUE, InstallmentStatus.OVERDUE));
    UUID firstInstallmentId = owing.isEmpty() ? null : owing.get(0).getId();
    for (BnplInstallment inst : owing) {
      if (remaining.signum() <= 0) break;
      BigDecimal owed = inst.getAmount().add(inst.getLateFee()).subtract(inst.getPaidAmount());
      if (owed.signum() <= 0) continue;
      BigDecimal applied = remaining.min(owed);
      inst.setPaidAmount(inst.getPaidAmount().add(applied));
      remaining = remaining.subtract(applied);
      if (inst.getPaidAmount().compareTo(inst.getAmount().add(inst.getLateFee())) >= 0) {
        inst.setStatus(InstallmentStatus.PAID);
        inst.setPaidAt(LocalDateTime.now());
      }
      installmentRepository.save(inst);
    }

    BigDecimal allocated = amount.subtract(remaining);
    plan.setOutstanding(plan.getOutstanding().subtract(allocated).max(BigDecimal.ZERO));
    repaymentRepository.save(BnplRepayment.builder()
      .planId(id).installmentId(firstInstallmentId).tenantId(tenantId).amount(allocated)
      .reference(req.getReference()).createdBy(AuthContext.currentUserId().orElse(null)).build());

    if (plan.getOutstanding().signum() == 0) {
      plan.setStatus(BnplStatus.SETTLED);
      plan.setSettledAt(LocalDateTime.now());
      log.info("BNPL settled: ref={}, tenant={}", plan.getReference(), tenantId);
      outbox.enqueue(tenantId, "credit.bnpl.settled", id.toString(), BnplPlanResponse.from(plan));
    } else if (plan.getStatus() == BnplStatus.DELINQUENT && noOverdueRemaining(id)) {
      plan.setStatus(BnplStatus.ACTIVE); // caught up
    }
    planRepository.save(plan);

    log.info("BNPL repayment: ref={}, tenant={}, applied={}, outstanding={}", plan.getReference(), tenantId, allocated, plan.getOutstanding());
    outbox.enqueue(tenantId, "credit.bnpl.repaid", id.toString(), MovementEvent.builder()
      .planId(id).tenantId(tenantId).counterpartyId(plan.getBuyerId())
      .amount(allocated).currency(plan.getCurrency()).reference(plan.getReference()).build());
    return BnplPlanResponse.from(plan, installmentRepository.findByPlanIdOrderBySequenceNoAsc(id));
  }

  public BnplPlanResponse cancel(UUID tenantId, UUID id, String reason) {
    BnplPlan plan = load(tenantId, id);
    if (plan.getStatus() != BnplStatus.PENDING && plan.getStatus() != BnplStatus.APPROVED) {
      throw new IllegalStateException("Only a not-yet-disbursed plan can be cancelled (was " + plan.getStatus() + ")");
    }
    plan.setStatus(BnplStatus.CANCELLED);
    log.info("BNPL cancelled: ref={}, tenant={}, reason={}", plan.getReference(), tenantId, reason);
    return BnplPlanResponse.from(planRepository.save(plan));
  }

  public BnplPlanResponse writeOff(UUID tenantId, UUID id, String reason) {
    BnplPlan plan = load(tenantId, id);
    if (plan.getStatus() != BnplStatus.DEFAULTED && plan.getStatus() != BnplStatus.DELINQUENT) {
      throw new IllegalStateException("Only a DELINQUENT/DEFAULTED plan can be written off (was " + plan.getStatus() + ")");
    }
    plan.setStatus(BnplStatus.WRITTEN_OFF);
    BnplPlan saved = planRepository.save(plan);
    log.info("BNPL written off: ref={}, tenant={}, outstanding={}, reason={}", saved.getReference(), tenantId, saved.getOutstanding(), reason);
    outbox.enqueue(tenantId, "credit.bnpl.delinquent", id.toString(), BnplPlanResponse.from(saved));
    return BnplPlanResponse.from(saved, installmentRepository.findByPlanIdOrderBySequenceNoAsc(id));
  }

  @Transactional(readOnly = true)
  public List<BnplInstallmentResponse> listInstallments(UUID tenantId, UUID id) {
    load(tenantId, id);
    return installmentRepository.findByPlanIdOrderBySequenceNoAsc(id).stream()
      .map(BnplInstallmentResponse::from).toList();
  }

  // ------------------------------------------------------------------- scheduled delinquency

  @Transactional
  public int sweepDelinquent() {
    LocalDate today = LocalDate.now();
    List<BnplInstallment> overdue = installmentRepository.findByStatusInAndDueDateBefore(
      List.of(InstallmentStatus.DUE), today);
    int changed = 0;
    for (BnplInstallment inst : overdue) {
      BnplPlan plan = planRepository.findById(inst.getPlanId()).orElse(null);
      if (plan == null || plan.getStatus() == BnplStatus.SETTLED
          || plan.getStatus() == BnplStatus.WRITTEN_OFF || plan.getStatus() == BnplStatus.CANCELLED) {
        continue;
      }
      BigDecimal lateFee = inst.getAmount().multiply(props.getBnplLateFeeRate()).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
      inst.setStatus(InstallmentStatus.OVERDUE);
      inst.setLateFee(inst.getLateFee().add(lateFee));
      installmentRepository.save(inst);

      plan.setLateFees(plan.getLateFees().add(lateFee));
      plan.setOutstanding(plan.getOutstanding().add(lateFee));
      // Default if the oldest overdue installment is beyond the default window.
      if (inst.getDueDate().isBefore(today.minusDays(props.getDefaultAfterDays()))) {
        plan.setStatus(BnplStatus.DEFAULTED);
      } else if (plan.getStatus() == BnplStatus.ACTIVE) {
        plan.setStatus(BnplStatus.DELINQUENT);
      }
      planRepository.save(plan);
      outbox.enqueue(plan.getTenantId(), "credit.bnpl.delinquent", plan.getId().toString(), BnplPlanResponse.from(plan));
      changed++;
    }
    if (changed > 0) log.info("BNPL delinquency sweep updated {} installments", changed);
    return changed;
  }

  // ------------------------------------------------------------------- helpers

  private List<BnplInstallment> buildSchedule(BnplPlan plan, BigDecimal principal, BigDecimal interest, BigDecimal totalPayable) {
    int n = plan.getInstallmentCount();
    List<BnplInstallment> schedule = new ArrayList<>();
    if (plan.getTermType() == TermType.BULLET || n == 1) {
      schedule.add(BnplInstallment.builder()
        .planId(plan.getId()).tenantId(plan.getTenantId()).sequenceNo(1)
        .dueDate(LocalDate.now().plusDays(plan.getTenorDays()))
        .amount(totalPayable).principalComponent(principal).interestComponent(interest)
        .status(InstallmentStatus.DUE).build());
      return schedule;
    }
    BigDecimal principalEach = principal.divide(BigDecimal.valueOf(n), MONEY_SCALE, RoundingMode.DOWN);
    BigDecimal interestEach = interest.divide(BigDecimal.valueOf(n), MONEY_SCALE, RoundingMode.DOWN);
    BigDecimal principalAcc = BigDecimal.ZERO;
    BigDecimal interestAcc = BigDecimal.ZERO;
    for (int seq = 1; seq <= n; seq++) {
      BigDecimal pComp = seq < n ? principalEach : principal.subtract(principalAcc); // last absorbs rounding
      BigDecimal iComp = seq < n ? interestEach : interest.subtract(interestAcc);
      principalAcc = principalAcc.add(pComp);
      interestAcc = interestAcc.add(iComp);
      schedule.add(BnplInstallment.builder()
        .planId(plan.getId()).tenantId(plan.getTenantId()).sequenceNo(seq)
        .dueDate(LocalDate.now().plusMonths(seq))
        .amount(pComp.add(iComp)).principalComponent(pComp).interestComponent(iComp)
        .status(InstallmentStatus.DUE).build());
    }
    return schedule;
  }

  private boolean noOverdueRemaining(UUID planId) {
    return installmentRepository.findByPlanIdAndStatusInOrderBySequenceNoAsc(planId, List.of(InstallmentStatus.OVERDUE)).isEmpty();
  }

  private RiskInput buildRiskInput(UUID tenantId, UUID buyerId, BigDecimal amount, int tenorDays, String currency) {
    int priorDefaults = 0;
    int priorSettled = 0;
    BigDecimal exposure = BigDecimal.ZERO;
    if (buyerId != null) {
      priorDefaults = (int) (planRepository.countByTenantIdAndBuyerIdAndStatus(tenantId, buyerId, BnplStatus.DEFAULTED)
        + planRepository.countByTenantIdAndBuyerIdAndStatus(tenantId, buyerId, BnplStatus.WRITTEN_OFF));
      priorSettled = (int) planRepository.countByTenantIdAndBuyerIdAndStatus(tenantId, buyerId, BnplStatus.SETTLED);
      exposure = planRepository.findByTenantIdAndBuyerIdAndStatusIn(tenantId, buyerId,
          List.of(BnplStatus.ACTIVE, BnplStatus.DELINQUENT)).stream()
        .map(BnplPlan::getOutstanding).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    return RiskInput.builder()
      .amount(amount).tenorDays(tenorDays).currency(currency)
      .priorDefaults(priorDefaults).priorSettled(priorSettled).currentExposure(exposure)
      .build();
  }

  private BnplPlan load(UUID tenantId, UUID id) {
    return planRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("BNPL plan not found: " + id));
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "BNPL-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!planRepository.existsByTenantIdAndReference(tenantId, candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique BNPL reference");
  }

  private TermType parseTerm(String value) {
    try {
      return TermType.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid termType: " + value + " (expected BULLET or INSTALLMENTS)");
    }
  }

  private BnplStatus parseStatus(String value) {
    try {
      return BnplStatus.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid status: " + value);
    }
  }

  private void validateCurrency(String currency) {
    if (currency == null || currency.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
  }

  @lombok.Builder
  @lombok.Data
  static class MovementEvent {
    private UUID planId;
    private UUID tenantId;
    private UUID counterpartyId;
    private BigDecimal amount;
    private String currency;
    private String reference;
  }
}
