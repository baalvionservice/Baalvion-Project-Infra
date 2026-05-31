package com.baalvion.fx.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.fx.config.FxProperties;
import com.baalvion.fx.domain.FxConversion;
import com.baalvion.fx.domain.FxConversion.DealType;
import com.baalvion.fx.domain.FxRateLock;
import com.baalvion.fx.domain.FxRateLock.LockStatus;
import com.baalvion.fx.dto.*;
import com.baalvion.fx.exception.NotFoundException;
import com.baalvion.fx.repository.FxConversionRepository;
import com.baalvion.fx.repository.FxRateLockRepository;
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
import java.util.UUID;

/**
 * Executes spot conversions and rate-locks. Each executed conversion emits a real currency
 * movement (debit sell / credit buy) to the wallet/ledger services via the transactional outbox.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FxDealService {

  private static final int MONEY_SCALE = 4;

  private final FxRateService rateService;
  private final FxConversionRepository conversionRepository;
  private final FxRateLockRepository lockRepository;
  private final OutboxService outbox;
  private final FxProperties props;

  // ------------------------------------------------------------------- spot conversion

  public ConversionResponse convert(UUID tenantId, ConvertRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = conversionRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      return ConversionResponse.from(existing.get());
    }
    BigDecimal sellAmount = req.getSellAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal rate = rateService.dealRateForSell(req.getSellCurrency(), req.getBuyCurrency());
    BigDecimal buyAmount = sellAmount.multiply(rate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    FxConversion conv = conversionRepository.save(FxConversion.builder()
      .tenantId(tenantId).idempotencyKey(idem)
      .sellCurrency(rateService.normalize(req.getSellCurrency()))
      .buyCurrency(rateService.normalize(req.getBuyCurrency()))
      .sellAmount(sellAmount).buyAmount(buyAmount).rate(rate)
      .dealType(DealType.SPOT).status(FxConversion.ConversionStatus.EXECUTED)
      .createdBy(AuthContext.currentUserId().orElse(null)).build());

    log.info("FX spot executed: {} {} → {} {} @ {} (tenant={})",
      sellAmount, conv.getSellCurrency(), buyAmount, conv.getBuyCurrency(), rate, tenantId);
    emitExecuted(conv);
    return ConversionResponse.from(conv);
  }

  // ------------------------------------------------------------------- rate-lock

  public RateLockResponse lock(UUID tenantId, RateLockRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = lockRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      return RateLockResponse.from(existing.get());
    }
    int seconds = req.getLockSeconds() != null ? req.getLockSeconds() : props.getRateLockSeconds();
    if (seconds <= 0) {
      throw new IllegalArgumentException("lockSeconds must be positive");
    }
    BigDecimal sellAmount = req.getSellAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal rate = rateService.dealRateForSell(req.getSellCurrency(), req.getBuyCurrency());
    BigDecimal buyAmount = sellAmount.multiply(rate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    FxRateLock lock = lockRepository.save(FxRateLock.builder()
      .tenantId(tenantId).idempotencyKey(idem)
      .sellCurrency(rateService.normalize(req.getSellCurrency()))
      .buyCurrency(rateService.normalize(req.getBuyCurrency()))
      .sellAmount(sellAmount).buyAmount(buyAmount).lockedRate(rate)
      .status(LockStatus.LOCKED)
      .expiresAt(LocalDateTime.now().plusSeconds(seconds))
      .createdBy(AuthContext.currentUserId().orElse(null)).build());

    log.info("FX rate locked: {} {} → {} {} @ {} for {}s (tenant={})",
      sellAmount, lock.getSellCurrency(), buyAmount, lock.getBuyCurrency(), rate, seconds, tenantId);
    outbox.enqueue(tenantId, "fx.rate_lock.created", lock.getId().toString(), RateLockResponse.from(lock));
    return RateLockResponse.from(lock);
  }

  /** Executes a still-valid rate-lock into a conversion at the locked rate. */
  public ConversionResponse executeLock(UUID tenantId, UUID lockId) {
    FxRateLock lock = lockRepository.findByIdAndTenantId(lockId, tenantId)
      .orElseThrow(() -> new NotFoundException("Rate lock not found: " + lockId));
    if (lock.getStatus() == LockStatus.EXECUTED) {
      // Idempotent: return the conversion already produced for this lock.
      return conversionRepository.findByTenantIdAndIdempotencyKey(tenantId, "lock:" + lockId)
        .map(ConversionResponse::from)
        .orElseThrow(() -> new IllegalStateException("Lock executed but conversion missing"));
    }
    if (lock.getStatus() != LockStatus.LOCKED) {
      throw new IllegalStateException("Rate lock is not executable (" + lock.getStatus() + ")");
    }
    if (lock.getExpiresAt().isBefore(LocalDateTime.now())) {
      lock.setStatus(LockStatus.EXPIRED);
      lockRepository.save(lock);
      throw new IllegalStateException("Rate lock has expired");
    }

    FxConversion conv = conversionRepository.save(FxConversion.builder()
      .tenantId(tenantId).idempotencyKey("lock:" + lockId)
      .sellCurrency(lock.getSellCurrency()).buyCurrency(lock.getBuyCurrency())
      .sellAmount(lock.getSellAmount()).buyAmount(lock.getBuyAmount()).rate(lock.getLockedRate())
      .dealType(DealType.RATE_LOCK).rateLockId(lockId).status(FxConversion.ConversionStatus.EXECUTED)
      .createdBy(AuthContext.currentUserId().orElse(null)).build());

    lock.setStatus(LockStatus.EXECUTED);
    lock.setExecutedAt(LocalDateTime.now());
    lockRepository.save(lock);

    log.info("FX rate-lock executed: lock={}, {} {} → {} {} (tenant={})",
      lockId, conv.getSellAmount(), conv.getSellCurrency(), conv.getBuyAmount(), conv.getBuyCurrency(), tenantId);
    emitExecuted(conv);
    return ConversionResponse.from(conv);
  }

  public RateLockResponse cancelLock(UUID tenantId, UUID lockId) {
    FxRateLock lock = lockRepository.findByIdAndTenantId(lockId, tenantId)
      .orElseThrow(() -> new NotFoundException("Rate lock not found: " + lockId));
    if (lock.getStatus() != LockStatus.LOCKED) {
      throw new IllegalStateException("Only an active lock can be cancelled (" + lock.getStatus() + ")");
    }
    lock.setStatus(LockStatus.CANCELLED);
    return RateLockResponse.from(lockRepository.save(lock));
  }

  // ------------------------------------------------------------------- reads

  @Transactional(readOnly = true)
  public ConversionResponse getConversion(UUID tenantId, UUID id) {
    return ConversionResponse.from(conversionRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Conversion not found: " + id)));
  }

  @Transactional(readOnly = true)
  public Page<ConversionResponse> listConversions(UUID tenantId, int page, int size) {
    return conversionRepository.findByTenantId(tenantId,
        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
      .map(ConversionResponse::from);
  }

  @Transactional(readOnly = true)
  public RateLockResponse getLock(UUID tenantId, UUID id) {
    return RateLockResponse.from(lockRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Rate lock not found: " + id)));
  }

  @Transactional(readOnly = true)
  public Page<RateLockResponse> listLocks(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    if (status != null) {
      return lockRepository.findByTenantIdAndStatus(tenantId, parseLockStatus(status), pageable).map(RateLockResponse::from);
    }
    return lockRepository.findByTenantId(tenantId, pageable).map(RateLockResponse::from);
  }

  // ------------------------------------------------------------------- scheduled expiry

  @Transactional
  public int expireLocks() {
    var expired = lockRepository.findByStatusAndExpiresAtBefore(LockStatus.LOCKED, LocalDateTime.now());
    for (FxRateLock l : expired) {
      l.setStatus(LockStatus.EXPIRED);
    }
    if (!expired.isEmpty()) {
      lockRepository.saveAll(expired);
      log.info("Expired {} FX rate-locks", expired.size());
    }
    return expired.size();
  }

  // ------------------------------------------------------------------- helpers

  private void emitExecuted(FxConversion conv) {
    outbox.enqueue(conv.getTenantId(), "fx.conversion.executed", conv.getId().toString(), ConversionResponse.from(conv));
  }

  private LockStatus parseLockStatus(String value) {
    try {
      return LockStatus.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid status: " + value);
    }
  }
}
