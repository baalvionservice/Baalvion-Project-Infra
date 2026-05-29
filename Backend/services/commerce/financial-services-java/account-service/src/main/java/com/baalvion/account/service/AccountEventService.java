package com.baalvion.account.service;

import com.baalvion.account.domain.ProcessedEvent;
import com.baalvion.account.repository.ProcessedEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Applies balance movements driven by domain events, exactly once.
 *
 * Each method runs in a single transaction that joins {@link AccountService}'s
 * credit/debit (propagation REQUIRED) and the inbox marker write — so a debit, its paired
 * credit, and the de-dup record all commit atomically. Redeliveries are ignored.
 */
@Slf4j
@Service
@Transactional
public class AccountEventService {

  private final AccountService accountService;
  private final ProcessedEventRepository processedEvents;

  public AccountEventService(AccountService accountService, ProcessedEventRepository processedEvents) {
    this.accountService = accountService;
    this.processedEvents = processedEvents;
  }

  public void applyTransfer(String eventId, UUID tenantId, UUID sourceId, UUID destId, BigDecimal amount, String reference) {
    if (alreadyProcessed(eventId)) {
      return;
    }
    accountService.debit(tenantId, sourceId, amount, reference);
    accountService.credit(tenantId, destId, amount, reference);
    markProcessed(eventId);
    log.info("Balance transfer applied: event={}, {} -> {}, amount={}", eventId, sourceId, destId, amount);
  }

  public void applyDebit(String eventId, UUID tenantId, UUID accountId, BigDecimal amount, String reference) {
    if (alreadyProcessed(eventId)) {
      return;
    }
    accountService.debit(tenantId, accountId, amount, reference);
    markProcessed(eventId);
    log.info("Balance debit applied: event={}, account={}, amount={}", eventId, accountId, amount);
  }

  public void applyCredit(String eventId, UUID tenantId, UUID accountId, BigDecimal amount, String reference) {
    if (alreadyProcessed(eventId)) {
      return;
    }
    accountService.credit(tenantId, accountId, amount, reference);
    markProcessed(eventId);
    log.info("Balance credit applied: event={}, account={}, amount={}", eventId, accountId, amount);
  }

  private boolean alreadyProcessed(String eventId) {
    if (processedEvents.existsById(eventId)) {
      log.debug("Event already processed, skipping: {}", eventId);
      return true;
    }
    return false;
  }

  private void markProcessed(String eventId) {
    processedEvents.save(ProcessedEvent.builder().eventId(eventId).build());
  }
}
