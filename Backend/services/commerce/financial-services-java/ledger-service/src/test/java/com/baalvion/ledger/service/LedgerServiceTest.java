package com.baalvion.ledger.service;

import com.baalvion.ledger.domain.JournalEntry;
import com.baalvion.ledger.domain.JournalEntry.EntryStatus;
import com.baalvion.ledger.domain.JournalEntry.EntryType;
import com.baalvion.ledger.domain.LedgerOutbox;
import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.repository.JournalEntryRepository;
import com.baalvion.ledger.repository.LedgerOutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies the write path enqueues a transactional-outbox row alongside each journal entry (post
 * and reversal) and preserves idempotency-by-(tenant, transactionRef). The relay (publishing) is
 * covered by {@link LedgerOutboxRelayTest}.
 */
class LedgerServiceTest {

  private JournalEntryRepository repository;
  private LedgerOutboxRepository outboxRepository;
  private LedgerService service;

  private final UUID tenant = UUID.randomUUID();
  private final UUID debit = UUID.randomUUID();
  private final UUID credit = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    repository = mock(JournalEntryRepository.class);
    outboxRepository = mock(LedgerOutboxRepository.class);
    // Match the Spring-Boot-provided mapper (JSR-310 registered) so EntryResponse's
    // LocalDateTime fields serialize, exactly as in production.
    ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    service = new LedgerService(repository, outboxRepository, objectMapper);
  }

  private PostEntryRequest request() {
    return PostEntryRequest.builder()
      .transactionRef("TXN-001")
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(new BigDecimal("150.0000"))
      .currency("USD")
      .entryType("PAYMENT")
      .build();
  }

  /** Repository.save assigns the id (the entity does this in @PrePersist in real persistence). */
  private JournalEntry stampId(JournalEntry e) {
    if (e.getId() == null) {
      e.setId(UUID.randomUUID());
    }
    return e;
  }

  @Test
  @DisplayName("postEntry writes a ledger.entry.posted outbox row referencing the saved entry")
  void postEntry_enqueuesOutboxRow() {
    when(repository.findByTenantAndTransactionRef(tenant, "TXN-001")).thenReturn(Optional.empty());
    when(repository.save(any(JournalEntry.class))).thenAnswer(inv -> stampId(inv.getArgument(0)));

    EntryResponse response = service.postEntry(tenant, request());

    ArgumentCaptor<LedgerOutbox> captor = ArgumentCaptor.forClass(LedgerOutbox.class);
    verify(outboxRepository).save(captor.capture());
    LedgerOutbox row = captor.getValue();

    assertThat(row.getTopic()).isEqualTo("ledger.entry.posted");
    assertThat(row.getTenantId()).isEqualTo(tenant);
    assertThat(row.getAggregateId()).isEqualTo(response.getId());
    assertThat(row.getMsgKey()).isEqualTo(response.getId().toString());
    // Payload is the same EntryResponse shape consumers already receive.
    assertThat(row.getPayload()).contains(response.getId().toString());
    assertThat(row.getPayload()).contains("PAYMENT");
  }

  @Test
  @DisplayName("postEntry is idempotent: existing ref returns it and writes NO new outbox row")
  void postEntry_idempotent_noDuplicateOutbox() {
    JournalEntry existing = stampId(JournalEntry.builder()
      .tenantId(tenant)
      .transactionRef("TXN-001")
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(new BigDecimal("150.0000"))
      .currency("USD")
      .entryType(EntryType.PAYMENT)
      .status(EntryStatus.POSTED)
      .postedAt(LocalDateTime.now())
      .metadata("{}")
      .build());
    when(repository.findByTenantAndTransactionRef(tenant, "TXN-001")).thenReturn(Optional.of(existing));

    EntryResponse response = service.postEntry(tenant, request());

    assertThat(response.getId()).isEqualTo(existing.getId());
    verify(repository, never()).save(any(JournalEntry.class));
    verify(outboxRepository, never()).save(any(LedgerOutbox.class));
  }

  @Test
  @DisplayName("reverseEntry writes a ledger.entry.reversed outbox row for the reversal entry")
  void reverseEntry_enqueuesOutboxRow() {
    JournalEntry original = stampId(JournalEntry.builder()
      .tenantId(tenant)
      .transactionRef("TXN-001")
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(new BigDecimal("150.0000"))
      .currency("USD")
      .entryType(EntryType.PAYMENT)
      .status(EntryStatus.POSTED)
      .postedAt(LocalDateTime.now())
      .metadata("{}")
      .build());
    when(repository.findByIdAndTenant(original.getId(), tenant)).thenReturn(Optional.of(original));
    when(repository.save(any(JournalEntry.class))).thenAnswer(inv -> stampId(inv.getArgument(0)));

    EntryResponse reversal = service.reverseEntry(tenant, original.getId());

    ArgumentCaptor<LedgerOutbox> captor = ArgumentCaptor.forClass(LedgerOutbox.class);
    verify(outboxRepository).save(captor.capture());
    LedgerOutbox row = captor.getValue();

    assertThat(row.getTopic()).isEqualTo("ledger.entry.reversed");
    assertThat(row.getTenantId()).isEqualTo(tenant);
    assertThat(row.getAggregateId()).isEqualTo(reversal.getId());
    assertThat(reversal.getEntryType()).isEqualTo("REVERSAL");
    assertThat(reversal.getDebitAccountId()).isEqualTo(credit);
    assertThat(reversal.getCreditAccountId()).isEqualTo(debit);
  }

  @Test
  @DisplayName("reverseEntry rejects double reversal and writes no outbox row")
  void reverseEntry_alreadyReversed_throws() {
    JournalEntry original = stampId(JournalEntry.builder()
      .tenantId(tenant)
      .transactionRef("TXN-001")
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(new BigDecimal("150.0000"))
      .currency("USD")
      .entryType(EntryType.PAYMENT)
      .status(EntryStatus.REVERSED)
      .metadata("{}")
      .build());
    when(repository.findByIdAndTenant(original.getId(), tenant)).thenReturn(Optional.of(original));

    org.assertj.core.api.Assertions
      .assertThatThrownBy(() -> service.reverseEntry(tenant, original.getId()))
      .isInstanceOf(IllegalStateException.class);
    verify(outboxRepository, never()).save(any(LedgerOutbox.class));
  }
}
