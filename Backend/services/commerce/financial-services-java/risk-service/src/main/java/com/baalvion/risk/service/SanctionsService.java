package com.baalvion.risk.service;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionsScreening;
import com.baalvion.risk.domain.SanctionsScreening.Status;
import com.baalvion.risk.dto.AdjudicateRequest;
import com.baalvion.risk.dto.ScreenRequest;
import com.baalvion.risk.dto.ScreeningHit;
import com.baalvion.risk.dto.ScreeningResponse;
import com.baalvion.risk.provider.SanctionsListProvider;
import com.baalvion.risk.provider.SanctionsListRecord;
import com.baalvion.risk.repository.SanctionedEntityRepository;
import com.baalvion.risk.repository.SanctionsScreeningRepository;
import com.baalvion.risk.screening.NameMatcher;
import com.baalvion.risk.screening.NameNormalizer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sanctions screening (gap G3): consolidated-watchlist ingestion + fuzzy name screening.
 *
 * <p>{@link #ingest()} upserts the active {@link SanctionsListProvider}'s records into
 * {@code sanctioned_entities} (global reference data). {@link #screen} normalizes a subject, scores it
 * with {@link NameMatcher} against every active entity's primary name and aliases, records hits above
 * the configured match threshold, and persists a tenant-scoped {@link SanctionsScreening} verdict —
 * CLEAR / POTENTIAL_MATCH / CONFIRMED_MATCH — emitting Kafka events. Compliance officers resolve
 * potential matches via {@link #adjudicate}.
 */
@Slf4j
@Service
@Transactional
public class SanctionsService {

  private final SanctionedEntityRepository entityRepository;
  private final SanctionsScreeningRepository screeningRepository;
  private final NameMatcher matcher;
  private final SanctionsProperties props;
  private final List<SanctionsListProvider> providers;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  public SanctionsService(SanctionedEntityRepository entityRepository,
                          SanctionsScreeningRepository screeningRepository,
                          NameMatcher matcher,
                          SanctionsProperties props,
                          List<SanctionsListProvider> providers,
                          KafkaTemplate<String, String> kafkaTemplate,
                          ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.screeningRepository = screeningRepository;
    this.matcher = matcher;
    this.props = props;
    this.providers = providers;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  // --------------------------------------------------------------------------- list ingestion

  /** Upsert the active provider's watchlist into {@code sanctioned_entities}. Returns rows touched. */
  public int ingest() {
    SanctionsListProvider provider = activeProvider();
    List<SanctionsListRecord> records = provider.fetch();
    int count = 0;
    int skipped = 0;
    for (SanctionsListRecord rec : records) {
      String normName = NameNormalizer.normalize(rec.getPrimaryName());
      boolean anyAliasMatchable = rec.getAliases() != null && rec.getAliases().stream()
        .anyMatch(a -> !NameNormalizer.normalize(a).isEmpty());
      if (normName.isEmpty() && !anyAliasMatchable) {
        // Fail loudly rather than store an entity with an empty matching key (which would silently
        // never produce a hit). Typically a fully non-Latin name the provider did not romanize.
        log.warn("Skipping un-screenable watchlist entity (name & all aliases normalize to empty): "
          + "source={}, externalId={}", rec.getListSource(), rec.getExternalId());
        skipped++;
        continue;
      }
      SanctionedEntity e = entityRepository
        .findByListSourceAndExternalId(rec.getListSource(), rec.getExternalId())
        .orElseGet(SanctionedEntity::new);
      e.setListSource(rec.getListSource());
      e.setExternalId(rec.getExternalId());
      e.setEntityType(rec.getEntityType());
      e.setPrimaryName(rec.getPrimaryName());
      e.setNormalizedName(normName);
      e.setAliases(writeAliases(rec.getAliases()));
      e.setPrograms(writeJson(rec.getPrograms()));
      e.setCountries(writeJson(rec.getCountries()));
      e.setDateOfBirth(rec.getDateOfBirth());
      e.setRemarks(rec.getRemarks());
      e.setActive(true);
      e.setSourcePublishedAt(rec.getSourcePublishedAt());
      entityRepository.save(e);
      count++;
    }
    log.info("Sanctions ingest from provider '{}': {} entities upserted, {} skipped (un-screenable)",
      provider.name(), count, skipped);
    return count;
  }

  public long entityCount() {
    return entityRepository.countByActiveTrue();
  }

  // --------------------------------------------------------------------------- screening

  public ScreeningResponse screen(UUID tenantId, ScreenRequest req) {
    EntityType subjectType = parseType(req.getType());
    String normalized = NameNormalizer.normalize(req.getName());
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("name has no matchable content after normalization");
    }

    double matchThreshold = props.getMatchThreshold().doubleValue();
    double autoBlock = props.getAutoBlockThreshold().doubleValue();

    // Compliance screening matches across ALL active entities (type is informational) so a missing or
    // wrong subject type never silently hides a hit. The seed list is small; for full OFAC scale add a
    // pg_trgm candidate prefilter (see V002 migration note).
    List<ScreeningHit> hits = new ArrayList<>();
    double rawTop = 0.0;  // unrounded — drives the verdict so a 0.9499 cannot round up into an auto-block
    for (SanctionedEntity entity : entityRepository.findByActiveTrue()) {
      Scored best = bestScore(normalized, entity);
      if (best.score >= matchThreshold) {
        rawTop = Math.max(rawTop, best.score);
        hits.add(ScreeningHit.builder()
          .entityId(entity.getId())
          .listSource(entity.getListSource().name())
          .entityType(entity.getEntityType().name())
          .matchedName(best.matchedName)
          .score(round(best.score))
          .programs(readList(entity.getPrograms()))
          .countries(readList(entity.getCountries()))
          .build());
      }
    }
    hits.sort(Comparator.comparing(ScreeningHit::getScore).reversed());
    if (hits.size() > props.getMaxHits()) {
      hits = new ArrayList<>(hits.subList(0, props.getMaxHits()));
    }

    BigDecimal topScore = round(rawTop);  // rounded for storage/display; verdict below uses rawTop
    Status status;
    if (rawTop >= autoBlock) {
      status = Status.CONFIRMED_MATCH;
    } else if (!hits.isEmpty()) {
      status = Status.POTENTIAL_MATCH;
    } else {
      status = Status.CLEAR;
    }

    SanctionsScreening screening = SanctionsScreening.builder()
      .tenantId(tenantId)
      .subjectName(req.getName())
      .normalizedSubject(normalized)
      .subjectType(subjectType)
      .subjectCountry(req.getCountry())
      .referenceType(req.getReferenceType())
      .referenceId(req.getReferenceId())
      .status(status)
      .topScore(topScore)
      .hits(writeJson(hits))
      .hitCount(hits.size())
      .build();
    SanctionsScreening saved = screeningRepository.save(screening);

    // Do not log the raw subject name (PII); the persisted screening row carries it under tenant scope.
    log.info("Sanctions screening: id={}, tenant={}, status={}, topScore={}, hits={}",
      saved.getId(), tenantId, status, topScore, hits.size());

    Map<String, Object> event = new HashMap<>();
    event.put("screeningId", saved.getId());
    event.put("tenantId", tenantId);
    event.put("subjectName", req.getName());
    event.put("status", status.name());
    event.put("topScore", topScore);
    event.put("hitCount", hits.size());
    event.put("referenceType", req.getReferenceType());
    event.put("referenceId", req.getReferenceId());
    publish("sanctions.screening.completed", saved.getId().toString(), event);
    if (status != Status.CLEAR) {
      publish("sanctions.match.detected", saved.getId().toString(), event);
    }

    return mapToResponse(saved, hits);
  }

  /** Best score of the subject against an entity's primary name and all aliases. */
  private Scored bestScore(String normalizedSubject, SanctionedEntity entity) {
    double best = matcher.score(normalizedSubject, entity.getNormalizedName());
    String bestName = entity.getPrimaryName();
    for (AliasEntry alias : readAliases(entity.getAliases())) {
      double s = matcher.score(normalizedSubject, alias.getNormalized());
      if (s > best) {
        best = s;
        bestName = alias.getName();
      }
    }
    return new Scored(best, bestName);
  }

  // --------------------------------------------------------------------------- adjudication / reads

  /** Compliance-officer resolution of a potential/confirmed match. */
  public ScreeningResponse adjudicate(UUID tenantId, UUID screeningId, String officerId, AdjudicateRequest req) {
    SanctionsScreening s = screeningRepository.findByIdAndTenantId(screeningId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Screening not found: " + screeningId));
    if (s.getStatus() == Status.CLEAR) {
      throw new IllegalStateException("A CLEAR screening has nothing to adjudicate");
    }
    s.setStatus(Boolean.TRUE.equals(req.getConfirmed()) ? Status.BLOCKED : Status.FALSE_POSITIVE);
    s.setAdjudicatedBy(officerId);
    s.setAdjudicationNote(req.getNote());
    s.setAdjudicatedAt(LocalDateTime.now());
    SanctionsScreening saved = screeningRepository.save(s);
    log.info("Sanctions screening adjudicated: id={}, tenant={}, status={}, by={}",
      screeningId, tenantId, saved.getStatus(), officerId);

    Map<String, Object> event = new HashMap<>();
    event.put("screeningId", saved.getId());
    event.put("tenantId", tenantId);
    event.put("status", saved.getStatus().name());
    publish("sanctions.screening.adjudicated", saved.getId().toString(), event);
    return mapToResponse(saved, readHits(saved.getHits()));
  }

  @Transactional(readOnly = true)
  public ScreeningResponse get(UUID tenantId, UUID id) {
    SanctionsScreening s = screeningRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Screening not found: " + id));
    return mapToResponse(s, readHits(s.getHits()));
  }

  @Transactional(readOnly = true)
  public Page<ScreeningResponse> list(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<SanctionsScreening> result = status != null
      ? screeningRepository.findByTenantIdAndStatus(tenantId, Status.valueOf(status.toUpperCase()), pageable)
      : screeningRepository.findByTenantId(tenantId, pageable);
    return result.map(s -> mapToResponse(s, readHits(s.getHits())));
  }

  // --------------------------------------------------------------------------- helpers

  private SanctionsListProvider activeProvider() {
    return providers.stream()
      .filter(p -> p.name().equalsIgnoreCase(props.getProvider()))
      .findFirst()
      .orElseThrow(() -> new IllegalStateException(
        "No sanctions list provider named '" + props.getProvider() + "'. Available: "
          + providers.stream().map(SanctionsListProvider::name).toList()));
  }

  private EntityType parseType(String type) {
    if (type == null || type.isBlank()) {
      return EntityType.INDIVIDUAL;
    }
    try {
      return EntityType.valueOf(type.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid subject type: " + type);
    }
  }

  private BigDecimal round(double score) {
    return BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP);
  }

  private String writeAliases(List<String> names) {
    List<AliasEntry> entries = new ArrayList<>();
    if (names != null) {
      for (String n : names) {
        entries.add(new AliasEntry(n, NameNormalizer.normalize(n)));
      }
    }
    return writeJson(entries);
  }

  private List<AliasEntry> readAliases(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, new TypeReference<List<AliasEntry>>() {});
    } catch (Exception e) {
      log.warn("Unparseable aliases JSON: {}", e.getMessage());
      return List.of();
    }
  }

  private List<ScreeningHit> readHits(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, new TypeReference<List<ScreeningHit>>() {});
    } catch (Exception e) {
      log.warn("Unparseable hits JSON: {}", e.getMessage());
      return List.of();
    }
  }

  private List<String> readList(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, new TypeReference<List<String>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  private String writeJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value == null ? List.of() : value);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to serialize JSON field", e);
    }
  }

  private void publish(String topic, String key, Object payload) {
    try {
      kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
    } catch (Exception e) {
      log.error("Failed to publish {} for {}: {}", topic, key, e.getMessage());
    }
  }

  private ScreeningResponse mapToResponse(SanctionsScreening s, List<ScreeningHit> hits) {
    return ScreeningResponse.builder()
      .id(s.getId())
      .tenantId(s.getTenantId())
      .subjectName(s.getSubjectName())
      .subjectType(s.getSubjectType().name())
      .subjectCountry(s.getSubjectCountry())
      .referenceType(s.getReferenceType())
      .referenceId(s.getReferenceId())
      .status(s.getStatus().name())
      .topScore(s.getTopScore())
      .hitCount(s.getHitCount())
      .hits(hits)
      .adjudicatedBy(s.getAdjudicatedBy())
      .adjudicationNote(s.getAdjudicationNote())
      .adjudicatedAt(s.getAdjudicatedAt())
      .createdAt(s.getCreatedAt())
      .build();
  }

  private record Scored(double score, String matchedName) {}

  /** Alias name + its normalized form, persisted in the entity's {@code aliases} jsonb. */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AliasEntry {
    private String name;
    private String normalized;
  }
}
