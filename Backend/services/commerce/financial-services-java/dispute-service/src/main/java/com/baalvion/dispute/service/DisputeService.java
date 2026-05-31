package com.baalvion.dispute.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.dispute.config.DisputeProperties;
import com.baalvion.dispute.domain.Dispute;
import com.baalvion.dispute.domain.Dispute.*;
import com.baalvion.dispute.domain.DisputeAction;
import com.baalvion.dispute.dto.*;
import com.baalvion.dispute.exception.NotFoundException;
import com.baalvion.dispute.provider.DisputeAiProvider;
import com.baalvion.dispute.repository.DisputeActionRepository;
import com.baalvion.dispute.repository.DisputeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Three-tier dispute resolution engine.
 *   Tier 1 (AI_TRIAGE): on open, the AI provider produces an advisory recommendation; the dispute
 *     then awaits the respondent.
 *   Tier 2 (MEDIATION): a mediator is assigned, proposes a settlement; acceptance resolves it.
 *   Tier 3 (ARBITRATION): if mediation fails, an arbitrator issues a binding award.
 * Resolution posts dispute.resolved (and tier changes post dispute.escalated) so escrow/order
 * services can release or claw back funds.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DisputeService {

  private final DisputeRepository disputeRepository;
  private final DisputeActionRepository actionRepository;
  private final OutboxService outbox;
  private final DisputeAiProvider ai;
  private final DisputeProperties props;
  private final ObjectMapper objectMapper;

  // --------------------------------------------------------------------------- open + Tier 1 AI

  public DisputeResponse open(UUID tenantId, OpenDisputeRequest req) {
    String idem = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = disputeRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent dispute open: key={} exists for tenant={}", idem, tenantId);
      return withTimeline(existing.get());
    }

    Dispute d = Dispute.builder()
      .tenantId(tenantId).idempotencyKey(idem).reference(generateReference(tenantId))
      .subjectType(parseEnum(SubjectType.class, req.getSubjectType(), "subjectType")).subjectId(req.getSubjectId())
      .raisedBy(parseEnum(Party.class, req.getRaisedBy(), "raisedBy"))
      .claimantId(req.getClaimantId()).claimantName(req.getClaimantName())
      .respondentId(req.getRespondentId()).respondentName(req.getRespondentName())
      .type(parseEnum(DisputeType.class, req.getType(), "type"))
      .amount(req.getAmount()).currency(req.getCurrency() != null ? req.getCurrency().toUpperCase() : null)
      .description(req.getDescription()).evidence(writeJson(req.getEvidence()))
      .tier(Tier.AI_TRIAGE).status(DisputeStatus.OPEN)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .openedAt(LocalDateTime.now())
      .build();
    d = disputeRepository.save(d);
    action(d, "AI_TRIAGE", d.getRaisedBy().name(), "OPENED", "Dispute raised");

    // Tier 1: AI triage (advisory).
    DisputeAiProvider.TriageResult triage = ai.triage(d);
    d.setAiRecommendation(writeJson(triage));
    d.setStatus(DisputeStatus.AWAITING_RESPONSE);
    d.setDeadlineAt(LocalDateTime.now().plusDays(props.getResponseWindowDays()));
    disputeRepository.save(d);
    action(d, "AI_TRIAGE", "AI", "AI_TRIAGED",
      triage.recommendation() + " (confidence " + triage.confidence() + "): " + triage.rationale());

    log.info("Dispute opened: id={}, ref={}, type={}, aiRec={}, tenant={}",
      d.getId(), d.getReference(), d.getType(), triage.recommendation(), tenantId);
    outbox.enqueue(tenantId, "dispute.opened", d.getId().toString(), DisputeResponse.from(d));
    return withTimeline(d);
  }

  /** Respondent answers (Tier 1→). accept=true settles in favour of the claimant; otherwise it stands for mediation. */
  public DisputeResponse respond(UUID tenantId, UUID id, String party, boolean accept, String note) {
    Dispute d = load(tenantId, id);
    requireActive(d);
    Party p = parseEnum(Party.class, party, "party");
    action(d, d.getTier().name(), p.name(), "RESPONDED", (accept ? "Accepted claim" : "Contested claim") + (note != null ? ": " + note : ""));
    if (accept) {
      resolve(d, ResolutionType.SETTLED, favorOf(d.getRaisedBy()), d.getAmount(), "Respondent accepted the claim");
    } else {
      d.setStatus(DisputeStatus.AWAITING_RESPONSE);
      disputeRepository.save(d);
    }
    return withTimeline(d);
  }

  // --------------------------------------------------------------------------- Tier 2 mediation

  public DisputeResponse escalateToMediation(UUID tenantId, UUID id, UUID mediatorId) {
    Dispute d = load(tenantId, id);
    requireActive(d);
    if (d.getTier() == Tier.ARBITRATION) throw new IllegalStateException("Dispute is already in arbitration");
    d.setTier(Tier.MEDIATION);
    d.setStatus(DisputeStatus.IN_MEDIATION);
    d.setMediatorId(mediatorId);
    d.setDeadlineAt(LocalDateTime.now().plusDays(props.getMediationWindowDays()));
    disputeRepository.save(d);
    action(d, "MEDIATION", "SYSTEM", "ESCALATED", "Escalated to mediation" + (mediatorId != null ? ", mediator " + mediatorId : ""));
    outbox.enqueue(tenantId, "dispute.escalated", id.toString(), DisputeResponse.from(d));
    return withTimeline(d);
  }

  public DisputeResponse propose(UUID tenantId, UUID id, ProposeSettlementRequest req) {
    Dispute d = load(tenantId, id);
    if (d.getStatus() != DisputeStatus.IN_MEDIATION) throw new IllegalStateException("Dispute is not in mediation (was " + d.getStatus() + ")");
    d.setProposedInFavorOf(parseEnum(Favor.class, req.getInFavorOf(), "inFavorOf"));
    d.setProposedAmount(req.getAmount());
    d.setProposedTerms(req.getTerms());
    disputeRepository.save(d);
    action(d, "MEDIATION", "MEDIATOR", "PROPOSED",
      "Proposed settlement in favour of " + req.getInFavorOf() + (req.getAmount() != null ? ", amount " + req.getAmount() : ""));
    return withTimeline(d);
  }

  public DisputeResponse acceptSettlement(UUID tenantId, UUID id, String party) {
    Dispute d = load(tenantId, id);
    if (d.getStatus() != DisputeStatus.IN_MEDIATION || d.getProposedInFavorOf() == null) {
      throw new IllegalStateException("No active settlement proposal to accept");
    }
    Party p = parseEnum(Party.class, party, "party");
    action(d, "MEDIATION", p.name(), "ACCEPTED", "Accepted mediator proposal");
    resolve(d, ResolutionType.SETTLED, d.getProposedInFavorOf(), d.getProposedAmount(), "Mediated settlement accepted");
    return withTimeline(d);
  }

  public DisputeResponse rejectSettlement(UUID tenantId, UUID id, String party, String reason) {
    Dispute d = load(tenantId, id);
    if (d.getStatus() != DisputeStatus.IN_MEDIATION) throw new IllegalStateException("Dispute is not in mediation");
    Party p = parseEnum(Party.class, party, "party");
    action(d, "MEDIATION", p.name(), "REJECTED", "Rejected mediator proposal" + (reason != null ? ": " + reason : ""));
    d.setProposedInFavorOf(null); d.setProposedAmount(null); d.setProposedTerms(null);
    disputeRepository.save(d);
    return withTimeline(d);
  }

  // --------------------------------------------------------------------------- Tier 3 arbitration

  public DisputeResponse escalateToArbitration(UUID tenantId, UUID id, UUID arbitratorId) {
    Dispute d = load(tenantId, id);
    requireActive(d);
    d.setTier(Tier.ARBITRATION);
    d.setStatus(DisputeStatus.IN_ARBITRATION);
    d.setArbitratorId(arbitratorId);
    d.setDeadlineAt(null);
    disputeRepository.save(d);
    action(d, "ARBITRATION", "SYSTEM", "ESCALATED", "Escalated to ICC arbitration" + (arbitratorId != null ? ", arbitrator " + arbitratorId : ""));
    outbox.enqueue(tenantId, "dispute.escalated", id.toString(), DisputeResponse.from(d));
    return withTimeline(d);
  }

  public DisputeResponse issueAward(UUID tenantId, UUID id, AwardRequest req) {
    Dispute d = load(tenantId, id);
    if (d.getStatus() != DisputeStatus.IN_ARBITRATION) throw new IllegalStateException("Dispute is not in arbitration (was " + d.getStatus() + ")");
    Favor favor = parseEnum(Favor.class, req.getInFavorOf(), "inFavorOf");
    action(d, "ARBITRATION", "ARBITRATOR", "AWARDED", "Award in favour of " + favor + ": " + req.getReasoning());
    resolve(d, ResolutionType.AWARD, favor, req.getAmount(), req.getReasoning());
    return withTimeline(d);
  }

  // --------------------------------------------------------------------------- withdraw + reads

  public DisputeResponse withdraw(UUID tenantId, UUID id, String reason) {
    Dispute d = load(tenantId, id);
    requireActive(d);
    d.setStatus(DisputeStatus.WITHDRAWN);
    d.setResolutionType(ResolutionType.WITHDRAWN);
    d.setResolvedAt(LocalDateTime.now());
    disputeRepository.save(d);
    action(d, d.getTier().name(), "SYSTEM", "WITHDRAWN", reason);
    outbox.enqueue(tenantId, "dispute.resolved", id.toString(), DisputeResponse.from(d));
    return withTimeline(d);
  }

  @Transactional(readOnly = true)
  public DisputeResponse get(UUID tenantId, UUID id) {
    return withTimeline(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<DisputeResponse> list(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Dispute> result = (status != null)
      ? disputeRepository.findByTenantIdAndStatus(tenantId, parseEnum(DisputeStatus.class, status, "status"), pageable)
      : disputeRepository.findByTenantId(tenantId, pageable);
    return result.map(DisputeResponse::from);
  }

  // --------------------------------------------------------------------------- scheduled SLA escalation

  @Transactional
  public int escalateOverdue() {
    List<Dispute> overdue = disputeRepository.findByStatusInAndDeadlineAtBefore(
      List.of(DisputeStatus.AWAITING_RESPONSE, DisputeStatus.IN_MEDIATION), LocalDateTime.now());
    for (Dispute d : overdue) {
      if (d.getStatus() == DisputeStatus.AWAITING_RESPONSE) {
        d.setTier(Tier.MEDIATION); d.setStatus(DisputeStatus.IN_MEDIATION);
        d.setDeadlineAt(LocalDateTime.now().plusDays(props.getMediationWindowDays()));
        action(d, "MEDIATION", "SYSTEM", "ESCALATED", "Response window elapsed — auto-escalated to mediation");
      } else {
        d.setTier(Tier.ARBITRATION); d.setStatus(DisputeStatus.IN_ARBITRATION); d.setDeadlineAt(null);
        action(d, "ARBITRATION", "SYSTEM", "ESCALATED", "Mediation window elapsed — auto-escalated to arbitration");
      }
      disputeRepository.save(d);
      outbox.enqueue(d.getTenantId(), "dispute.escalated", d.getId().toString(), DisputeResponse.from(d));
    }
    if (!overdue.isEmpty()) log.info("Auto-escalated {} overdue disputes", overdue.size());
    return overdue.size();
  }

  // --------------------------------------------------------------------------- helpers

  private void resolve(Dispute d, ResolutionType type, Favor favor, BigDecimal amount, String note) {
    d.setStatus(DisputeStatus.RESOLVED);
    d.setResolutionType(type);
    d.setResolvedInFavorOf(favor);
    d.setAwardAmount(amount);
    d.setResolutionNote(note);
    d.setResolvedAt(LocalDateTime.now());
    d.setDeadlineAt(null);
    disputeRepository.save(d);
    log.info("Dispute resolved: id={}, type={}, favor={}, amount={}, tenant={}", d.getId(), type, favor, amount, d.getTenantId());
    outbox.enqueue(d.getTenantId(), "dispute.resolved", d.getId().toString(), DisputeResponse.from(d));
  }

  private Favor favorOf(Party p) {
    return p == Party.BUYER ? Favor.BUYER : Favor.SELLER;
  }

  private void requireActive(Dispute d) {
    if (d.getStatus() == DisputeStatus.RESOLVED || d.getStatus() == DisputeStatus.REJECTED || d.getStatus() == DisputeStatus.WITHDRAWN) {
      throw new IllegalStateException("Dispute is already closed (" + d.getStatus() + ")");
    }
  }

  private void action(Dispute d, String tier, String actor, String act, String note) {
    actionRepository.save(DisputeAction.builder()
      .disputeId(d.getId()).tenantId(d.getTenantId()).tier(tier).actor(actor).action(act).note(note).build());
  }

  private DisputeResponse withTimeline(Dispute d) {
    List<ActionResponse> timeline = actionRepository.findByDisputeIdOrderByCreatedAtAsc(d.getId()).stream()
      .map(ActionResponse::from).toList();
    return DisputeResponse.from(d, timeline);
  }

  private Dispute load(UUID tenantId, UUID id) {
    return disputeRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Dispute not found: " + id));
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "DSP-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!disputeRepository.existsByTenantIdAndReference(tenantId, candidate)) return candidate;
    }
    throw new IllegalStateException("Unable to allocate a unique dispute reference");
  }

  private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
    try {
      return Enum.valueOf(type, value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid " + field + ": " + value);
    }
  }

  private String writeJson(Object value) {
    if (value == null) return "[]";
    try { return objectMapper.writeValueAsString(value); }
    catch (Exception e) { throw new IllegalStateException("Unable to serialize JSON field", e); }
  }
}
