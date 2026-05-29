package com.baalvion.reconciliation.service;

import com.baalvion.reconciliation.domain.ReconciliationItem;
import com.baalvion.reconciliation.domain.ReconciliationItem.ItemStatus;
import com.baalvion.reconciliation.domain.ReconciliationRun;
import com.baalvion.reconciliation.domain.ReconciliationRun.RunStatus;
import com.baalvion.reconciliation.dto.*;
import com.baalvion.reconciliation.repository.ReconciliationItemRepository;
import com.baalvion.reconciliation.repository.ReconciliationRunRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class ReconciliationService {

  private final ReconciliationRunRepository runRepository;
  private final ReconciliationItemRepository itemRepository;
  private final KafkaTemplate<String, Object> kafkaTemplate;

  public ReconciliationService(
    ReconciliationRunRepository runRepository,
    ReconciliationItemRepository itemRepository,
    KafkaTemplate<String, Object> kafkaTemplate
  ) {
    this.runRepository = runRepository;
    this.itemRepository = itemRepository;
    this.kafkaTemplate = kafkaTemplate;
  }

  /**
   * Reconcile internal records against an inbound external advice.
   * Matching is keyed by transactionRef:
   *   - present on both, equal amounts      -> MATCHED
   *   - present on both, amounts differ     -> EXCEPTION
   *   - present externally only             -> UNMATCHED (missing internal)
   *   - present internally only             -> UNMATCHED (missing external)
   */
  public RunResponse reconcile(UUID tenantId, ReconcileRequest request) {
    var existing = runRepository.findByTenantAndRef(tenantId, request.getRunRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: runRef={} already exists for tenant={}", request.getRunRef(), tenantId);
      return mapRun(existing.get());
    }

    // Index internal records by reference (last one wins on duplicates).
    Map<String, BigDecimal> internal = new LinkedHashMap<>();
    for (ReconRecord r : request.getInternalRecords()) {
      internal.put(r.getTransactionRef(), r.getAmount());
    }

    var run = ReconciliationRun.builder()
      .tenantId(tenantId)
      .runRef(request.getRunRef())
      .sourceFile(request.getSourceFile())
      .batchRef(request.getBatchRef())
      .status(RunStatus.COMPLETED)
      .build();
    var savedRun = runRepository.save(run);

    List<ReconciliationItem> items = new ArrayList<>();
    Map<String, Boolean> consumed = new HashMap<>();
    int matched = 0;
    int exceptions = 0;
    int unmatched = 0;

    // Walk external records.
    for (ReconRecord ext : request.getExternalRecords()) {
      BigDecimal internalAmount = internal.get(ext.getTransactionRef());
      ReconciliationItem.ReconciliationItemBuilder builder = ReconciliationItem.builder()
        .tenantId(tenantId)
        .runId(savedRun.getId())
        .transactionRef(ext.getTransactionRef())
        .externalAmount(ext.getAmount())
        .internalAmount(internalAmount);

      if (internalAmount == null) {
        builder.status(ItemStatus.UNMATCHED)
          .exceptionReason("No matching internal record");
        unmatched++;
      } else {
        consumed.put(ext.getTransactionRef(), true);
        if (internalAmount.compareTo(ext.getAmount()) == 0) {
          builder.status(ItemStatus.MATCHED);
          matched++;
        } else {
          builder.status(ItemStatus.EXCEPTION)
            .exceptionReason("Amount mismatch: internal=" + internalAmount + ", external=" + ext.getAmount());
          exceptions++;
        }
      }
      items.add(builder.build());
    }

    // Internal records that were never matched by an external one.
    for (Map.Entry<String, BigDecimal> entry : internal.entrySet()) {
      if (consumed.containsKey(entry.getKey())) {
        continue;
      }
      items.add(ReconciliationItem.builder()
        .tenantId(tenantId)
        .runId(savedRun.getId())
        .transactionRef(entry.getKey())
        .internalAmount(entry.getValue())
        .status(ItemStatus.UNMATCHED)
        .exceptionReason("No matching external record")
        .build());
      unmatched++;
    }

    itemRepository.saveAll(items);

    savedRun.setTotalRecords(items.size());
    savedRun.setMatchedCount(matched);
    savedRun.setExceptionCount(exceptions);
    savedRun.setUnmatchedCount(unmatched);
    savedRun.setStatus((exceptions + unmatched) > 0 ? RunStatus.COMPLETED_WITH_EXCEPTIONS : RunStatus.COMPLETED);
    var finalRun = runRepository.save(savedRun);

    log.info("Reconciliation run completed: id={}, tenant={}, ref={}, total={}, matched={}, exceptions={}, unmatched={}",
      finalRun.getId(), tenantId, finalRun.getRunRef(), items.size(), matched, exceptions, unmatched);

    Map<String, Object> event = new HashMap<>();
    event.put("runId", finalRun.getId());
    event.put("tenantId", tenantId);
    event.put("batchRef", finalRun.getBatchRef());
    event.put("matchedCount", matched);
    event.put("exceptionCount", exceptions + unmatched);
    kafkaTemplate.send("settlement.batch.reconciled", finalRun.getId().toString(), event);

    return mapRun(finalRun);
  }

  @Transactional(readOnly = true)
  public RunResponse getRun(UUID tenantId, UUID runId) {
    return mapRun(loadRun(tenantId, runId));
  }

  @Transactional(readOnly = true)
  public Page<RunResponse> listRuns(UUID tenantId, int page, int size) {
    return runRepository.findByTenant(tenantId, PageRequest.of(page, size)).map(this::mapRun);
  }

  @Transactional(readOnly = true)
  public List<ReconItemResponse> getRunItems(UUID tenantId, UUID runId) {
    loadRun(tenantId, runId);
    return itemRepository.findByRun(tenantId, runId).stream().map(this::mapItem).toList();
  }

  @Transactional(readOnly = true)
  public Page<ReconItemResponse> listItems(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ReconciliationItem> items = status != null
      ? itemRepository.findByTenantAndStatus(tenantId, ItemStatus.valueOf(status), pageable)
      : itemRepository.findByTenant(tenantId, pageable);
    return items.map(this::mapItem);
  }

  public ReconItemResponse resolveItem(UUID tenantId, UUID itemId, ResolveItemRequest request) {
    var item = itemRepository.findByIdAndTenant(itemId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Reconciliation item not found: " + itemId));

    if (item.getStatus() == ItemStatus.MATCHED) {
      throw new IllegalStateException("MATCHED items do not require resolution");
    }
    if (item.getStatus() == ItemStatus.RESOLVED) {
      return mapItem(item);
    }

    item.setStatus(ItemStatus.RESOLVED);
    item.setResolvedBy(request != null ? request.getResolvedBy() : null);
    item.setResolvedAt(LocalDateTime.now());
    if (request != null && request.getResolutionNote() != null) {
      item.setExceptionReason(item.getExceptionReason() + " | RESOLVED: " + request.getResolutionNote());
    }
    var saved = itemRepository.save(item);
    log.info("Reconciliation item resolved: id={}, tenant={}, by={}", itemId, tenantId, item.getResolvedBy());
    return mapItem(saved);
  }

  private ReconciliationRun loadRun(UUID tenantId, UUID runId) {
    return runRepository.findByIdAndTenant(runId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Reconciliation run not found: " + runId));
  }

  private RunResponse mapRun(ReconciliationRun r) {
    return RunResponse.builder()
      .id(r.getId())
      .tenantId(r.getTenantId())
      .runRef(r.getRunRef())
      .sourceFile(r.getSourceFile())
      .batchRef(r.getBatchRef())
      .totalRecords(r.getTotalRecords())
      .matchedCount(r.getMatchedCount())
      .exceptionCount(r.getExceptionCount())
      .unmatchedCount(r.getUnmatchedCount())
      .status(r.getStatus().name())
      .createdAt(r.getCreatedAt())
      .updatedAt(r.getUpdatedAt())
      .build();
  }

  private ReconItemResponse mapItem(ReconciliationItem i) {
    return ReconItemResponse.builder()
      .id(i.getId())
      .runId(i.getRunId())
      .transactionRef(i.getTransactionRef())
      .internalAmount(i.getInternalAmount())
      .externalAmount(i.getExternalAmount())
      .status(i.getStatus().name())
      .exceptionReason(i.getExceptionReason())
      .resolvedBy(i.getResolvedBy())
      .resolvedAt(i.getResolvedAt())
      .createdAt(i.getCreatedAt())
      .updatedAt(i.getUpdatedAt())
      .build();
  }
}
