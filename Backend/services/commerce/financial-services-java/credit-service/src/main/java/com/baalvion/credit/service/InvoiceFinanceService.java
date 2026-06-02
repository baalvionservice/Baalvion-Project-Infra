package com.baalvion.credit.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.credit.config.CreditProperties;
import com.baalvion.credit.domain.FinancedInvoice;
import com.baalvion.credit.domain.FinancedInvoice.InvoiceStatus;
import com.baalvion.credit.domain.InvoiceCollection;
import com.baalvion.credit.dto.*;
import com.baalvion.credit.exception.NotFoundException;
import com.baalvion.credit.repository.FinancedInvoiceRepository;
import com.baalvion.credit.repository.InvoiceCollectionRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Invoice finance (factoring / invoice discounting). On submission a receivable is risk-assessed
 * and priced; on funding the advance is disbursed to the seller; on collection the advance + fee
 * are recovered and the reserve (net of fee) is remitted to the seller. All money movements are
 * emitted to the ledger/payment services via the transactional outbox.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceFinanceService {

  private static final int MONEY_SCALE = 4;
  private static final int RATE_SCALE = 6;
  private static final BigDecimal YEAR_DAYS = new BigDecimal("365");

  private final FinancedInvoiceRepository invoiceRepository;
  private final InvoiceCollectionRepository collectionRepository;
  private final CreditRiskEngine riskEngine;
  private final OutboxService outbox;
  private final CreditProperties props;

  // ------------------------------------------------------------------- submit (assess + price)

  public InvoiceResponse submit(UUID tenantId, SubmitInvoiceRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = invoiceRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      return InvoiceResponse.from(existing.get());
    }

    validateCurrency(req.getCurrency());
    if (req.getDueDate().isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("dueDate must be in the future");
    }
    BigDecimal face = req.getFaceAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    int tenorDays = (int) Math.max(1, ChronoUnit.DAYS.between(LocalDate.now(), req.getDueDate()));

    RiskAssessment risk = riskEngine.assess(buildRiskInput(tenantId, req.getDebtorId(), face, tenorDays, req.getCurrency()));

    FinancedInvoice invoice = FinancedInvoice.builder()
      .tenantId(tenantId)
      .reference(generateReference(tenantId))
      .idempotencyKey(idem)
      .invoiceNumber(req.getInvoiceNumber())
      .sellerId(req.getSellerId())
      .sellerName(req.getSellerName())
      .debtorId(req.getDebtorId())
      .debtorName(req.getDebtorName())
      .faceAmount(face)
      .currency(req.getCurrency().toUpperCase())
      .issueDate(req.getIssueDate())
      .dueDate(req.getDueDate())
      .riskGrade(risk.getGrade().name())
      .riskScore(risk.getScore())
      .riskRationale(risk.getRationale())
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .build();

    if (!risk.isApproved()) {
      invoice.setStatus(InvoiceStatus.REJECTED);
      log.info("Invoice finance rejected by risk: tenant={}, grade={}, score={}", tenantId, risk.getGrade(), risk.getScore());
      return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    BigDecimal advanceRate = props.getInvoiceDefaultAdvanceRate();
    if (req.getRequestedAdvanceRate() != null) {
      advanceRate = req.getRequestedAdvanceRate();
    }
    advanceRate = advanceRate.min(risk.getMaxAdvanceRate()).min(props.getInvoiceMaxAdvanceRate())
      .setScale(RATE_SCALE, RoundingMode.HALF_UP);

    BigDecimal advance = face.multiply(advanceRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal effectiveFeeRate = props.getInvoiceAnnualFeeRate()
      .multiply(BigDecimal.valueOf(tenorDays)).divide(YEAR_DAYS, RATE_SCALE, RoundingMode.HALF_UP)
      .multiply(risk.getPricingMultiplier()).setScale(RATE_SCALE, RoundingMode.HALF_UP);
    BigDecimal fee = advance.multiply(effectiveFeeRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal reserve = face.subtract(advance).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    invoice.setStatus(InvoiceStatus.APPROVED);
    invoice.setAdvanceRate(advanceRate);
    invoice.setAdvanceAmount(advance);
    invoice.setFeeRate(effectiveFeeRate);
    invoice.setFeeAmount(fee);
    invoice.setReserveAmount(reserve);

    FinancedInvoice saved = invoiceRepository.save(invoice);
    log.info("Invoice finance approved: ref={}, tenant={}, face={} {}, advance={} ({}), fee={}, grade={}",
      saved.getReference(), tenantId, face, saved.getCurrency(), advance, advanceRate, fee, risk.getGrade());
    return InvoiceResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public InvoiceResponse get(UUID tenantId, UUID id) {
    return InvoiceResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<InvoiceResponse> list(UUID tenantId, String status, UUID sellerId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<FinancedInvoice> result;
    if (status != null) {
      result = invoiceRepository.findByTenantIdAndStatus(tenantId, parseStatus(status), pageable);
    } else if (sellerId != null) {
      result = invoiceRepository.findByTenantIdAndSellerId(tenantId, sellerId, pageable);
    } else {
      result = invoiceRepository.findByTenantId(tenantId, pageable);
    }
    return result.map(InvoiceResponse::from);
  }

  // ------------------------------------------------------------------- fund / collect

  /** Disburses the advance to the seller (APPROVED → FUNDED). */
  public InvoiceResponse fund(UUID tenantId, UUID id) {
    FinancedInvoice inv = load(tenantId, id);
    if (inv.getStatus() != InvoiceStatus.APPROVED) {
      throw new IllegalStateException("Only an APPROVED invoice can be funded (was " + inv.getStatus() + ")");
    }
    inv.setStatus(InvoiceStatus.FUNDED);
    inv.setFundedAt(LocalDateTime.now());
    FinancedInvoice saved = invoiceRepository.save(inv);
    log.info("Invoice funded: ref={}, tenant={}, advance={} {}", saved.getReference(), tenantId, saved.getAdvanceAmount(), saved.getCurrency());

    // Real money movement: financier → seller for the advance amount.
    outbox.enqueue(tenantId, "credit.invoice.funded", id.toString(), DisbursementEvent.builder()
      .invoiceId(id).tenantId(tenantId).beneficiaryId(inv.getSellerId())
      .amount(inv.getAdvanceAmount()).currency(inv.getCurrency()).reference(inv.getReference()).build());
    return InvoiceResponse.from(saved);
  }

  /** Records a debtor payment; once fully collected, recovers fee and remits the net reserve. */
  public InvoiceResponse collect(UUID tenantId, UUID id, CollectionRequest req) {
    FinancedInvoice inv = load(tenantId, id);
    if (inv.getStatus() != InvoiceStatus.FUNDED && inv.getStatus() != InvoiceStatus.OVERDUE) {
      throw new IllegalStateException("Collections only apply to a FUNDED/OVERDUE invoice (was " + inv.getStatus() + ")");
    }
    BigDecimal amount = req.getAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal newCollected = inv.getCollectedAmount().add(amount);
    if (newCollected.compareTo(inv.getFaceAmount()) > 0) {
      throw new IllegalArgumentException("Collection exceeds the invoice face amount");
    }

    collectionRepository.save(InvoiceCollection.builder()
      .invoiceId(id).tenantId(tenantId).amount(amount).reference(req.getReference())
      .createdBy(AuthContext.currentUserId().orElse(null)).build());
    inv.setCollectedAmount(newCollected);

    if (newCollected.compareTo(inv.getFaceAmount()) >= 0) {
      inv.setStatus(InvoiceStatus.COLLECTED);
      inv.setCollectedAt(LocalDateTime.now());
      BigDecimal netReserve = inv.getReserveAmount().subtract(inv.getFeeAmount()).max(BigDecimal.ZERO);
      log.info("Invoice fully collected: ref={}, tenant={}, remitting net reserve={} to seller", inv.getReference(), tenantId, netReserve);
      outbox.enqueue(tenantId, "credit.invoice.collected", id.toString(), DisbursementEvent.builder()
        .invoiceId(id).tenantId(tenantId).beneficiaryId(inv.getSellerId())
        .amount(netReserve).currency(inv.getCurrency()).reference(inv.getReference()).build());
    }
    return InvoiceResponse.from(invoiceRepository.save(inv));
  }

  @Transactional(readOnly = true)
  public List<InvoiceCollectionResponse> listCollections(UUID tenantId, UUID id) {
    load(tenantId, id);
    return collectionRepository.findByInvoiceIdOrderByCreatedAtAsc(id).stream()
      .map(InvoiceCollectionResponse::from).toList();
  }

  // ------------------------------------------------------------------- scheduled delinquency

  @Transactional
  public int sweepDelinquent() {
    int changed = 0;
    LocalDate today = LocalDate.now();
    // FUNDED past due → OVERDUE
    for (FinancedInvoice inv : invoiceRepository.findByStatusAndDueDateBefore(InvoiceStatus.FUNDED, today)) {
      inv.setStatus(InvoiceStatus.OVERDUE);
      invoiceRepository.save(inv);
      changed++;
    }
    // OVERDUE beyond the default window → DEFAULTED
    LocalDate defaultCutoff = today.minusDays(props.getDefaultAfterDays());
    for (FinancedInvoice inv : invoiceRepository.findByStatusAndDueDateBefore(InvoiceStatus.OVERDUE, defaultCutoff)) {
      inv.setStatus(InvoiceStatus.DEFAULTED);
      invoiceRepository.save(inv);
      outbox.enqueue(inv.getTenantId(), "credit.invoice.closed", inv.getId().toString(), InvoiceResponse.from(inv));
      changed++;
    }
    if (changed > 0) log.info("Invoice delinquency sweep updated {} invoices", changed);
    return changed;
  }

  // ------------------------------------------------------------------- helpers

  private RiskInput buildRiskInput(UUID tenantId, UUID debtorId, BigDecimal amount, int tenorDays, String currency) {
    int priorDefaults = 0;
    int priorSettled = 0;
    BigDecimal exposure = BigDecimal.ZERO;
    if (debtorId != null) {
      priorDefaults = (int) invoiceRepository.countByTenantIdAndDebtorIdAndStatus(tenantId, debtorId, InvoiceStatus.DEFAULTED);
      priorSettled = (int) invoiceRepository.countByTenantIdAndDebtorIdAndStatus(tenantId, debtorId, InvoiceStatus.COLLECTED);
      exposure = invoiceRepository.findByTenantIdAndDebtorIdAndStatusIn(tenantId, debtorId,
          List.of(InvoiceStatus.FUNDED, InvoiceStatus.OVERDUE)).stream()
        .map(FinancedInvoice::getAdvanceAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    return RiskInput.builder()
      .amount(amount).tenorDays(tenorDays).currency(currency)
      .priorDefaults(priorDefaults).priorSettled(priorSettled).currentExposure(exposure)
      .build();
  }

  private FinancedInvoice load(UUID tenantId, UUID id) {
    return invoiceRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Financed invoice not found: " + id));
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "IF-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!invoiceRepository.existsByTenantIdAndReference(tenantId, candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique invoice finance reference");
  }

  private InvoiceStatus parseStatus(String value) {
    try {
      return InvoiceStatus.valueOf(value.trim().toUpperCase());
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
  static class DisbursementEvent {
    private UUID invoiceId;
    private UUID tenantId;
    private UUID beneficiaryId;
    private BigDecimal amount;
    private String currency;
    private String reference;
  }
}
