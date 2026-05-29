package com.baalvion.ledger.service;

import com.baalvion.ledger.domain.JournalEntry;
import com.baalvion.ledger.domain.JournalEntry.EntryStatus;
import com.baalvion.ledger.domain.JournalEntry.EntryType;
import com.baalvion.ledger.dto.AccountBalanceResponse;
import com.baalvion.ledger.dto.AccountStatementResponse;
import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.repository.JournalEntryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class LedgerService {

  private final JournalEntryRepository repository;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  public LedgerService(JournalEntryRepository repository, KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  private void publish(String topic, String key, Object payload) {
    try {
      kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
    } catch (Exception e) {
      log.error("Failed to publish {} for key {}: {}", topic, key, e.getMessage());
    }
  }

  public EntryResponse postEntry(UUID tenantId, PostEntryRequest request) {
    var existing = repository.findByTenantAndTransactionRef(tenantId, request.getTransactionRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: transactionRef={} already exists for tenant={}", request.getTransactionRef(), tenantId);
      return mapToResponse(existing.get());
    }

    // Synchronous double-entry: the entry is committed and POSTED atomically, so account
    // balances (which sum POSTED debits/credits) reflect it immediately. PENDING is reserved
    // for any future two-phase posting flow.
    var entry = JournalEntry.builder()
      .tenantId(tenantId)
      .transactionRef(request.getTransactionRef())
      .debitAccountId(request.getDebitAccountId())
      .creditAccountId(request.getCreditAccountId())
      .amount(request.getAmount())
      .currency(request.getCurrency())
      .entryType(EntryType.valueOf(request.getEntryType()))
      .status(EntryStatus.POSTED)
      .postedAt(LocalDateTime.now())
      .description(request.getDescription())
      .metadata(request.getMetadata() != null ? request.getMetadata() : "{}")
      .build();

    var saved = repository.save(entry);
    log.info("Journal entry posted: id={}, tenant={}, ref={}, amount={}", saved.getId(), tenantId, request.getTransactionRef(), request.getAmount());

    publish("ledger.entry.posted", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  public EntryResponse getEntry(UUID tenantId, UUID entryId) {
    var entry = repository.findByIdAndTenant(entryId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + entryId));
    return mapToResponse(entry);
  }

  public Page<EntryResponse> listEntries(UUID tenantId, String accountId, String entryType, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<JournalEntry> entries;

    if (accountId != null) {
      UUID accId = UUID.fromString(accountId);
      entries = repository.findByTenantAndDebitAccount(tenantId, accId, pageable);
    } else if (entryType != null) {
      entries = repository.findByTenantAndEntryType(tenantId, EntryType.valueOf(entryType), pageable);
    } else if (status != null) {
      entries = repository.findByTenantAndStatus(tenantId, EntryStatus.valueOf(status), pageable);
    } else {
      entries = repository.findByTenant(tenantId, pageable);
    }

    return entries.map(this::mapToResponse);
  }

  public EntryResponse reverseEntry(UUID tenantId, UUID entryId) {
    var original = repository.findByIdAndTenant(entryId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + entryId));

    if (original.getStatus() == EntryStatus.REVERSED) {
      throw new IllegalStateException("Entry already reversed");
    }

    var reversal = JournalEntry.builder()
      .tenantId(tenantId)
      .transactionRef(original.getTransactionRef() + "-REVERSAL")
      .debitAccountId(original.getCreditAccountId())
      .creditAccountId(original.getDebitAccountId())
      .amount(original.getAmount())
      .currency(original.getCurrency())
      .entryType(EntryType.REVERSAL)
      .status(EntryStatus.POSTED)
      .postedAt(LocalDateTime.now())
      .relatedTransactionId(original.getId())
      .description("Reversal of " + original.getTransactionRef())
      .metadata(original.getMetadata())
      .build();

    var savedReversal = repository.save(reversal);

    original.setStatus(EntryStatus.REVERSED);
    original.setReversedAt(LocalDateTime.now());
    repository.save(original);

    log.info("Entry reversed: original={}, reversal={}, tenant={}", entryId, savedReversal.getId(), tenantId);
    publish("ledger.entry.reversed", savedReversal.getId().toString(), mapToResponse(savedReversal));

    return mapToResponse(savedReversal);
  }

  public AccountStatementResponse getAccountStatement(UUID tenantId, UUID accountId, int limit) {
    List<JournalEntry> entries = repository.findAccountStatement(tenantId, accountId);
    if (limit > 0 && entries.size() > limit) {
      entries = entries.subList(0, limit);
    }

    BigDecimal totalDebits = repository.sumDebitsByAccount(tenantId, accountId);
    BigDecimal totalCredits = repository.sumCreditsByAccount(tenantId, accountId);

    return AccountStatementResponse.builder()
      .accountId(accountId)
      .totalDebits(totalDebits)
      .totalCredits(totalCredits)
      .entries(entries.stream().map(this::mapToResponse).toList())
      .build();
  }

  public AccountBalanceResponse getAccountBalance(UUID tenantId, UUID accountId) {
    BigDecimal debits = repository.sumDebitsByAccount(tenantId, accountId);
    BigDecimal credits = repository.sumCreditsByAccount(tenantId, accountId);

    return AccountBalanceResponse.builder()
      .accountId(accountId)
      .debits(debits)
      .credits(credits)
      .balance(debits.subtract(credits))
      .balanced(debits.equals(credits))
      .build();
  }

  private EntryResponse mapToResponse(JournalEntry entry) {
    return EntryResponse.builder()
      .id(entry.getId())
      .tenantId(entry.getTenantId())
      .transactionRef(entry.getTransactionRef())
      .debitAccountId(entry.getDebitAccountId())
      .creditAccountId(entry.getCreditAccountId())
      .amount(entry.getAmount())
      .currency(entry.getCurrency())
      .entryType(entry.getEntryType().name())
      .status(entry.getStatus().name())
      .description(entry.getDescription())
      .postedAt(entry.getPostedAt())
      .reversedAt(entry.getReversedAt())
      .metadata(entry.getMetadata())
      .createdAt(entry.getCreatedAt())
      .updatedAt(entry.getUpdatedAt())
      .build();
  }
}
