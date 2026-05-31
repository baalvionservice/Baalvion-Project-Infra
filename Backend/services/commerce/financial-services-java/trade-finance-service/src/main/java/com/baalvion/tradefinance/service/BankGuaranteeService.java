package com.baalvion.tradefinance.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.tradefinance.config.TradeFinanceProperties;
import com.baalvion.tradefinance.domain.BankGuarantee;
import com.baalvion.tradefinance.domain.BankGuarantee.GoverningRules;
import com.baalvion.tradefinance.domain.BankGuarantee.GuaranteeStatus;
import com.baalvion.tradefinance.domain.BankGuarantee.GuaranteeType;
import com.baalvion.tradefinance.domain.GuaranteeClaim;
import com.baalvion.tradefinance.domain.GuaranteeClaim.ClaimStatus;
import com.baalvion.tradefinance.dto.*;
import com.baalvion.tradefinance.exception.NotFoundException;
import com.baalvion.tradefinance.provider.IssuingBankAdapter;
import com.baalvion.tradefinance.repository.BankGuaranteeRepository;
import com.baalvion.tradefinance.repository.GuaranteeClaimRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import java.util.UUID;

/**
 * Independent-guarantee lifecycle (URDG 758 / ISP98). Issuance records a contingent liability and
 * an applicant margin; a complying demand (claim) is paid to the beneficiary and posts a real
 * ledger movement, debiting the applicant.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BankGuaranteeService {

  private static final int MONEY_SCALE = 4;
  private static final BigDecimal BPS = new BigDecimal("10000");

  private final BankGuaranteeRepository guaranteeRepository;
  private final GuaranteeClaimRepository claimRepository;
  private final OutboxService outbox;
  private final IssuingBankAdapter issuingBank;
  private final TradeFinanceProperties props;
  private final ObjectMapper objectMapper;

  // ----------------------------------------------------------------------------- issue / read

  public GuaranteeResponse issue(UUID tenantId, IssueGuaranteeRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();

    var existing = guaranteeRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent guarantee issue: key={} already exists for tenant={}", idem, tenantId);
      return GuaranteeResponse.from(existing.get());
    }

    GuaranteeType type = parseEnum(GuaranteeType.class, req.getGuaranteeType(), "guaranteeType");
    GoverningRules rules = req.getGoverningRules() != null
      ? parseEnum(GoverningRules.class, req.getGoverningRules(), "governingRules") : GoverningRules.URDG_758;
    validateCurrency(req.getCurrency());
    if (req.getExpiryDate().isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("expiryDate must be in the future");
    }
    if (req.getEffectiveDate() != null && req.getEffectiveDate().isAfter(req.getExpiryDate())) {
      throw new IllegalArgumentException("effectiveDate cannot be after expiryDate");
    }
    BigDecimal amount = req.getAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal commission = amount.multiply(BigDecimal.valueOf(props.getIssuanceCommissionBps()))
      .divide(BPS, MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal marginRate = req.getMarginRate() != null ? req.getMarginRate() : props.getDefaultMarginRate();
    BigDecimal margin = amount.multiply(marginRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    String number = generateGuaranteeNumber(tenantId);
    String schemeRef = issuingBank.registerGuarantee(tenantId, number, amount, req.getCurrency(), req.getBeneficiaryName());

    BankGuarantee guarantee = BankGuarantee.builder()
      .tenantId(tenantId)
      .guaranteeNumber(number)
      .idempotencyKey(idem)
      .guaranteeType(type)
      .status(GuaranteeStatus.ISSUED)
      .applicantId(req.getApplicantId())
      .applicantName(req.getApplicantName())
      .beneficiaryId(req.getBeneficiaryId())
      .beneficiaryName(req.getBeneficiaryName())
      .guarantorBank(req.getGuarantorBank())
      .amount(amount)
      .currency(req.getCurrency().toUpperCase())
      .underlyingContractRef(req.getUnderlyingContractRef())
      .purpose(req.getPurpose())
      .governingRules(rules)
      .effectiveDate(req.getEffectiveDate() != null ? req.getEffectiveDate() : LocalDate.now())
      .expiryDate(req.getExpiryDate())
      .autoExtend(req.isAutoExtend())
      .commissionAmount(commission)
      .marginRate(marginRate)
      .marginAmount(margin)
      .schemeRef(schemeRef)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .issuedAt(LocalDateTime.now())
      .build();

    BankGuarantee saved = guaranteeRepository.save(guarantee);
    log.info("Guarantee issued: id={}, number={}, tenant={}, type={}, amount={} {}",
      saved.getId(), number, tenantId, type, amount, saved.getCurrency());
    outbox.enqueue(tenantId, "tradefinance.guarantee.issued", saved.getId().toString(), GuaranteeResponse.from(saved));
    return GuaranteeResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public GuaranteeResponse get(UUID tenantId, UUID id) {
    return GuaranteeResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<GuaranteeResponse> list(UUID tenantId, String status, UUID beneficiaryId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<BankGuarantee> result;
    if (status != null) {
      result = guaranteeRepository.findByTenantIdAndStatus(tenantId, parseEnum(GuaranteeStatus.class, status, "status"), pageable);
    } else if (beneficiaryId != null) {
      result = guaranteeRepository.findByTenantIdAndBeneficiaryId(tenantId, beneficiaryId, pageable);
    } else {
      result = guaranteeRepository.findByTenantId(tenantId, pageable);
    }
    return result.map(GuaranteeResponse::from);
  }

  // ----------------------------------------------------------------------------- amend / extend

  /** Extend the validity (URDG 758 art.23 "extend or pay") and/or adjust the guaranteed amount. */
  public GuaranteeResponse amend(UUID tenantId, UUID id, BigDecimal newAmount, LocalDate newExpiryDate) {
    BankGuarantee g = load(tenantId, id);
    if (g.getStatus() != GuaranteeStatus.ISSUED && g.getStatus() != GuaranteeStatus.AMENDED) {
      throw new IllegalStateException("Guarantee cannot be amended in status " + g.getStatus());
    }
    if (newAmount == null && newExpiryDate == null) {
      throw new IllegalArgumentException("At least one of newAmount or newExpiryDate must be supplied");
    }
    if (newExpiryDate != null) {
      if (newExpiryDate.isBefore(LocalDate.now())) {
        throw new IllegalArgumentException("newExpiryDate must be in the future");
      }
      g.setExpiryDate(newExpiryDate);
    }
    if (newAmount != null) {
      BigDecimal scaled = newAmount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
      if (scaled.compareTo(g.getClaimedAmount()) < 0) {
        throw new IllegalArgumentException("newAmount cannot be below the already-claimed amount");
      }
      g.setAmount(scaled);
    }
    g.setStatus(GuaranteeStatus.AMENDED);
    BankGuarantee saved = guaranteeRepository.save(g);
    log.info("Guarantee amended: id={}, tenant={}, amount={}, expiry={}", id, tenantId, g.getAmount(), g.getExpiryDate());
    return GuaranteeResponse.from(saved);
  }

  public GuaranteeResponse cancel(UUID tenantId, UUID id, String reason) {
    BankGuarantee g = load(tenantId, id);
    if (isTerminal(g.getStatus())) {
      throw new IllegalStateException("Guarantee is already terminal (" + g.getStatus() + ")");
    }
    if (g.getClaimedAmount().signum() > 0) {
      throw new IllegalStateException("Cannot cancel a guarantee with paid claims");
    }
    g.setStatus(GuaranteeStatus.CANCELLED);
    BankGuarantee saved = guaranteeRepository.save(g);
    log.info("Guarantee cancelled: id={}, tenant={}, reason={}", id, tenantId, reason);
    outbox.enqueue(tenantId, "tradefinance.guarantee.closed", saved.getId().toString(), GuaranteeResponse.from(saved));
    return GuaranteeResponse.from(saved);
  }

  /** Beneficiary releases the guarantee before expiry (no claim). Frees the margin. */
  public GuaranteeResponse release(UUID tenantId, UUID id) {
    BankGuarantee g = load(tenantId, id);
    if (isTerminal(g.getStatus())) {
      throw new IllegalStateException("Guarantee is already terminal (" + g.getStatus() + ")");
    }
    g.setStatus(GuaranteeStatus.RELEASED);
    BankGuarantee saved = guaranteeRepository.save(g);
    log.info("Guarantee released: id={}, tenant={}", id, tenantId);
    outbox.enqueue(tenantId, "tradefinance.guarantee.closed", saved.getId().toString(), GuaranteeResponse.from(saved));
    return GuaranteeResponse.from(saved);
  }

  // ----------------------------------------------------------------------------- claims (demands)

  public GuaranteeClaimResponse makeClaim(UUID tenantId, UUID guaranteeId, MakeClaimRequest req) {
    BankGuarantee g = load(tenantId, guaranteeId);
    if (g.getStatus() != GuaranteeStatus.ISSUED && g.getStatus() != GuaranteeStatus.AMENDED
        && g.getStatus() != GuaranteeStatus.CLAIMED) {
      throw new IllegalStateException("A demand cannot be made against a guarantee in status " + g.getStatus());
    }
    if (LocalDate.now().isAfter(g.getExpiryDate()) && !g.isAutoExtend()) {
      throw new IllegalStateException("Guarantee has expired; demand not permitted");
    }
    BigDecimal claimAmount = req.getClaimAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal remaining = g.getAmount().subtract(g.getClaimedAmount());
    if (claimAmount.compareTo(remaining) > 0) {
      throw new IllegalArgumentException("claimAmount " + claimAmount + " exceeds the available guarantee amount " + remaining);
    }

    int next = (int) claimRepository.countByGuaranteeId(guaranteeId) + 1;
    GuaranteeClaim claim = GuaranteeClaim.builder()
      .guaranteeId(guaranteeId)
      .tenantId(tenantId)
      .claimNumber(next)
      .status(ClaimStatus.UNDER_REVIEW)
      .claimAmount(claimAmount)
      .statement(req.getStatement())
      .supportingDocuments(writeJson(req.getSupportingDocuments()))
      .createdBy(AuthContext.currentUserId().orElse(null))
      .build();
    GuaranteeClaim savedClaim = claimRepository.save(claim);

    g.setStatus(GuaranteeStatus.CLAIMED);
    guaranteeRepository.save(g);
    log.info("Guarantee claim filed: guarantee={}, claim#={}, amount={}, tenant={}", guaranteeId, next, claimAmount, tenantId);
    outbox.enqueue(tenantId, "tradefinance.guarantee.claimed", guaranteeId.toString(), GuaranteeClaimResponse.from(savedClaim));
    return GuaranteeClaimResponse.from(savedClaim);
  }

  /** Guarantor decides a demand: PAY (honour, post ledger movement) or REJECT (with reasons). */
  public GuaranteeClaimResponse decideClaim(UUID tenantId, UUID guaranteeId, UUID claimId, boolean pay, String reason) {
    BankGuarantee g = load(tenantId, guaranteeId);
    GuaranteeClaim claim = claimRepository.findByIdAndTenantId(claimId, tenantId)
      .orElseThrow(() -> new NotFoundException("Claim not found: " + claimId));
    if (!claim.getGuaranteeId().equals(guaranteeId)) {
      throw new IllegalArgumentException("Claim does not belong to this guarantee");
    }
    if (claim.getStatus() != ClaimStatus.UNDER_REVIEW && claim.getStatus() != ClaimStatus.SUBMITTED) {
      throw new IllegalStateException("Claim already decided (" + claim.getStatus() + ")");
    }
    claim.setDecidedAt(LocalDateTime.now());
    claim.setDecidedBy(AuthContext.currentUserId().orElse(null));
    claim.setDecisionReason(reason);

    if (pay) {
      claim.setStatus(ClaimStatus.PAID);
      claim.setPaidAt(LocalDateTime.now());
      g.setClaimedAmount(g.getClaimedAmount().add(claim.getClaimAmount()));
      // Fully drawn → CLAIM_PAID terminal; otherwise the guarantee remains operative.
      g.setStatus(g.getClaimedAmount().compareTo(g.getAmount()) >= 0 ? GuaranteeStatus.CLAIM_PAID : GuaranteeStatus.ISSUED);
      guaranteeRepository.save(g);
      claimRepository.save(claim);
      log.info("Guarantee claim paid: guarantee={}, claim={}, amount={}, tenant={}", guaranteeId, claimId, claim.getClaimAmount(), tenantId);
      // Real money movement: debit applicant / credit beneficiary.
      outbox.enqueue(tenantId, "tradefinance.guarantee.claim_paid", guaranteeId.toString(), ClaimPaidEvent.builder()
        .guaranteeId(guaranteeId).claimId(claimId).tenantId(tenantId)
        .applicantId(g.getApplicantId()).beneficiaryId(g.getBeneficiaryId())
        .amount(claim.getClaimAmount()).currency(g.getCurrency()).guaranteeNumber(g.getGuaranteeNumber()).build());
    } else {
      claim.setStatus(ClaimStatus.REJECTED);
      // No other operative claim → guarantee reverts to its prior operative state.
      g.setStatus(g.getClaimedAmount().signum() > 0 ? GuaranteeStatus.AMENDED : GuaranteeStatus.ISSUED);
      guaranteeRepository.save(g);
      claimRepository.save(claim);
      log.info("Guarantee claim rejected: guarantee={}, claim={}, reason={}, tenant={}", guaranteeId, claimId, reason, tenantId);
    }
    return GuaranteeClaimResponse.from(claim);
  }

  @Transactional(readOnly = true)
  public List<GuaranteeClaimResponse> listClaims(UUID tenantId, UUID guaranteeId) {
    load(tenantId, guaranteeId);
    return claimRepository.findByGuaranteeIdOrderByClaimNumberAsc(guaranteeId).stream()
      .map(GuaranteeClaimResponse::from).toList();
  }

  // ----------------------------------------------------------------------------- scheduled expiry

  @Transactional
  public int expireOverdue() {
    List<BankGuarantee> overdue = guaranteeRepository.findByStatusInAndAutoExtendFalseAndExpiryDateBefore(
      List.of(GuaranteeStatus.ISSUED, GuaranteeStatus.AMENDED, GuaranteeStatus.CLAIM_REJECTED), LocalDate.now());
    for (BankGuarantee g : overdue) {
      g.setStatus(GuaranteeStatus.EXPIRED);
      outbox.enqueue(g.getTenantId(), "tradefinance.guarantee.closed", g.getId().toString(), GuaranteeResponse.from(g));
    }
    if (!overdue.isEmpty()) {
      guaranteeRepository.saveAll(overdue);
      log.info("Expired {} overdue bank guarantees", overdue.size());
    }
    return overdue.size();
  }

  // ----------------------------------------------------------------------------- helpers

  private BankGuarantee load(UUID tenantId, UUID id) {
    return guaranteeRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Bank guarantee not found: " + id));
  }

  private boolean isTerminal(GuaranteeStatus s) {
    return s == GuaranteeStatus.EXPIRED || s == GuaranteeStatus.CANCELLED
      || s == GuaranteeStatus.RELEASED || s == GuaranteeStatus.CLAIM_PAID;
  }

  private String generateGuaranteeNumber(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "BG-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!guaranteeRepository.existsByTenantIdAndGuaranteeNumber(tenantId, candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique guarantee number");
  }

  private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
    try {
      return Enum.valueOf(type, value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid " + field + ": " + value);
    }
  }

  private void validateCurrency(String currency) {
    if (currency == null || currency.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
  }

  private String writeJson(Object value) {
    if (value == null) return "[]";
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to serialize JSON field", e);
    }
  }

  @lombok.Builder
  @lombok.Data
  static class ClaimPaidEvent {
    private UUID guaranteeId;
    private UUID claimId;
    private UUID tenantId;
    private UUID applicantId;
    private UUID beneficiaryId;
    private BigDecimal amount;
    private String currency;
    private String guaranteeNumber;
  }
}
