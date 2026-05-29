package com.baalvion.settlement.service;

import com.baalvion.settlement.domain.SettlementBatch;
import com.baalvion.settlement.domain.SettlementBatch.BatchStatus;
import com.baalvion.settlement.domain.SettlementBatch.Scheme;
import com.baalvion.settlement.domain.SettlementBatch.SettlementType;
import com.baalvion.settlement.domain.SettlementItem;
import com.baalvion.settlement.domain.SettlementItem.ItemStatus;
import com.baalvion.settlement.dto.BatchResponse;
import com.baalvion.settlement.dto.CreateBatchRequest;
import com.baalvion.settlement.dto.SettlementItemRequest;
import com.baalvion.settlement.dto.SettlementItemResponse;
import com.baalvion.settlement.repository.SettlementBatchRepository;
import com.baalvion.settlement.repository.SettlementItemRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class SettlementService {

  private final SettlementBatchRepository batchRepository;
  private final SettlementItemRepository itemRepository;
  private final SchemeFileGenerator fileGenerator;
  private final com.baalvion.settlement.transport.SettlementFileTransport fileTransport;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  public SettlementService(
    SettlementBatchRepository batchRepository,
    SettlementItemRepository itemRepository,
    SchemeFileGenerator fileGenerator,
    com.baalvion.settlement.transport.SettlementFileTransport fileTransport,
    KafkaTemplate<String, String> kafkaTemplate,
    ObjectMapper objectMapper
  ) {
    this.batchRepository = batchRepository;
    this.itemRepository = itemRepository;
    this.fileGenerator = fileGenerator;
    this.fileTransport = fileTransport;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  private void publish(String topic, String key, Object payload) {
    try {
      kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
    } catch (Exception e) {
      log.error("Failed to publish {} for {}: {}", topic, key, e.getMessage());
    }
  }

  /**
   * Auto-feed (design §5.4): accumulate a completed payment into the open T+1 batch for its
   * (scheme, currency, settlement date). Idempotent per transaction.
   */
  public void addCompletedPayment(UUID tenantId, UUID transactionId, String transactionRef,
                                  Scheme scheme, BigDecimal amount, BigDecimal fee, String currency, LocalDate date) {
    if (itemRepository.existsByTenantAndTransaction(tenantId, transactionId)) {
      log.debug("Settlement item already recorded for txn {}", transactionId);
      return;
    }
    String batchRef = "AUTO-" + scheme.name() + "-" + date + "-" + currency;
    SettlementBatch batch = batchRepository.findOpenBatch(tenantId, scheme, currency, date, BatchStatus.PENDING)
      .orElseGet(() -> batchRepository.save(SettlementBatch.builder()
        .tenantId(tenantId)
        .batchRef(batchRef)
        .scheme(scheme)
        .settlementType(SettlementType.T1)
        .settlementDate(date)
        .currency(currency)
        .totalAmount(BigDecimal.ZERO)
        .totalFees(BigDecimal.ZERO)
        .netAmount(BigDecimal.ZERO)
        .recordCount(0)
        .status(BatchStatus.PENDING)
        .build()));

    itemRepository.save(SettlementItem.builder()
      .tenantId(tenantId)
      .batchId(batch.getId())
      .transactionId(transactionId)
      .transactionRef(transactionRef)
      .amount(amount)
      .fee(fee)
      .status(ItemStatus.PENDING)
      .build());

    batch.setTotalAmount(batch.getTotalAmount().add(amount));
    batch.setTotalFees(batch.getTotalFees().add(fee));
    batch.setNetAmount(batch.getTotalAmount().subtract(batch.getTotalFees()));
    batch.setRecordCount(batch.getRecordCount() + 1);
    batchRepository.save(batch);
    log.info("Settlement auto-feed: txn {} → batch {} (scheme={}, records={})", transactionId, batch.getBatchRef(), scheme, batch.getRecordCount());
  }

  public BatchResponse createBatch(UUID tenantId, CreateBatchRequest request) {
    var existing = batchRepository.findByTenantAndRef(tenantId, request.getBatchRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: batchRef={} already exists for tenant={}", request.getBatchRef(), tenantId);
      return mapToResponse(existing.get());
    }

    Scheme scheme = Scheme.valueOf(request.getScheme());
    SettlementType type = SettlementType.valueOf(request.getSettlementType());

    BigDecimal totalAmount = BigDecimal.ZERO;
    BigDecimal totalFees = BigDecimal.ZERO;
    for (SettlementItemRequest item : request.getItems()) {
      totalAmount = totalAmount.add(item.getAmount());
      totalFees = totalFees.add(item.getFee());
    }

    var batch = SettlementBatch.builder()
      .tenantId(tenantId)
      .batchRef(request.getBatchRef())
      .scheme(scheme)
      .settlementType(type)
      .settlementDate(request.getSettlementDate())
      .currency(request.getCurrency())
      .totalAmount(totalAmount)
      .totalFees(totalFees)
      .netAmount(totalAmount.subtract(totalFees))
      .recordCount(request.getItems().size())
      .status(BatchStatus.PENDING)
      .build();

    var savedBatch = batchRepository.save(batch);

    for (SettlementItemRequest item : request.getItems()) {
      itemRepository.save(SettlementItem.builder()
        .tenantId(tenantId)
        .batchId(savedBatch.getId())
        .transactionId(item.getTransactionId())
        .transactionRef(item.getTransactionRef())
        .amount(item.getAmount())
        .fee(item.getFee())
        .status(ItemStatus.PENDING)
        .build());
    }

    log.info("Settlement batch created: id={}, tenant={}, ref={}, scheme={}, records={}, net={}",
      savedBatch.getId(), tenantId, savedBatch.getBatchRef(), scheme, savedBatch.getRecordCount(), savedBatch.getNetAmount());

    return mapToResponse(savedBatch);
  }

  public BatchResponse generateFile(UUID tenantId, UUID batchId) {
    var batch = loadBatch(tenantId, batchId);
    if (batch.getStatus() != BatchStatus.PENDING) {
      throw new IllegalStateException("Only PENDING batches can be generated; current status=" + batch.getStatus());
    }

    List<SettlementItem> items = itemRepository.findByBatch(tenantId, batchId);
    SchemeFileGenerator.GeneratedFile file = fileGenerator.generate(batch, items);

    batch.setFileName(file.fileName());
    batch.setFileContent(file.content());
    batch.setFileChecksum(file.checksum());
    batch.setGeneratedAt(LocalDateTime.now());
    batch.setStatus(BatchStatus.GENERATED);
    items.forEach(i -> i.setStatus(ItemStatus.SETTLED));
    itemRepository.saveAll(items);
    var saved = batchRepository.save(batch);

    log.info("Settlement file generated: batch={}, tenant={}, file={}, checksum={}",
      batchId, tenantId, file.fileName(), file.checksum());

    Map<String, Object> event = new HashMap<>();
    event.put("batchId", saved.getId());
    event.put("tenantId", tenantId);
    event.put("scheme", saved.getScheme().name());
    event.put("totalAmount", saved.getTotalAmount());
    event.put("netAmount", saved.getNetAmount());
    event.put("recordCount", saved.getRecordCount());
    event.put("fileName", saved.getFileName());
    event.put("fileChecksum", saved.getFileChecksum());
    publish("settlement.batch.created", saved.getId().toString(), event);

    return mapToResponse(saved);
  }

  public BatchResponse submit(UUID tenantId, UUID batchId) {
    var batch = loadBatch(tenantId, batchId);
    if (batch.getStatus() != BatchStatus.GENERATED) {
      throw new IllegalStateException("Only GENERATED batches can be submitted; current status=" + batch.getStatus());
    }
    batch.setStatus(BatchStatus.SUBMITTED);
    batch.setSubmittedAt(LocalDateTime.now());
    var saved = batchRepository.save(batch);

    // Deliver the generated file to the scheme endpoint (SFTP/email/S3 via the transport bean).
    fileTransport.deliver(saved.getScheme().name(), saved.getFileName(), saved.getFileContent());

    log.info("Settlement batch submitted: batch={}, tenant={}", batchId, tenantId);
    publish("settlement.batch.submitted", saved.getId().toString(), Map.of("batchId", saved.getId(), "tenantId", tenantId));
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public BatchResponse getBatch(UUID tenantId, UUID batchId) {
    return mapToResponse(loadBatch(tenantId, batchId));
  }

  @Transactional(readOnly = true)
  public String getFileContent(UUID tenantId, UUID batchId) {
    var batch = loadBatch(tenantId, batchId);
    if (batch.getFileContent() == null) {
      throw new IllegalStateException("File not generated for batch " + batchId);
    }
    return batch.getFileContent();
  }

  @Transactional(readOnly = true)
  public List<SettlementItemResponse> getItems(UUID tenantId, UUID batchId) {
    loadBatch(tenantId, batchId);
    return itemRepository.findByBatch(tenantId, batchId).stream().map(this::mapItem).toList();
  }

  @Transactional(readOnly = true)
  public Page<BatchResponse> listBatches(UUID tenantId, String scheme, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<SettlementBatch> batches;
    if (scheme != null) {
      batches = batchRepository.findByTenantAndScheme(tenantId, Scheme.valueOf(scheme), pageable);
    } else if (status != null) {
      batches = batchRepository.findByTenantAndStatus(tenantId, BatchStatus.valueOf(status), pageable);
    } else {
      batches = batchRepository.findByTenant(tenantId, pageable);
    }
    return batches.map(this::mapToResponse);
  }

  private SettlementBatch loadBatch(UUID tenantId, UUID batchId) {
    return batchRepository.findByIdAndTenant(batchId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Settlement batch not found: " + batchId));
  }

  private BatchResponse mapToResponse(SettlementBatch b) {
    return BatchResponse.builder()
      .id(b.getId())
      .tenantId(b.getTenantId())
      .batchRef(b.getBatchRef())
      .scheme(b.getScheme().name())
      .settlementType(b.getSettlementType().name())
      .settlementDate(b.getSettlementDate())
      .currency(b.getCurrency())
      .totalAmount(b.getTotalAmount())
      .totalFees(b.getTotalFees())
      .netAmount(b.getNetAmount())
      .recordCount(b.getRecordCount())
      .status(b.getStatus().name())
      .fileName(b.getFileName())
      .fileChecksum(b.getFileChecksum())
      .generatedAt(b.getGeneratedAt())
      .submittedAt(b.getSubmittedAt())
      .createdAt(b.getCreatedAt())
      .updatedAt(b.getUpdatedAt())
      .build();
  }

  private SettlementItemResponse mapItem(SettlementItem i) {
    return SettlementItemResponse.builder()
      .id(i.getId())
      .batchId(i.getBatchId())
      .transactionId(i.getTransactionId())
      .transactionRef(i.getTransactionRef())
      .amount(i.getAmount())
      .fee(i.getFee())
      .status(i.getStatus().name())
      .createdAt(i.getCreatedAt())
      .build();
  }
}
