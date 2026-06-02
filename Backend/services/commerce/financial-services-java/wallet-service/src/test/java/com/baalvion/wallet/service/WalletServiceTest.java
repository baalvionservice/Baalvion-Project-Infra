package com.baalvion.wallet.service;

import com.baalvion.wallet.config.WalletProperties;
import com.baalvion.wallet.domain.Wallet;
import com.baalvion.wallet.domain.WalletBalance;
import com.baalvion.wallet.dto.MoneyRequest;
import com.baalvion.wallet.dto.WalletBalanceResponse;
import com.baalvion.wallet.exception.InsufficientFundsException;
import com.baalvion.wallet.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class WalletServiceTest {

  private WalletRepository walletRepo;
  private WalletBalanceRepository balanceRepo;
  private WalletEntryRepository entryRepo;
  private WalletHoldRepository holdRepo;
  private OutboxService outbox;
  private WalletService service;

  private final UUID tenant = UUID.randomUUID();
  private final UUID walletId = UUID.randomUUID();
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    walletRepo = mock(WalletRepository.class);
    balanceRepo = mock(WalletBalanceRepository.class);
    entryRepo = mock(WalletEntryRepository.class);
    holdRepo = mock(WalletHoldRepository.class);
    outbox = mock(OutboxService.class);

    wallet = Wallet.builder().id(walletId).tenantId(tenant).holderId(UUID.randomUUID())
      .status(Wallet.WalletStatus.ACTIVE).build();
    when(walletRepo.findByIdAndTenantId(walletId, tenant)).thenReturn(Optional.of(wallet));
    when(entryRepo.findByTenantIdAndIdempotencyKey(any(), any())).thenReturn(Optional.empty());
    when(entryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(balanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    service = new WalletService(walletRepo, balanceRepo, entryRepo, holdRepo, outbox, new WalletProperties());
  }

  @Test
  void credit_createsBalanceAndAddsFunds() {
    when(balanceRepo.lockByWalletAndCurrency(walletId, "USD")).thenReturn(Optional.empty());

    MoneyRequest req = new MoneyRequest();
    req.setCurrency("USD");
    req.setAmount(new BigDecimal("500"));
    WalletBalanceResponse res = service.credit(tenant, walletId, req);

    assertThat(res.getCurrency()).isEqualTo("USD");
    assertThat(res.getAvailable()).isEqualByComparingTo("500");
    verify(outbox).enqueue(eq(tenant), eq("wallet.credited"), any(), any());
  }

  @Test
  void debit_withInsufficientFunds_isRejected() {
    WalletBalance balance = WalletBalance.builder()
      .walletId(walletId).tenantId(tenant).currency("USD")
      .available(new BigDecimal("100.0000")).held(BigDecimal.ZERO).build();
    when(balanceRepo.lockByWalletAndCurrency(walletId, "USD")).thenReturn(Optional.of(balance));

    MoneyRequest req = new MoneyRequest();
    req.setCurrency("USD");
    req.setAmount(new BigDecimal("250"));

    assertThatThrownBy(() -> service.debit(tenant, walletId, req))
      .isInstanceOf(InsufficientFundsException.class);
    verify(outbox, never()).enqueue(any(), eq("wallet.debited"), any(), any());
  }

  @Test
  void debit_withSufficientFunds_reducesAvailable() {
    WalletBalance balance = WalletBalance.builder()
      .walletId(walletId).tenantId(tenant).currency("USD")
      .available(new BigDecimal("1000.0000")).held(BigDecimal.ZERO).build();
    when(balanceRepo.lockByWalletAndCurrency(walletId, "USD")).thenReturn(Optional.of(balance));

    MoneyRequest req = new MoneyRequest();
    req.setCurrency("USD");
    req.setAmount(new BigDecimal("300"));
    WalletBalanceResponse res = service.debit(tenant, walletId, req);

    assertThat(res.getAvailable()).isEqualByComparingTo("700");
    verify(outbox).enqueue(eq(tenant), eq("wallet.debited"), any(), any());
  }
}
