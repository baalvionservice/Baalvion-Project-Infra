package com.baalvion.tradefinance.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.tradefinance.config.TradeFinanceProperties;
import com.baalvion.tradefinance.domain.LcAmendment;
import com.baalvion.tradefinance.domain.LcAmendment.AmendmentStatus;
import com.baalvion.tradefinance.domain.LcPresentation;
import com.baalvion.tradefinance.domain.LcPresentation.PresentationStatus;
import com.baalvion.tradefinance.domain.LetterOfCredit;
import com.baalvion.tradefinance.domain.LetterOfCredit.LcStatus;
import com.baalvion.tradefinance.domain.LetterOfCredit.LcType;
import com.baalvion.tradefinance.dto.*;
import com.baalvion.tradefinance.exception.NotFoundException;
import com.baalvion.tradefinance.provider.IssuingBankAdapter;
import com.baalvion.tradefinance.repository.LcAmendmentRepository;
import com.baalvion.tradefinance.repository.LcPresentationRepository;
import com.baalvion.tradefinance.repository.LetterOfCreditRepository;
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
 * Documentary-credit lifecycle (UCP 600). Issuing a credit records a contingent liability and an
 * applicant cash margin; complying (or waived-discrepant) presentations draw the credit and post
 * real ledger settlement via the transactional outbox.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LetterOfCreditService {

  private static final int MONEY_SCALE = 4;
  private static final BigDecimal BPS = new BigDecimal("10000");

  private final LetterOfCreditRepository lcRepository;
  private final LcAmendmentRepository amendmentRepository;
  private final LcPresentationRepository presentationRepository;
  private final OutboxService outbox;
  private final IssuingBankAdapter issuingBank;
  private final TradeFinanceProperties props;
  private final ObjectMapper objectMapper;

  // ----------------------------------------------------------------------------- issue / read

  public LcResponse issue(UUID tenantId, IssueLcRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();

    var existing = lcRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent LC issue: key={} already exists for tenant={}", idem, tenantId);
      return LcResponse.from(existing.get());
    }

    LcType type = parseEnum(LcType.class, req.getLcType(), "lcType");
    validateCurrency(req.getCurrency());
    if (req.getExpiryDate().isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("expiryDate must be in the future");
    }
    if (req.getLatestShipmentDate() != null && req.getLatestShipmentDate().isAfter(req.getExpiryDate())) {
      throw new IllegalArgumentException("latestShipmentDate cannot be after expiryDate");
    }
    BigDecimal amount = req.getAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    BigDecimal commission = amount.multiply(BigDecimal.valueOf(props.getIssuanceCommissionBps()))
      .divide(BPS, MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal marginRate = req.getMarginRate() != null ? req.getMarginRate() : props.getDefaultMarginRate();
    BigDecimal margin = amount.multiply(marginRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    String lcNumber = generateLcNumber(tenantId);
    String schemeRef = issuingBank.registerCredit(tenantId, lcNumber, amount, req.getCurrency(), req.getBeneficiaryName());

    LetterOfCredit lc = LetterOfCredit.builder()
      .tenantId(tenantId)
      .lcNumber(lcNumber)
      .idempotencyKey(idem)
      .lcType(type)
      .status(LcStatus.ISSUED)
      .applicantId(req.getApplicantId())
      .applicantName(req.getApplicantName())
      .beneficiaryId(req.getBeneficiaryId())
      .beneficiaryName(req.getBeneficiaryName())
      .issuingBank(req.getIssuingBank())
      .advisingBank(req.getAdvisingBank())
      .confirmingBank(req.getConfirmingBank())
      .amount(amount)
      .availableAmount(amount)
      .currency(req.getCurrency().toUpperCase())
      .tolerancePct(req.getTolerancePct() != null ? req.getTolerancePct() : BigDecimal.ZERO)
      .incoterm(req.getIncoterm())
      .goodsDescription(req.getGoodsDescription())
      .portOfLoading(req.getPortOfLoading())
      .portOfDischarge(req.getPortOfDischarge())
      .partialShipmentAllowed(req.isPartialShipmentAllowed())
      .transhipmentAllowed(req.isTranshipmentAllowed())
      .latestShipmentDate(req.getLatestShipmentDate())
      .expiryDate(req.getExpiryDate())
      .expiryPlace(req.getExpiryPlace())
      .requiredDocuments(writeJson(req.getRequiredDocuments()))
      .commissionAmount(commission)
      .marginRate(marginRate)
      .marginAmount(margin)
      .schemeRef(schemeRef)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .issuedAt(LocalDateTime.now())
      .build();

    LetterOfCredit saved = lcRepository.save(lc);
    log.info("LC issued: id={}, number={}, tenant={}, amount={} {}, commission={}, margin={}",
      saved.getId(), lcNumber, tenantId, amount, saved.getCurrency(), commission, margin);

    // Contingent liability + margin block: ledger/account services react to this event.
    outbox.enqueue(tenantId, "tradefinance.lc.issued", saved.getId().toString(), LcResponse.from(saved));
    return LcResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public LcResponse get(UUID tenantId, UUID id) {
    return LcResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<LcResponse> list(UUID tenantId, String status, UUID beneficiaryId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<LetterOfCredit> result;
    if (status != null) {
      result = lcRepository.findByTenantIdAndStatus(tenantId, parseEnum(LcStatus.class, status, "status"), pageable);
    } else if (beneficiaryId != null) {
      result = lcRepository.findByTenantIdAndBeneficiaryId(tenantId, beneficiaryId, pageable);
    } else {
      result = lcRepository.findByTenantId(tenantId, pageable);
    }
    return result.map(LcResponse::from);
  }

  // ----------------------------------------------------------------------------- advise / cancel

  public LcResponse advise(UUID tenantId, UUID id) {
    LetterOfCredit lc = load(tenantId, id);
    if (lc.getStatus() != LcStatus.ISSUED) {
      throw new IllegalStateException("Only an ISSUED credit can be advised (was " + lc.getStatus() + ")");
    }
    lc.setStatus(LcStatus.ADVISED);
    LetterOfCredit saved = lcRepository.save(lc);
    log.info("LC advised: id={}, tenant={}", id, tenantId);
    return LcResponse.from(saved);
  }

  public LcResponse cancel(UUID tenantId, UUID id, String reason) {
    LetterOfCredit lc = load(tenantId, id);
    if (lc.getStatus() == LcStatus.SETTLED || lc.getStatus() == LcStatus.CANCELLED || lc.getStatus() == LcStatus.EXPIRED) {
      throw new IllegalStateException("Credit is already terminal (" + lc.getStatus() + ")");
    }
    if (lc.getSettledAmount().signum() > 0) {
      throw new IllegalStateException("Cannot cancel a credit that has already been partially drawn");
    }
    lc.setStatus(LcStatus.CANCELLED);
    lc.setAvailableAmount(BigDecimal.ZERO.setScale(MONEY_SCALE));
    LetterOfCredit saved = lcRepository.save(lc);
    log.info("LC cancelled: id={}, tenant={}, reason={}", id, tenantId, reason);
    // Releases the contingent liability + margin.
    outbox.enqueue(tenantId, "tradefinance.lc.closed", saved.getId().toString(), LcResponse.from(saved));
    return LcResponse.from(saved);
  }

  // ----------------------------------------------------------------------------- amendments

  public LcAmendmentResponse amend(UUID tenantId, UUID id, AmendLcRequest req) {
    LetterOfCredit lc = load(tenantId, id);
    if (lc.getStatus() != LcStatus.ISSUED && lc.getStatus() != LcStatus.ADVISED && lc.getStatus() != LcStatus.AMENDED) {
      throw new IllegalStateException("Credit cannot be amended in status " + lc.getStatus());
    }
    if (req.getNewAmount() == null && req.getNewExpiryDate() == null
        && (req.getChanges() == null || req.getChanges().isBlank())) {
      throw new IllegalArgumentException("At least one change must be supplied");
    }
    if (req.getNewExpiryDate() != null && req.getNewExpiryDate().isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("newExpiryDate must be in the future");
    }
    if (req.getNewAmount() != null && req.getNewAmount().compareTo(lc.getSettledAmount()) < 0) {
      throw new IllegalArgumentException("newAmount cannot be below the already-settled amount");
    }

    int next = (int) amendmentRepository.countByLcId(id) + 1;
    LcAmendment amendment = LcAmendment.builder()
      .lcId(id)
      .tenantId(tenantId)
      .amendmentNumber(next)
      .status(AmendmentStatus.PROPOSED)
      .newAmount(req.getNewAmount() != null ? req.getNewAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP) : null)
      .newExpiryDate(req.getNewExpiryDate())
      .changes(req.getChanges() != null ? req.getChanges() : "{}")
      .reason(req.getReason())
      .requiresConsent(true)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .build();
    LcAmendment saved = amendmentRepository.save(amendment);
    log.info("LC amendment proposed: lc={}, amendment#={}, tenant={}", id, next, tenantId);
    outbox.enqueue(tenantId, "tradefinance.lc.amended", id.toString(), LcAmendmentResponse.from(saved));
    return LcAmendmentResponse.from(saved);
  }

  /** Beneficiary consent (UCP 600 art.10): accept applies the changes; reject discards them. */
  public LcAmendmentResponse decideAmendment(UUID tenantId, UUID lcId, UUID amendmentId, boolean accept) {
    LetterOfCredit lc = load(tenantId, lcId);
    LcAmendment amendment = amendmentRepository.findByIdAndTenantId(amendmentId, tenantId)
      .orElseThrow(() -> new NotFoundException("Amendment not found: " + amendmentId));
    if (!amendment.getLcId().equals(lcId)) {
      throw new IllegalArgumentException("Amendment does not belong to this credit");
    }
    if (amendment.getStatus() != AmendmentStatus.PROPOSED) {
      throw new IllegalStateException("Amendment already decided (" + amendment.getStatus() + ")");
    }

    amendment.setDecidedAt(LocalDateTime.now());
    amendment.setConsentedBy(AuthContext.currentUserId().orElse(null));
    if (accept) {
      amendment.setStatus(AmendmentStatus.ACCEPTED);
      if (amendment.getNewAmount() != null) {
        BigDecimal delta = amendment.getNewAmount().subtract(lc.getAmount());
        lc.setAmount(amendment.getNewAmount());
        lc.setAvailableAmount(lc.getAvailableAmount().add(delta).max(BigDecimal.ZERO));
      }
      if (amendment.getNewExpiryDate() != null) {
        lc.setExpiryDate(amendment.getNewExpiryDate());
      }
      lc.setStatus(LcStatus.AMENDED);
      lcRepository.save(lc);
      log.info("LC amendment accepted: lc={}, amendment={}, tenant={}", lcId, amendmentId, tenantId);
    } else {
      amendment.setStatus(AmendmentStatus.REJECTED);
      log.info("LC amendment rejected: lc={}, amendment={}, tenant={}", lcId, amendmentId, tenantId);
    }
    return LcAmendmentResponse.from(amendmentRepository.save(amendment));
  }

  @Transactional(readOnly = true)
  public List<LcAmendmentResponse> listAmendments(UUID tenantId, UUID lcId) {
    load(tenantId, lcId);
    return amendmentRepository.findByLcIdOrderByAmendmentNumberAsc(lcId).stream()
      .map(LcAmendmentResponse::from).toList();
  }

  // ----------------------------------------------------------------------------- presentations

  public LcPresentationResponse present(UUID tenantId, UUID lcId, PresentDocumentsRequest req) {
    LetterOfCredit lc = load(tenantId, lcId);
    if (lc.getStatus() == LcStatus.DRAFT || lc.getStatus() == LcStatus.CANCELLED
        || lc.getStatus() == LcStatus.EXPIRED || lc.getStatus() == LcStatus.SETTLED) {
      throw new IllegalStateException("Documents cannot be presented against a credit in status " + lc.getStatus());
    }
    if (LocalDate.now().isAfter(lc.getExpiryDate())) {
      throw new IllegalStateException("Credit has expired; presentation not permitted");
    }
    BigDecimal presented = req.getPresentedAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal drawable = drawableCeiling(lc);
    if (presented.compareTo(drawable) > 0) {
      throw new IllegalArgumentException("presentedAmount " + presented + " exceeds the drawable balance " + drawable);
    }
    if (!lc.isPartialShipmentAllowed() && presented.compareTo(lc.getAvailableAmount()) < 0) {
      throw new IllegalArgumentException("Partial drawings are not allowed under this credit");
    }

    int next = (int) presentationRepository.countByLcId(lcId) + 1;
    LcPresentation presentation = LcPresentation.builder()
      .lcId(lcId)
      .tenantId(tenantId)
      .presentationNumber(next)
      .status(PresentationStatus.UNDER_EXAMINATION)
      .presentedAmount(presented)
      .documents(writeJson(req.getDocuments()))
      .examinationDueDate(LocalDate.now().plusDays(props.getDocumentExaminationDays()))
      .createdBy(AuthContext.currentUserId().orElse(null))
      .build();
    LcPresentation savedPres = presentationRepository.save(presentation);

    lc.setStatus(LcStatus.DOCS_PRESENTED);
    lcRepository.save(lc);
    log.info("LC presentation: lc={}, presentation#={}, amount={}, tenant={}", lcId, next, presented, tenantId);
    outbox.enqueue(tenantId, "tradefinance.lc.presented", lcId.toString(), LcPresentationResponse.from(savedPres));
    return LcPresentationResponse.from(savedPres);
  }

  /**
   * Records the bank's examination outcome. An empty discrepancy list means complying; otherwise
   * the presentation is marked DISCREPANT and the credit awaits an applicant waiver.
   */
  public LcPresentationResponse examine(UUID tenantId, UUID lcId, UUID presentationId, List<String> discrepancies) {
    LetterOfCredit lc = load(tenantId, lcId);
    LcPresentation pres = loadPresentation(tenantId, lcId, presentationId);
    if (pres.getStatus() != PresentationStatus.UNDER_EXAMINATION && pres.getStatus() != PresentationStatus.SUBMITTED) {
      throw new IllegalStateException("Presentation is not awaiting examination (" + pres.getStatus() + ")");
    }
    pres.setExaminedAt(LocalDateTime.now());
    pres.setExaminedBy(AuthContext.currentUserId().orElse(null));
    if (discrepancies == null || discrepancies.isEmpty()) {
      pres.setStatus(PresentationStatus.COMPLYING);
      pres.setDiscrepancies("[]");
      lc.setStatus(LcStatus.DOCS_ACCEPTED);
    } else {
      pres.setStatus(PresentationStatus.DISCREPANT);
      pres.setDiscrepancies(writeJson(discrepancies));
      lc.setStatus(LcStatus.DISCREPANT);
    }
    lcRepository.save(lc);
    log.info("LC examined: lc={}, presentation={}, outcome={}, tenant={}", lcId, presentationId, pres.getStatus(), tenantId);
    return LcPresentationResponse.from(presentationRepository.save(pres));
  }

  /** Applicant waives noted discrepancies (UCP 600 art.16(c)), making a discrepant set payable. */
  public LcPresentationResponse waiveDiscrepancies(UUID tenantId, UUID lcId, UUID presentationId) {
    LetterOfCredit lc = load(tenantId, lcId);
    LcPresentation pres = loadPresentation(tenantId, lcId, presentationId);
    if (pres.getStatus() != PresentationStatus.DISCREPANT) {
      throw new IllegalStateException("Only a DISCREPANT presentation can be waived (" + pres.getStatus() + ")");
    }
    pres.setWaived(true);
    pres.setStatus(PresentationStatus.WAIVED);
    lc.setStatus(LcStatus.DOCS_ACCEPTED);
    lcRepository.save(lc);
    log.info("LC discrepancies waived: lc={}, presentation={}, tenant={}", lcId, presentationId, tenantId);
    return LcPresentationResponse.from(presentationRepository.save(pres));
  }

  /** Rejects a discrepant presentation outright (no waiver); the credit returns to ISSUED/ADVISED. */
  public LcPresentationResponse rejectPresentation(UUID tenantId, UUID lcId, UUID presentationId, String reason) {
    LetterOfCredit lc = load(tenantId, lcId);
    LcPresentation pres = loadPresentation(tenantId, lcId, presentationId);
    if (pres.getStatus() == PresentationStatus.SETTLED) {
      throw new IllegalStateException("A settled presentation cannot be rejected");
    }
    pres.setStatus(PresentationStatus.REJECTED);
    lc.setStatus(lc.getSettledAmount().signum() > 0 ? LcStatus.AMENDED : LcStatus.ADVISED);
    lcRepository.save(lc);
    log.info("LC presentation rejected: lc={}, presentation={}, reason={}, tenant={}", lcId, presentationId, reason, tenantId);
    return LcPresentationResponse.from(presentationRepository.save(pres));
  }

  /** Honours a complying/waived presentation: draws the credit and posts ledger settlement. */
  public LcPresentationResponse settle(UUID tenantId, UUID lcId, UUID presentationId) {
    LetterOfCredit lc = load(tenantId, lcId);
    LcPresentation pres = loadPresentation(tenantId, lcId, presentationId);
    if (pres.getStatus() != PresentationStatus.COMPLYING && pres.getStatus() != PresentationStatus.WAIVED) {
      throw new IllegalStateException("Presentation is not honourable (" + pres.getStatus() + ")");
    }
    BigDecimal amount = pres.getPresentedAmount();
    if (amount.compareTo(lc.getAvailableAmount()) > 0) {
      throw new IllegalStateException("Settlement exceeds the available credit balance");
    }

    lc.setAvailableAmount(lc.getAvailableAmount().subtract(amount));
    lc.setSettledAmount(lc.getSettledAmount().add(amount));
    pres.setStatus(PresentationStatus.SETTLED);
    pres.setSettledAt(LocalDateTime.now());
    if (lc.getAvailableAmount().signum() == 0 && lc.getLcType() != LcType.REVOLVING) {
      lc.setStatus(LcStatus.SETTLED);
      lc.setSettledAt(LocalDateTime.now());
    } else {
      lc.setStatus(LcStatus.AMENDED); // partially drawn; remains operative
    }
    presentationRepository.save(pres);
    lcRepository.save(lc);
    log.info("LC settled: lc={}, presentation={}, amount={}, remaining={}, tenant={}",
      lcId, presentationId, amount, lc.getAvailableAmount(), tenantId);

    // Real money movement: debit applicant / credit beneficiary — consumed by ledger/payment.
    outbox.enqueue(tenantId, "tradefinance.lc.settled", lcId.toString(), SettlementEvent.builder()
      .lcId(lcId).presentationId(presentationId).tenantId(tenantId)
      .applicantId(lc.getApplicantId()).beneficiaryId(lc.getBeneficiaryId())
      .amount(amount).currency(lc.getCurrency()).lcNumber(lc.getLcNumber()).build());
    return LcPresentationResponse.from(pres);
  }

  @Transactional(readOnly = true)
  public List<LcPresentationResponse> listPresentations(UUID tenantId, UUID lcId) {
    load(tenantId, lcId);
    return presentationRepository.findByLcIdOrderByPresentationNumberAsc(lcId).stream()
      .map(LcPresentationResponse::from).toList();
  }

  // ----------------------------------------------------------------------------- scheduled expiry

  /** Sweeps operative credits past their expiry date to EXPIRED (UCP 600 art.6(e)). */
  @Transactional
  public int expireOverdue() {
    List<LetterOfCredit> overdue = lcRepository.findByStatusInAndExpiryDateBefore(
      List.of(LcStatus.ISSUED, LcStatus.ADVISED, LcStatus.AMENDED, LcStatus.DOCS_PRESENTED, LcStatus.DISCREPANT),
      LocalDate.now());
    for (LetterOfCredit lc : overdue) {
      lc.setStatus(LcStatus.EXPIRED);
      lc.setAvailableAmount(BigDecimal.ZERO.setScale(MONEY_SCALE));
      outbox.enqueue(lc.getTenantId(), "tradefinance.lc.closed", lc.getId().toString(), LcResponse.from(lc));
    }
    if (!overdue.isEmpty()) {
      lcRepository.saveAll(overdue);
      log.info("Expired {} overdue letters of credit", overdue.size());
    }
    return overdue.size();
  }

  // ----------------------------------------------------------------------------- helpers

  private LetterOfCredit load(UUID tenantId, UUID id) {
    return lcRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Letter of credit not found: " + id));
  }

  private LcPresentation loadPresentation(UUID tenantId, UUID lcId, UUID presentationId) {
    LcPresentation pres = presentationRepository.findByIdAndTenantId(presentationId, tenantId)
      .orElseThrow(() -> new NotFoundException("Presentation not found: " + presentationId));
    if (!pres.getLcId().equals(lcId)) {
      throw new IllegalArgumentException("Presentation does not belong to this credit");
    }
    return pres;
  }

  /** Maximum drawable on a single presentation, accounting for the credit amount tolerance. */
  private BigDecimal drawableCeiling(LetterOfCredit lc) {
    if (lc.getTolerancePct().signum() == 0) {
      return lc.getAvailableAmount();
    }
    BigDecimal toleranceFactor = BigDecimal.ONE.add(
      lc.getTolerancePct().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
    return lc.getAvailableAmount().multiply(toleranceFactor).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
  }

  private String generateLcNumber(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "LC-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!lcRepository.existsByTenantIdAndLcNumber(tenantId, candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique LC number");
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

  /** Lightweight settlement event payload consumed by ledger/payment services. */
  @lombok.Builder
  @lombok.Data
  static class SettlementEvent {
    private UUID lcId;
    private UUID presentationId;
    private UUID tenantId;
    private UUID applicantId;
    private UUID beneficiaryId;
    private BigDecimal amount;
    private String currency;
    private String lcNumber;
  }
}
