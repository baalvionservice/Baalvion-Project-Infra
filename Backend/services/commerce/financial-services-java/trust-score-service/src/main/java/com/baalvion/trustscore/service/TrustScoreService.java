package com.baalvion.trustscore.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.trustscore.domain.TrustScore;
import com.baalvion.trustscore.domain.TrustScore.Band;
import com.baalvion.trustscore.domain.TrustScoreHistory;
import com.baalvion.trustscore.dto.ComputeRequest;
import com.baalvion.trustscore.dto.HistoryResponse;
import com.baalvion.trustscore.dto.ScoreResponse;
import com.baalvion.trustscore.exception.NotFoundException;
import com.baalvion.trustscore.provider.TrustScoreProvider;
import com.baalvion.trustscore.provider.TrustScoreProvider.ScoreInput;
import com.baalvion.trustscore.provider.TrustScoreProvider.ScoreOutcome;
import com.baalvion.trustscore.repository.TrustScoreHistoryRepository;
import com.baalvion.trustscore.repository.TrustScoreRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Composite trust-scoring engine. {@link #compute} runs the configured weighted model over the
 * supplied signals, upserts the subject's current score (bumping the revision), appends a history
 * row carrying the delta versus the prior score, and emits {@code trustscore.updated} so credit /
 * risk / pricing services can react.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TrustScoreService {

  private final TrustScoreRepository scoreRepository;
  private final TrustScoreHistoryRepository historyRepository;
  private final TrustScoreProvider provider;
  private final OutboxService outbox;
  private final ObjectMapper objectMapper;

  public ScoreResponse compute(UUID tenantId, ComputeRequest req) {
    String subjectType = req.getSubjectType().trim().toUpperCase();
    ScoreOutcome outcome = provider.score(new ScoreInput(
      req.getKycLevel(), req.getOnTimePaymentRate(), req.getDisputeRate(),
      req.getActivityScore(), req.getTenureMonths(), req.getSanctionsHits()));

    Band band = Band.valueOf(outcome.band());
    String factorsJson = writeJson(outcome.factors());
    String signalsJson = writeJson(signalsOf(req));

    var existingOpt = scoreRepository.findByTenantIdAndSubjectIdAndSubjectType(tenantId, req.getSubjectId(), subjectType);
    int previousScore = existingOpt.map(TrustScore::getScore).orElse(0);
    int delta = existingOpt.isPresent() ? outcome.score() - previousScore : 0;

    TrustScore score = existingOpt.orElseGet(() -> TrustScore.builder()
      .tenantId(tenantId).subjectId(req.getSubjectId()).subjectType(subjectType).revision(0).build());
    if (req.getSubjectName() != null) score.setSubjectName(req.getSubjectName());
    score.setScore(outcome.score());
    score.setBand(band);
    score.setFactors(factorsJson);
    score.setSignals(signalsJson);
    score.setRevision(score.getRevision() + 1);
    score = scoreRepository.save(score);

    historyRepository.save(TrustScoreHistory.builder()
      .tenantId(tenantId).subjectId(req.getSubjectId()).subjectType(subjectType)
      .score(outcome.score()).band(band).delta(delta).reason(req.getReason())
      .factors(factorsJson).createdBy(AuthContext.currentUserId().orElse(null))
      .build());

    log.info("Trust score computed: subject={}/{}, score={} ({}), delta={}, rev={}, tenant={}",
      subjectType, req.getSubjectId(), outcome.score(), band, delta, score.getRevision(), tenantId);
    outbox.enqueue(tenantId, "trustscore.updated", req.getSubjectId().toString(), ScoreResponse.from(score, objectMapper));
    return ScoreResponse.from(score, objectMapper);
  }

  @Transactional(readOnly = true)
  public ScoreResponse get(UUID tenantId, UUID subjectId, String subjectType) {
    return ScoreResponse.from(load(tenantId, subjectId, subjectType), objectMapper);
  }

  @Transactional(readOnly = true)
  public Page<HistoryResponse> history(UUID tenantId, UUID subjectId, String subjectType, int page, int size) {
    var pageable = PageRequest.of(page, size);
    return historyRepository
      .findByTenantIdAndSubjectIdAndSubjectTypeOrderByCreatedAtDesc(tenantId, subjectId, normalize(subjectType), pageable)
      .map(h -> HistoryResponse.from(h, objectMapper));
  }

  @Transactional(readOnly = true)
  public Page<ScoreResponse> list(UUID tenantId, String band, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "score"));
    Page<TrustScore> result = (band != null)
      ? scoreRepository.findByTenantIdAndBand(tenantId, parseBand(band), pageable)
      : scoreRepository.findByTenantId(tenantId, pageable);
    return result.map(s -> ScoreResponse.from(s, objectMapper));
  }

  // --------------------------------------------------------------------------- helpers

  private TrustScore load(UUID tenantId, UUID subjectId, String subjectType) {
    return scoreRepository.findByTenantIdAndSubjectIdAndSubjectType(tenantId, subjectId, normalize(subjectType))
      .orElseThrow(() -> new NotFoundException("No trust score for subject " + subjectId + " (" + subjectType + ")"));
  }

  private Map<String, Object> signalsOf(ComputeRequest req) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("kycLevel", req.getKycLevel());
    m.put("onTimePaymentRate", req.getOnTimePaymentRate());
    m.put("disputeRate", req.getDisputeRate());
    m.put("activityScore", req.getActivityScore());
    m.put("tenureMonths", req.getTenureMonths());
    m.put("sanctionsHits", req.getSanctionsHits());
    return m;
  }

  private String normalize(String subjectType) {
    return subjectType != null ? subjectType.trim().toUpperCase() : null;
  }

  private Band parseBand(String value) {
    try {
      return Band.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid band: " + value);
    }
  }

  private String writeJson(Object value) {
    if (value == null) return "{}";
    try { return objectMapper.writeValueAsString(value); }
    catch (Exception e) { throw new IllegalStateException("Unable to serialize JSON field", e); }
  }
}
