package com.baalvion.account.service;

import com.baalvion.account.domain.Account;
import com.baalvion.account.domain.Account.AccountType;
import com.baalvion.account.domain.Account.KycStatus;
import com.baalvion.account.dto.AccountLimitsResponse;
import com.baalvion.account.dto.AccountResponse;
import com.baalvion.account.dto.CreateAccountRequest;
import com.baalvion.account.dto.UpdateKycRequest;
import com.baalvion.account.repository.AccountRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class AccountService {

  private final AccountRepository repository;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;
  private final SecureRandom random = new SecureRandom();

  @Value("${app.default-daily-limit:1000000}")
  private BigDecimal defaultDailyLimit;

  /**
   * Allowed KYC transitions (state machine). Any transition not listed here is rejected.
   */
  private static final Map<KycStatus, Set<KycStatus>> KYC_TRANSITIONS = Map.of(
    KycStatus.PENDING, EnumSet.of(KycStatus.APPROVED, KycStatus.REJECTED),
    KycStatus.APPROVED, EnumSet.of(KycStatus.SUSPENDED, KycStatus.REJECTED),
    KycStatus.SUSPENDED, EnumSet.of(KycStatus.APPROVED, KycStatus.REJECTED),
    KycStatus.REJECTED, EnumSet.noneOf(KycStatus.class)
  );

  public AccountService(AccountRepository repository, KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
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

  public AccountResponse createAccount(UUID tenantId, CreateAccountRequest request) {
    AccountType type = AccountType.valueOf(request.getAccountType());

    var account = Account.builder()
      .tenantId(tenantId)
      .accountNumber(generateAccountNumber())
      .accountName(request.getAccountName())
      .accountType(type)
      .currency(request.getCurrency())
      .balance(BigDecimal.ZERO)
      .ledgerBalance(BigDecimal.ZERO)
      .kycStatus(KycStatus.PENDING)
      .dailyLimit(request.getDailyLimit() != null ? request.getDailyLimit() : defaultDailyLimit)
      .metadata(request.getMetadata() != null ? request.getMetadata() : "{}")
      .build();

    var saved = repository.save(account);
    log.info("Account created: id={}, tenant={}, number={}, type={}", saved.getId(), tenantId, saved.getAccountNumber(), type);

    publish("account.created", saved.getId().toString(), mapToResponse(saved));
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public AccountResponse getAccount(UUID tenantId, UUID accountId) {
    return mapToResponse(loadAccount(tenantId, accountId));
  }

  @Transactional(readOnly = true)
  public Page<AccountResponse> listAccounts(UUID tenantId, String type, String kycStatus, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Account> accounts;

    if (type != null) {
      accounts = repository.findByTenantAndType(tenantId, AccountType.valueOf(type), pageable);
    } else if (kycStatus != null) {
      accounts = repository.findByTenantAndKycStatus(tenantId, KycStatus.valueOf(kycStatus), pageable);
    } else {
      accounts = repository.findByTenant(tenantId, pageable);
    }

    return accounts.map(this::mapToResponse);
  }

  public AccountResponse updateKyc(UUID tenantId, UUID accountId, UpdateKycRequest request) {
    var account = loadAccount(tenantId, accountId);
    KycStatus current = account.getKycStatus();
    KycStatus target = KycStatus.valueOf(request.getKycStatus());

    if (current == target) {
      return mapToResponse(account);
    }
    if (!KYC_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
      throw new IllegalStateException("Invalid KYC transition: " + current + " -> " + target);
    }

    account.setKycStatus(target);
    var saved = repository.save(account);
    log.info("KYC updated: account={}, tenant={}, {} -> {}, by={}", accountId, tenantId, current, target, request.getUpdatedBy());

    Map<String, Object> event = new HashMap<>();
    event.put("accountId", accountId);
    event.put("tenantId", tenantId);
    event.put("previousState", current.name());
    event.put("newState", target.name());
    event.put("updatedBy", request.getUpdatedBy());
    event.put("reason", request.getReason());
    publish("account.kyc.updated", accountId.toString(), event);

    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public AccountLimitsResponse getLimits(UUID tenantId, UUID accountId) {
    var account = loadAccount(tenantId, accountId);
    return AccountLimitsResponse.builder()
      .accountId(account.getId())
      .currency(account.getCurrency())
      .dailyLimit(account.getDailyLimit())
      .availableBalance(account.getBalance())
      .kycStatus(account.getKycStatus().name())
      .transactable(account.getKycStatus() == KycStatus.APPROVED)
      .build();
  }

  /**
   * Credit the account (increase balance). Pessimistically locked to avoid lost updates.
   */
  public AccountResponse credit(UUID tenantId, UUID accountId, BigDecimal amount, String reference) {
    var account = repository.findByIdAndTenantForUpdate(accountId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));

    account.setBalance(account.getBalance().add(amount));
    account.setLedgerBalance(account.getLedgerBalance().add(amount));
    var saved = repository.save(account);
    log.info("Account credited: account={}, tenant={}, amount={}, ref={}, balance={}", accountId, tenantId, amount, reference, saved.getBalance());
    return mapToResponse(saved);
  }

  /**
   * Debit the account (decrease balance). Pessimistically locked; rejects overdrafts.
   */
  public AccountResponse debit(UUID tenantId, UUID accountId, BigDecimal amount, String reference) {
    var account = repository.findByIdAndTenantForUpdate(accountId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));

    if (account.getBalance().compareTo(amount) < 0) {
      throw new IllegalStateException("Insufficient funds: balance=" + account.getBalance() + ", requested=" + amount);
    }

    account.setBalance(account.getBalance().subtract(amount));
    account.setLedgerBalance(account.getLedgerBalance().subtract(amount));
    var saved = repository.save(account);
    log.info("Account debited: account={}, tenant={}, amount={}, ref={}, balance={}", accountId, tenantId, amount, reference, saved.getBalance());
    return mapToResponse(saved);
  }

  private Account loadAccount(UUID tenantId, UUID accountId) {
    return repository.findByIdAndTenant(accountId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));
  }

  /**
   * Generates a unique 10-digit NUBAN-style account number.
   */
  private String generateAccountNumber() {
    for (int attempt = 0; attempt < 10; attempt++) {
      String candidate = String.format("%010d", (long) (random.nextDouble() * 1_000_000_0000L));
      if (!repository.existsByAccountNumber(candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique account number");
  }

  private AccountResponse mapToResponse(Account account) {
    return AccountResponse.builder()
      .id(account.getId())
      .tenantId(account.getTenantId())
      .accountNumber(account.getAccountNumber())
      .accountName(account.getAccountName())
      .accountType(account.getAccountType().name())
      .currency(account.getCurrency())
      .balance(account.getBalance())
      .ledgerBalance(account.getLedgerBalance())
      .kycStatus(account.getKycStatus().name())
      .dailyLimit(account.getDailyLimit())
      .metadata(account.getMetadata())
      .createdAt(account.getCreatedAt())
      .updatedAt(account.getUpdatedAt())
      .build();
  }
}
