package com.baalvion.wallet.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.wallet.config.WalletProperties;
import com.baalvion.wallet.domain.*;
import com.baalvion.wallet.domain.Wallet.HolderType;
import com.baalvion.wallet.domain.Wallet.WalletStatus;
import com.baalvion.wallet.domain.WalletEntry.Direction;
import com.baalvion.wallet.domain.WalletEntry.EntryType;
import com.baalvion.wallet.domain.WalletHold.HoldStatus;
import com.baalvion.wallet.dto.*;
import com.baalvion.wallet.exception.InsufficientFundsException;
import com.baalvion.wallet.exception.NotFoundException;
import com.baalvion.wallet.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Authoritative multi-currency balance store. Every mutation row-locks the affected balance
 * (pessimistic write) so concurrent movements serialise, enforces no-overdraft, is idempotent on
 * (tenant, idempotencyKey), records an append-only ledger entry, and mirrors the movement to the
 * ledger service via the transactional outbox.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WalletService {

  private static final int MONEY_SCALE = 4;

  private final WalletRepository walletRepository;
  private final WalletBalanceRepository balanceRepository;
  private final WalletEntryRepository entryRepository;
  private final WalletHoldRepository holdRepository;
  private final OutboxService outbox;
  private final WalletProperties props;

  // ------------------------------------------------------------------- wallet lifecycle

  public WalletResponse open(UUID tenantId, OpenWalletRequest req) {
    var existing = walletRepository.findByTenantIdAndHolderId(tenantId, req.getHolderId());
    if (existing.isPresent()) {
      return WalletResponse.from(existing.get(), balanceRepository.findByWalletId(existing.get().getId()));
    }
    Wallet wallet = Wallet.builder()
      .tenantId(tenantId)
      .holderId(req.getHolderId())
      .holderType(req.getHolderType() != null ? parseHolderType(req.getHolderType()) : HolderType.USER)
      .status(WalletStatus.ACTIVE)
      .defaultCurrency(req.getDefaultCurrency() != null ? req.getDefaultCurrency().toUpperCase() : null)
      .label(req.getLabel())
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .build();
    Wallet saved = walletRepository.save(wallet);
    log.info("Wallet opened: id={}, tenant={}, holder={}", saved.getId(), tenantId, req.getHolderId());
    outbox.enqueue(tenantId, "wallet.opened", saved.getId().toString(), WalletResponse.from(saved, List.of()));
    return WalletResponse.from(saved, List.of());
  }

  @Transactional(readOnly = true)
  public WalletResponse get(UUID tenantId, UUID walletId) {
    Wallet w = loadWallet(tenantId, walletId);
    return WalletResponse.from(w, balanceRepository.findByWalletId(walletId));
  }

  @Transactional(readOnly = true)
  public WalletResponse getByHolder(UUID tenantId, UUID holderId) {
    Wallet w = walletRepository.findByTenantIdAndHolderId(tenantId, holderId)
      .orElseThrow(() -> new NotFoundException("Wallet not found for holder: " + holderId));
    return WalletResponse.from(w, balanceRepository.findByWalletId(w.getId()));
  }

  @Transactional(readOnly = true)
  public Page<WalletResponse> list(UUID tenantId, int page, int size) {
    return walletRepository.findByTenantId(tenantId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
      .map(WalletResponse::from);
  }

  public WalletResponse setStatus(UUID tenantId, UUID walletId, WalletStatus status) {
    Wallet w = loadWallet(tenantId, walletId);
    w.setStatus(status);
    walletRepository.save(w);
    log.info("Wallet {} status set to {} (tenant={})", walletId, status, tenantId);
    return WalletResponse.from(w, balanceRepository.findByWalletId(walletId));
  }

  // ------------------------------------------------------------------- credit / debit

  public WalletBalanceResponse credit(UUID tenantId, UUID walletId, MoneyRequest req) {
    String idem = idem(req.getIdempotencyKey());
    var dup = entryRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (dup.isPresent()) {
      return balanceResponse(walletId, req.getCurrency());
    }
    Wallet wallet = loadActiveWallet(tenantId, walletId);
    String ccy = currency(req.getCurrency());
    BigDecimal amount = scale(req.getAmount());

    WalletBalance balance = lockOrCreateBalance(wallet, ccy);
    balance.setAvailable(balance.getAvailable().add(amount));
    balanceRepository.save(balance);
    WalletEntry entry = writeEntry(wallet, ccy, Direction.CREDIT, EntryType.DEPOSIT, amount,
      balance.getAvailable(), idem, req.getReference(), null);

    log.info("Wallet credited: wallet={}, {} {} → available {} (tenant={})", walletId, amount, ccy, balance.getAvailable(), tenantId);
    outbox.enqueue(tenantId, "wallet.credited", entry.getId().toString(), WalletEntryResponse.from(entry));
    return WalletBalanceResponse.from(balance);
  }

  public WalletBalanceResponse debit(UUID tenantId, UUID walletId, MoneyRequest req) {
    String idem = idem(req.getIdempotencyKey());
    var dup = entryRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (dup.isPresent()) {
      return balanceResponse(walletId, req.getCurrency());
    }
    Wallet wallet = loadActiveWallet(tenantId, walletId);
    String ccy = currency(req.getCurrency());
    BigDecimal amount = scale(req.getAmount());

    WalletBalance balance = lockBalance(wallet.getId(), ccy);
    requireFunds(balance.getAvailable(), amount, ccy);
    balance.setAvailable(balance.getAvailable().subtract(amount));
    balanceRepository.save(balance);
    WalletEntry entry = writeEntry(wallet, ccy, Direction.DEBIT, EntryType.WITHDRAWAL, amount,
      balance.getAvailable(), idem, req.getReference(), null);

    log.info("Wallet debited: wallet={}, {} {} → available {} (tenant={})", walletId, amount, ccy, balance.getAvailable(), tenantId);
    outbox.enqueue(tenantId, "wallet.debited", entry.getId().toString(), WalletEntryResponse.from(entry));
    return WalletBalanceResponse.from(balance);
  }

  // ------------------------------------------------------------------- holds

  public HoldResponse hold(UUID tenantId, UUID walletId, HoldRequest req) {
    Wallet wallet = loadActiveWallet(tenantId, walletId);
    String ccy = currency(req.getCurrency());
    BigDecimal amount = scale(req.getAmount());

    WalletBalance balance = lockBalance(wallet.getId(), ccy);
    requireFunds(balance.getAvailable(), amount, ccy);
    balance.setAvailable(balance.getAvailable().subtract(amount));
    balance.setHeld(balance.getHeld().add(amount));
    balanceRepository.save(balance);

    long ttl = req.getTtlMinutes() != null ? req.getTtlMinutes() : props.getHoldTtlMinutes();
    WalletHold heldRow = holdRepository.save(WalletHold.builder()
      .walletId(wallet.getId()).tenantId(tenantId).currency(ccy).amount(amount)
      .status(HoldStatus.ACTIVE).reference(req.getReference())
      .expiresAt(LocalDateTime.now().plusMinutes(ttl))
      .createdBy(AuthContext.currentUserId().orElse(null)).build());
    writeEntry(wallet, ccy, Direction.DEBIT, EntryType.HOLD, amount, balance.getAvailable(),
      "hold:" + heldRow.getId(), req.getReference(), null);

    log.info("Wallet hold placed: wallet={}, {} {}, hold={} (tenant={})", walletId, amount, ccy, heldRow.getId(), tenantId);
    return HoldResponse.from(heldRow);
  }

  /** Returns reserved funds to the available balance. */
  public HoldResponse releaseHold(UUID tenantId, UUID holdId) {
    WalletHold hold = holdRepository.findByIdAndTenantId(holdId, tenantId)
      .orElseThrow(() -> new NotFoundException("Hold not found: " + holdId));
    if (hold.getStatus() != HoldStatus.ACTIVE) {
      throw new IllegalStateException("Only an ACTIVE hold can be released (" + hold.getStatus() + ")");
    }
    Wallet wallet = loadWallet(tenantId, hold.getWalletId());
    WalletBalance balance = lockBalance(hold.getWalletId(), hold.getCurrency());
    balance.setHeld(balance.getHeld().subtract(hold.getAmount()));
    balance.setAvailable(balance.getAvailable().add(hold.getAmount()));
    balanceRepository.save(balance);

    hold.setStatus(HoldStatus.RELEASED);
    hold.setResolvedAt(LocalDateTime.now());
    holdRepository.save(hold);
    writeEntry(wallet, hold.getCurrency(), Direction.CREDIT, EntryType.RELEASE, hold.getAmount(),
      balance.getAvailable(), "release:" + holdId, hold.getReference(), null);

    log.info("Wallet hold released: hold={}, wallet={}, {} {} (tenant={})", holdId, hold.getWalletId(), hold.getAmount(), hold.getCurrency(), tenantId);
    return HoldResponse.from(hold);
  }

  /** Settles a hold: the reserved funds leave the wallet (e.g. payout captured). */
  public HoldResponse captureHold(UUID tenantId, UUID holdId, String reference) {
    WalletHold hold = holdRepository.findByIdAndTenantId(holdId, tenantId)
      .orElseThrow(() -> new NotFoundException("Hold not found: " + holdId));
    if (hold.getStatus() != HoldStatus.ACTIVE) {
      throw new IllegalStateException("Only an ACTIVE hold can be captured (" + hold.getStatus() + ")");
    }
    Wallet wallet = loadWallet(tenantId, hold.getWalletId());
    WalletBalance balance = lockBalance(hold.getWalletId(), hold.getCurrency());
    balance.setHeld(balance.getHeld().subtract(hold.getAmount()));
    balanceRepository.save(balance);

    hold.setStatus(HoldStatus.CAPTURED);
    hold.setResolvedAt(LocalDateTime.now());
    holdRepository.save(hold);
    WalletEntry entry = writeEntry(wallet, hold.getCurrency(), Direction.DEBIT, EntryType.CAPTURE, hold.getAmount(),
      balance.getAvailable(), "capture:" + holdId, reference != null ? reference : hold.getReference(), null);

    log.info("Wallet hold captured: hold={}, wallet={}, {} {} (tenant={})", holdId, hold.getWalletId(), hold.getAmount(), hold.getCurrency(), tenantId);
    outbox.enqueue(tenantId, "wallet.debited", entry.getId().toString(), WalletEntryResponse.from(entry));
    return HoldResponse.from(hold);
  }

  @Transactional(readOnly = true)
  public List<HoldResponse> listHolds(UUID tenantId, UUID walletId) {
    loadWallet(tenantId, walletId);
    return holdRepository.findByWalletId(walletId).stream().map(HoldResponse::from).toList();
  }

  // ------------------------------------------------------------------- transfer (same currency)

  public WalletResponse transfer(UUID tenantId, UUID walletId, TransferRequest req) {
    String idem = idem(req.getIdempotencyKey());
    var dup = entryRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (dup.isPresent()) {
      return get(tenantId, walletId);
    }
    if (walletId.equals(req.getDestinationWalletId())) {
      throw new IllegalArgumentException("source and destination wallets must differ");
    }
    Wallet source = loadActiveWallet(tenantId, walletId);
    Wallet dest = loadActiveWallet(tenantId, req.getDestinationWalletId());
    String ccy = currency(req.getCurrency());
    BigDecimal amount = scale(req.getAmount());

    // Lock balances in a deterministic order (by wallet id) to avoid deadlocks.
    WalletBalance first, second;
    boolean sourceFirst = source.getId().compareTo(dest.getId()) < 0;
    if (sourceFirst) {
      first = lockBalance(source.getId(), ccy);
      second = lockOrCreateBalance(dest, ccy);
    } else {
      second = lockOrCreateBalance(dest, ccy);
      first = lockBalance(source.getId(), ccy);
    }
    WalletBalance sourceBal = sourceFirst ? first : second;
    WalletBalance destBal = sourceFirst ? second : first;

    requireFunds(sourceBal.getAvailable(), amount, ccy);
    sourceBal.setAvailable(sourceBal.getAvailable().subtract(amount));
    destBal.setAvailable(destBal.getAvailable().add(amount));
    balanceRepository.save(sourceBal);
    balanceRepository.save(destBal);

    WalletEntry out = writeEntry(source, ccy, Direction.DEBIT, EntryType.TRANSFER_OUT, amount,
      sourceBal.getAvailable(), idem, req.getReference(), null);
    writeEntry(dest, ccy, Direction.CREDIT, EntryType.TRANSFER_IN, amount,
      destBal.getAvailable(), idem + ":in", req.getReference(), out.getId());

    log.info("Wallet transfer: {} {} from {} to {} (tenant={})", amount, ccy, walletId, dest.getId(), tenantId);
    outbox.enqueue(tenantId, "wallet.transferred", out.getId().toString(), WalletEntryResponse.from(out));
    return get(tenantId, walletId);
  }

  // ------------------------------------------------------------------- convert (in-wallet FX)

  public WalletResponse convert(UUID tenantId, UUID walletId, ConvertRequest req) {
    String idem = idem(req.getIdempotencyKey());
    var dup = entryRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (dup.isPresent()) {
      return get(tenantId, walletId);
    }
    String sell = currency(req.getSellCurrency());
    String buy = currency(req.getBuyCurrency());
    if (sell.equals(buy)) {
      throw new IllegalArgumentException("sell and buy currencies must differ");
    }
    Wallet wallet = loadActiveWallet(tenantId, walletId);
    BigDecimal sellAmount = scale(req.getSellAmount());
    BigDecimal buyAmount = req.getSellAmount().multiply(req.getRate()).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    // Deterministic lock order across the two currency balances of the same wallet.
    WalletBalance sellBal, buyBal;
    if (sell.compareTo(buy) < 0) {
      sellBal = lockBalance(wallet.getId(), sell);
      buyBal = lockOrCreateBalance(wallet, buy);
    } else {
      buyBal = lockOrCreateBalance(wallet, buy);
      sellBal = lockBalance(wallet.getId(), sell);
    }
    requireFunds(sellBal.getAvailable(), sellAmount, sell);
    sellBal.setAvailable(sellBal.getAvailable().subtract(sellAmount));
    buyBal.setAvailable(buyBal.getAvailable().add(buyAmount));
    balanceRepository.save(sellBal);
    balanceRepository.save(buyBal);

    String ref = req.getReference() != null ? req.getReference()
      : (req.getFxReferenceId() != null ? "fx:" + req.getFxReferenceId() : null);
    WalletEntry out = writeEntry(wallet, sell, Direction.DEBIT, EntryType.CONVERT_OUT, sellAmount,
      sellBal.getAvailable(), idem, ref, null);
    writeEntry(wallet, buy, Direction.CREDIT, EntryType.CONVERT_IN, buyAmount,
      buyBal.getAvailable(), idem + ":in", ref, out.getId());

    log.info("Wallet convert: {} {} → {} {} @ {} (wallet={}, tenant={})", sellAmount, sell, buyAmount, buy, req.getRate(), walletId, tenantId);
    outbox.enqueue(tenantId, "wallet.converted", out.getId().toString(), WalletEntryResponse.from(out));
    return get(tenantId, walletId);
  }

  // ------------------------------------------------------------------- statement

  @Transactional(readOnly = true)
  public Page<WalletEntryResponse> statement(UUID tenantId, UUID walletId, String currency, int page, int size) {
    loadWallet(tenantId, walletId);
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    if (currency != null) {
      return entryRepository.findByWalletIdAndCurrency(walletId, currency.toUpperCase(), pageable).map(WalletEntryResponse::from);
    }
    return entryRepository.findByWalletId(walletId, pageable).map(WalletEntryResponse::from);
  }

  // ------------------------------------------------------------------- scheduled hold expiry

  @Transactional
  public int expireHolds() {
    var expired = holdRepository.findByStatusAndExpiresAtBefore(HoldStatus.ACTIVE, LocalDateTime.now());
    int count = 0;
    for (WalletHold hold : expired) {
      WalletBalance balance = lockBalance(hold.getWalletId(), hold.getCurrency());
      balance.setHeld(balance.getHeld().subtract(hold.getAmount()));
      balance.setAvailable(balance.getAvailable().add(hold.getAmount()));
      balanceRepository.save(balance);
      hold.setStatus(HoldStatus.EXPIRED);
      hold.setResolvedAt(LocalDateTime.now());
      holdRepository.save(hold);
      Wallet wallet = walletRepository.findById(hold.getWalletId()).orElse(null);
      if (wallet != null) {
        writeEntry(wallet, hold.getCurrency(), Direction.CREDIT, EntryType.RELEASE, hold.getAmount(),
          balance.getAvailable(), "expire:" + hold.getId(), hold.getReference(), null);
      }
      count++;
    }
    if (count > 0) log.info("Auto-released {} expired wallet holds", count);
    return count;
  }

  // ------------------------------------------------------------------- helpers

  private WalletEntry writeEntry(Wallet wallet, String ccy, Direction dir, EntryType type, BigDecimal amount,
                                 BigDecimal balanceAfter, String idem, String reference, UUID relatedEntryId) {
    return entryRepository.save(WalletEntry.builder()
      .walletId(wallet.getId()).tenantId(wallet.getTenantId()).currency(ccy)
      .direction(dir).entryType(type).amount(amount).balanceAfter(balanceAfter)
      .idempotencyKey(idem).reference(reference).relatedEntryId(relatedEntryId)
      .createdBy(AuthContext.currentUserId().orElse(null)).build());
  }

  private WalletBalance lockBalance(UUID walletId, String currency) {
    return balanceRepository.lockByWalletAndCurrency(walletId, currency)
      .orElseThrow(() -> new InsufficientFundsException("No " + currency + " balance for this wallet"));
  }

  private WalletBalance lockOrCreateBalance(Wallet wallet, String currency) {
    return balanceRepository.lockByWalletAndCurrency(wallet.getId(), currency)
      .orElseGet(() -> balanceRepository.save(WalletBalance.builder()
        .walletId(wallet.getId()).tenantId(wallet.getTenantId()).currency(currency)
        .available(BigDecimal.ZERO).held(BigDecimal.ZERO).build()));
  }

  private void requireFunds(BigDecimal available, BigDecimal amount, String ccy) {
    if (!props.isAllowOverdraft() && available.compareTo(amount) < 0) {
      throw new InsufficientFundsException("Insufficient " + ccy + " funds: available " + available + ", required " + amount);
    }
  }

  private WalletBalanceResponse balanceResponse(UUID walletId, String currency) {
    return balanceRepository.findByWalletIdAndCurrency(walletId, currency(currency))
      .map(WalletBalanceResponse::from)
      .orElse(WalletBalanceResponse.builder().walletId(walletId).currency(currency(currency))
        .available(BigDecimal.ZERO).held(BigDecimal.ZERO).total(BigDecimal.ZERO).build());
  }

  private Wallet loadWallet(UUID tenantId, UUID walletId) {
    return walletRepository.findByIdAndTenantId(walletId, tenantId)
      .orElseThrow(() -> new NotFoundException("Wallet not found: " + walletId));
  }

  private Wallet loadActiveWallet(UUID tenantId, UUID walletId) {
    Wallet w = loadWallet(tenantId, walletId);
    if (w.getStatus() != WalletStatus.ACTIVE) {
      throw new IllegalStateException("Wallet is " + w.getStatus() + "; movements are not permitted");
    }
    return w;
  }

  private String idem(String key) {
    return key != null && !key.isBlank() ? key : UUID.randomUUID().toString();
  }

  private String currency(String c) {
    if (c == null || c.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
    return c.trim().toUpperCase();
  }

  private BigDecimal scale(BigDecimal v) {
    return v.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
  }

  private HolderType parseHolderType(String value) {
    try {
      return HolderType.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid holderType: " + value);
    }
  }
}
