package com.baalvion.ledger.service;

import com.baalvion.ledger.domain.JournalEntry;
import com.baalvion.ledger.domain.JournalEntry.EntryStatus;
import com.baalvion.ledger.domain.JournalEntry.EntryType;
import com.baalvion.ledger.domain.LedgerOutbox;
import com.baalvion.ledger.dto.AccountBalanceResponse;
import com.baalvion.ledger.dto.AccountStatementResponse;
import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.repository.JournalEntryRepository;
import com.baalvion.ledger.repository.LedgerOutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class LedgerService {

  private final JournalEntryRepository repository;
  private final LedgerOutboxRepository outboxRepository;
  private final ObjectMapper objectMapper;

  public LedgerService(JournalEntryRepository repository, LedgerOutboxRepository outboxRepository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.outboxRepository = outboxRepository;
    this.objectMapper = objectMapper;
  }

  /**
   * Enqueue an arbitrary domain/saga event to the transactional outbox in the CURRENT transaction.
   *
   * <p>Used by the Kafka saga listeners so their replies ({@code payments.ledger.posted} /
   * {@code .failed}) commit atomically with the journal write they describe and are delivered via
   * the same retrying relay — replacing the old fire-and-forget {@code kafkaTemplate.send} whose
   * failures were swallowed, leaving the saga to stall forever. {@code @Transactional} on this
   * class means a caller already inside a tx (e.g. {@code postEntry}) shares it (REQUIRED).
   */
  public void enqueueEvent(UUID tenantId, UUID aggregateId, String topic, String key, Object payload) {
    enqueueOutbox(tenantId, aggregateId, topic, key, payload);
  }

  /**
   * Persist the event to the transactional outbox in the CURRENT transaction, so it commits
   * atomically with the journal entry. A separate relay ({@link LedgerOutboxRelay}) publishes
   * it to Kafka synchronously and retries on failure — replacing the previous fire-and-forget
   * {@code kafkaTemplate.send} whose async failures were silently swallowed.
   */
  private void enqueueOutbox(UUID tenantId, UUID aggregateId, String topic, String key, Object payload) {
    try {
      String json = objectMapper.writeValueAsString(payload);
      outboxRepository.save(LedgerOutbox.builder()
        .tenantId(tenantId)
        .aggregateId(aggregateId)
        .topic(topic)
        .msgKey(key)
        .payload(json)
        .build());
    } catch (JsonProcessingException e) {
      // Fail the whole transaction: an entry must never commit without its outbox event.
      throw new IllegalStateException("Failed to serialize outbox payload for topic " + topic, e);
    }
  }

  public EntryResponse postEntry(UUID tenantId, PostEntryRequest request) {
    // Strip CR/LF/tab from the user-supplied transactionRef before logging to prevent log injection.
    String safeTransactionRef = request.getTransactionRef() == null
      ? null
      : request.getTransactionRef().replaceAll("[\r\n\t]", "_");

    var existing = repository.findByTenantAndTransactionRef(tenantId, request.getTransactionRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: transactionRef={} already exists for tenant={}", safeTransactionRef, tenantId);
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
    log.info("Journal entry posted: id={}, tenant={}, ref={}, amount={}", saved.getId(), tenantId, safeTransactionRef, request.getAmount());

    enqueueOutbox(tenantId, saved.getId(), "ledger.entry.posted", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  /**
   * Payment-saga step: post the journal entry AND enqueue the {@code payments.ledger.posted} reply
   * in ONE transaction (this class is {@code @Transactional} = REQUIRED), so the saga reply commits
   * atomically with the journal it reports and is delivered via the retrying outbox relay. If the
   * broker is down when the relay later publishes, the reply is retried — it can never be silently
   * dropped (the old fire-and-forget failure mode that stalled the saga permanently). Business
   * validation failures propagate to the caller, which enqueues the terminal
   * {@code payments.ledger.failed} reply instead.
   *
   * @param transactionId the payment transaction id (the saga correlation id and Kafka key)
   * @param replyTopic    the success reply topic ({@code payments.ledger.posted})
   */
  public EntryResponse postPaymentSaga(UUID tenantId, UUID transactionId, PostEntryRequest request, String replyTopic) {
    EntryResponse entry = postEntry(tenantId, request);
    Map<String, Object> reply = new LinkedHashMap<>();
    reply.put("transactionId", transactionId);
    reply.put("tenantId", tenantId);
    reply.put("journalId", entry.getId());
    reply.put("transactionRef", entry.getTransactionRef());
    enqueueOutbox(tenantId, entry.getId(), replyTopic, transactionId.toString(), reply);
    return entry;
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
    enqueueOutbox(tenantId, savedReversal.getId(), "ledger.entry.reversed", savedReversal.getId().toString(), mapToResponse(savedReversal));

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
