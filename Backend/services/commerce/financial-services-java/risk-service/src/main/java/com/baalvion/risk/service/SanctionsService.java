package com.baalvion.risk.service;

import com.baalvion.risk.config.SanctionsEnforcement;
import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import com.baalvion.risk.exception.SanctionsUnavailableException;
import com.baalvion.risk.domain.SanctionsAliasIndex;
import com.baalvion.risk.domain.SanctionsScreening;
import com.baalvion.risk.domain.SanctionsScreening.Status;
import com.baalvion.risk.domain.SanctionsSourceMap;
import com.baalvion.risk.dto.AdjudicateRequest;
import com.baalvion.risk.dto.ScreenRequest;
import com.baalvion.risk.dto.ScreeningHit;
import com.baalvion.risk.dto.ScreeningResponse;
import com.baalvion.risk.normalization.SanctionsNormalizer;
import com.baalvion.risk.provider.SanctionsListProvider;
import com.baalvion.risk.provider.SanctionsListRecord;
import com.baalvion.risk.repository.SanctionedEntityRepository;
import com.baalvion.risk.repository.SanctionsAliasIndexRepository;
import com.baalvion.risk.repository.SanctionsScreeningRepository;
import com.baalvion.risk.repository.SanctionsSourceMapRepository;
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
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

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
  private final SanctionsSourceMapRepository sourceMapRepository;
  private final SanctionsAliasIndexRepository aliasIndexRepository;
  private final NameMatcher matcher;
  private final SanctionsProperties props;
  private final List<SanctionsListProvider> providers;
  private final SanctionsDatasetStatus datasetStatus;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  // In-memory active-watchlist snapshot (the DB is the durable cache). Evicted on ingest, else
  // reloaded when older than app.sanctions.cache-ttl-seconds — so a full OFAC list (~17k rows) is not
  // re-queried from Postgres on every screen request. Held as a single immutable reference so the
  // entities and their load time are always read/written atomically (no torn read across two volatiles).
  private record Snapshot(List<SanctionedEntity> entities, long loadedMs) {}

  private final AtomicReference<Snapshot> snapshotRef = new AtomicReference<>();

  public SanctionsService(SanctionedEntityRepository entityRepository,
                          SanctionsScreeningRepository screeningRepository,
                          SanctionsSourceMapRepository sourceMapRepository,
                          SanctionsAliasIndexRepository aliasIndexRepository,
                          NameMatcher matcher,
                          SanctionsProperties props,
                          List<SanctionsListProvider> providers,
                          SanctionsDatasetStatus datasetStatus,
                          KafkaTemplate<String, String> kafkaTemplate,
                          ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.screeningRepository = screeningRepository;
    this.sourceMapRepository = sourceMapRepository;
    this.aliasIndexRepository = aliasIndexRepository;
    this.matcher = matcher;
    this.props = props;
    this.providers = providers;
    this.datasetStatus = datasetStatus;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  // --------------------------------------------------------------------------- list ingestion

  /**
   * Ingest from ALL enabled providers into the unified index. Each provider runs independently: a
   * provider failure (e.g. its external feed is down) is logged and skipped — its previously-ingested
   * rows remain (last-known-good), and the other providers still ingest. Returns total rows upserted.
   */
  public int ingest() {
    int total = 0;
    for (SanctionsListProvider provider : providers) {
      total += ingestOne(provider);
    }
    snapshotRef.set(null);  // evict the screening cache once after the full refresh
    return total;
  }

  /** Refresh a single named provider (used by the per-provider scheduled jobs). Fail-isolated. */
  public int ingestProvider(String name) {
    SanctionsListProvider provider = providers.stream()
      .filter(p -> p.name().equalsIgnoreCase(name)).findFirst().orElse(null);
    if (provider == null) {
      log.debug("Sanctions provider '{}' not enabled; skipping scheduled refresh", name);
      return 0;
    }
    int n = ingestOne(provider);
    snapshotRef.set(null);
    return n;
  }

  /** Fetch + normalize + upsert one provider. Never throws — fail-independent (last-known-good kept). */
  private int ingestOne(SanctionsListProvider provider) {
    datasetStatus.recordAttempt(provider.name());
    List<SanctionsListRecord> records;
    try {
      records = provider.fetch();
    } catch (Exception e) {
      datasetStatus.recordFailure(provider.name(), e.getMessage());
      log.error("Sanctions provider '{}' fetch FAILED — keeping last-known-good data: {}",
        provider.name(), e.getMessage());
      return 0;
    }
    int count = 0;
    int skipped = 0;
    for (SanctionsListRecord rec : records) {
      try {
        if (upsertRecord(rec)) {
          count++;
        } else {
          skipped++;
        }
      } catch (Exception e) {
        skipped++;
        log.warn("Sanctions upsert failed for source={} externalId={}: {}",
          rec.getListSource(), rec.getExternalId(), e.getMessage());
      }
    }
    datasetStatus.recordSuccess(provider.name(), count);
    log.info("Sanctions ingest from provider '{}': {} entities upserted, {} skipped",
      provider.name(), count, skipped);
    return count;
  }

  /**
   * Canonical normalization + upsert of one raw record into the entity index, source map, and alias
   * index. Returns false (skipped) if the record has no matchable name in any language.
   */
  private boolean upsertRecord(SanctionsListRecord rec) {
    String normName = NameNormalizer.normalize(rec.getPrimaryName());
    boolean anyAliasMatchable = rec.getAliases() != null && rec.getAliases().stream()
      .anyMatch(a -> !NameNormalizer.normalize(a).isEmpty());
    if (normName.isEmpty() && !anyAliasMatchable) {
      log.warn("Skipping un-screenable watchlist entity (name & all aliases normalize to empty): "
        + "source={}, externalId={}", rec.getListSource(), rec.getExternalId());
      return false;
    }

    // Canonical normalization layer (source-agnostic): ISO countries + cross-source merge key.
    List<String> iso = SanctionsNormalizer.isoCountries(rec.getCountries());
    String mergeKey = SanctionsNormalizer.mergeKey(normName, iso, rec.getEntityType());

    SanctionedEntity e = entityRepository
      .findByListSourceAndExternalId(rec.getListSource(), rec.getExternalId())
      .orElseGet(SanctionedEntity::new);
    e.setListSource(rec.getListSource());
    e.setExternalId(rec.getExternalId());
    e.setEntityType(rec.getEntityType());
    e.setPrimaryName(rec.getPrimaryName());
    e.setNormalizedName(normName);
    e.setMergeKey(mergeKey);
    e.setAliases(writeAliases(rec.getAliases()));
    e.setPrograms(writeJson(rec.getPrograms()));
    e.setCountries(writeJson(iso));
    e.setAddresses(writeJson(rec.getAddresses() != null ? rec.getAddresses() : List.of()));
    e.setDateOfBirth(rec.getDateOfBirth());
    e.setRemarks(rec.getRemarks());
    e.setActive(true);
    e.setSourcePublishedAt(rec.getSourcePublishedAt());
    SanctionedEntity saved = entityRepository.save(e);

    // Cross-source map (traceability + sourceIds): upsert by (source, externalId).
    SanctionsSourceMap map = sourceMapRepository
      .findByListSourceAndExternalId(rec.getListSource().name(), rec.getExternalId())
      .orElseGet(SanctionsSourceMap::new);
    map.setMergeKey(mergeKey);
    map.setListSource(rec.getListSource().name());
    map.setExternalId(rec.getExternalId());
    map.setEntityId(saved.getId());
    sourceMapRepository.save(map);

    // Alias index: rebuild this entity's rows (primary + each alias, normalized, distinct).
    aliasIndexRepository.deleteByEntityId(saved.getId());
    java.util.Set<String> indexed = new java.util.LinkedHashSet<>();
    if (!normName.isEmpty()) indexed.add(normName);
    if (rec.getAliases() != null) {
      for (String a : rec.getAliases()) {
        String n = NameNormalizer.normalize(a);
        if (!n.isEmpty()) indexed.add(n);
      }
    }
    for (String an : indexed) {
      aliasIndexRepository.save(SanctionsAliasIndex.builder()
        .entityId(saved.getId()).listSource(rec.getListSource().name()).aliasNormalized(an).build());
    }
    return true;
  }

  /** Cached active-watchlist snapshot (TTL'd; evicted on ingest). Called within screen()'s transaction. */
  private List<SanctionedEntity> activeEntities() {
    Snapshot snap = snapshotRef.get();
    if (snap != null && (System.currentTimeMillis() - snap.loadedMs()) < props.getCacheTtlSeconds() * 1000L) {
      return snap.entities();
    }
    List<SanctionedEntity> loaded = entityRepository.findByActiveTrue();
    snapshotRef.set(new Snapshot(loaded, System.currentTimeMillis()));
    return loaded;
  }

  @Transactional(readOnly = true)
  public long entityCount() {
    return entityRepository.countByActiveTrue();
  }

  /** Active entity count for one authoritative source (boot sanity + health). */
  @Transactional(readOnly = true)
  public long entityCount(ListSource source) {
    return entityRepository.countByListSourceAndActiveTrue(source);
  }

  /** Newest {@code updatedAt} among a source's active entities — the dataset freshness signal. */
  @Transactional(readOnly = true)
  public Optional<LocalDateTime> latestUpdate(ListSource source) {
    return entityRepository.findFirstByListSourceAndActiveTrueOrderByUpdatedAtDesc(source)
      .map(SanctionedEntity::getUpdatedAt);
  }

  /** Active count + freshness for a source, read in ONE transaction so health never sees a torn view. */
  public record SourceSnapshotInfo(long count, Optional<LocalDateTime> latestUpdate) {}

  @Transactional(readOnly = true)
  public SourceSnapshotInfo sourceInfo(ListSource source) {
    long count = entityRepository.countByListSourceAndActiveTrue(source);
    Optional<LocalDateTime> latest = entityRepository
      .findFirstByListSourceAndActiveTrueOrderByUpdatedAtDesc(source)
      .map(SanctionedEntity::getUpdatedAt);
    return new SourceSnapshotInfo(count, latest);
  }

  /**
   * Boot-time sample validation (gap G3): take up to {@code sampleSize} loaded entities and confirm each
   * screens against its OWN primary name at/above the match threshold. This exercises the real
   * normalize → match pipeline against real loaded data (not config, not a mock), proving the watchlist is
   * actually screenable rather than merely "rows exist". Returns how many of the sampled entities matched.
   */
  @Transactional(readOnly = true)
  public int sampleSelfMatch(int sampleSize) {
    List<SanctionedEntity> snapshot = activeEntities();
    if (snapshot.isEmpty()) {
      return 0;
    }
    // Shuffle a copy so the sample spans sources/positions rather than only the first-inserted provider —
    // a source-specific normalization bug can't hide behind whichever list happened to load first.
    List<SanctionedEntity> pool = new ArrayList<>(snapshot);
    Collections.shuffle(pool);
    double threshold = props.getMatchThreshold().doubleValue();
    int limit = Math.min(sampleSize, pool.size());
    int matched = 0;
    for (int i = 0; i < limit; i++) {
      SanctionedEntity e = pool.get(i);
      if (matcher.score(NameNormalizer.normalize(e.getPrimaryName()), e.getNormalizedName()) >= threshold) {
        matched++;
      }
    }
    return matched;
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
    List<SanctionedEntity> snapshot = activeEntities();
    // Fail CLOSED: under STRICT enforcement an empty watchlist must NOT yield a (false) CLEAR. Refuse to
    // evaluate so the caller sees a 503 rather than a misleading "no sanctions match". Boot validation
    // makes this near-impossible, but a watchlist that empties at runtime must never fail open.
    if (props.getEnforcement() == SanctionsEnforcement.STRICT && snapshot.isEmpty()) {
      throw new SanctionsUnavailableException(
        "Sanctions watchlist is empty — refusing to screen under STRICT enforcement (fail-closed). "
          + "The authoritative lists are not loaded; investigate provider ingestion before screening resumes.");
    }
    List<ScreeningHit> hits = new ArrayList<>();
    double rawTop = 0.0;  // unrounded — drives the verdict so a 0.9499 cannot round up into an auto-block
    for (SanctionedEntity entity : snapshot) {
      Scored best = bestScore(normalized, entity);
      if (best.score >= matchThreshold) {
        rawTop = Math.max(rawTop, best.score);
        String code = entity.getListSource().code();
        hits.add(ScreeningHit.builder()
          .entityId(entity.getId())
          .listSource(entity.getListSource().name())
          .source(code)
          .entityType(entity.getEntityType().name())
          .matchedName(best.matchedName)
          .score(round(best.score))
          // Per-source reliability-weighted confidence (additive; does NOT change the verdict).
          .sourceConfidence(round(best.score * sourceWeight(code)))
          .mergeKey(entity.getMergeKey())
          .programs(readList(entity.getPrograms()))
          .countries(readList(entity.getCountries()))
          .build());
      }
    }
    hits.sort(Comparator.comparing(ScreeningHit::getScore).reversed());
    hits = dedupBySourceAndEntity(hits);  // cross-source dedup: best hit per (logical entity, source)
    if (hits.size() > props.getMaxHits()) {
      hits = new ArrayList<>(hits.subList(0, props.getMaxHits()));
    }
    // Sources actually present in the index and screened against this request.
    List<String> sourcesChecked = snapshot.stream()
      .map(e -> e.getListSource().code()).distinct().sorted().toList();

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
    // Observability: per-source match breakdown for this request.
    log.info("Sanctions screening: id={}, tenant={}, status={}, topScore={}, hits={}, sources={}, breakdown={}",
      saved.getId(), tenantId, status, topScore, hits.size(), sourcesChecked, sourceBreakdown(hits));

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

    return mapToResponse(saved, hits, sourcesChecked);
  }

  /** Cross-source dedup: hits are pre-sorted by score desc; keep the first (best) per (entity, source). */
  private List<ScreeningHit> dedupBySourceAndEntity(List<ScreeningHit> sortedHits) {
    Map<String, ScreeningHit> bestByKey = new java.util.LinkedHashMap<>();
    for (ScreeningHit h : sortedHits) {
      String entityKey = (h.getMergeKey() != null && !h.getMergeKey().isBlank())
        ? h.getMergeKey() : String.valueOf(h.getEntityId());
      bestByKey.putIfAbsent(entityKey + "||" + h.getSource(), h);
    }
    return new ArrayList<>(bestByKey.values());
  }

  /** Per-source hit count for observability. */
  private Map<String, Long> sourceBreakdown(List<ScreeningHit> hits) {
    Map<String, Long> m = new java.util.LinkedHashMap<>();
    for (ScreeningHit h : hits) {
      m.merge(h.getSource(), 1L, Long::sum);
    }
    return m;
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
    return mapToResponse(saved, readHits(saved.getHits()), List.of());
  }

  @Transactional(readOnly = true)
  public ScreeningResponse get(UUID tenantId, UUID id) {
    SanctionsScreening s = screeningRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Screening not found: " + id));
    return mapToResponse(s, readHits(s.getHits()), List.of());
  }

  @Transactional(readOnly = true)
  public Page<ScreeningResponse> list(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<SanctionsScreening> result = status != null
      ? screeningRepository.findByTenantIdAndStatus(tenantId, Status.valueOf(status.toUpperCase()), pageable)
      : screeningRepository.findByTenantId(tenantId, pageable);
    return result.map(s -> mapToResponse(s, readHits(s.getHits()), List.of()));
  }

  // --------------------------------------------------------------------------- helpers

  private double sourceWeight(String sourceCode) {
    return props.getSourceWeights().getOrDefault(sourceCode, props.getDefaultSourceWeight());
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

  private ScreeningResponse mapToResponse(SanctionsScreening s, List<ScreeningHit> hits, List<String> sourcesChecked) {
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
      .sourcesChecked(sourcesChecked == null ? List.of() : sourcesChecked)
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
