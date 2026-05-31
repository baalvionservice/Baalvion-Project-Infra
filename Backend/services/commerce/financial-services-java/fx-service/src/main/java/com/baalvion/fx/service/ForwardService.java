package com.baalvion.fx.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.fx.config.FxProperties;
import com.baalvion.fx.domain.FxConversion;
import com.baalvion.fx.domain.FxForward;
import com.baalvion.fx.domain.FxForward.ForwardStatus;
import com.baalvion.fx.dto.ForwardRequest;
import com.baalvion.fx.dto.ForwardResponse;
import com.baalvion.fx.exception.NotFoundException;
import com.baalvion.fx.provider.FxRateProvider;
import com.baalvion.fx.repository.FxConversionRepository;
import com.baalvion.fx.repository.FxForwardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Books and settles FX forward contracts. The forward rate is derived from the current spot by
 * covered interest-rate parity using the two currencies' indicative interest rates:
 *   F = S * (1 + r_quote * T/360) / (1 + r_base * T/360).
 * Booking blocks a cash margin; settlement executes the exchange at the contracted forward rate.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ForwardService {

  private static final int MONEY_SCALE = 4;
  private static final int RATE_SCALE = 8;
  private static final BigDecimal DAY_COUNT = new BigDecimal("360");

  private final FxRateService rateService;
  private final FxRateProvider provider;
  private final FxForwardRepository forwardRepository;
  private final FxConversionRepository conversionRepository;
  private final OutboxService outbox;
  private final FxProperties props;

  public ForwardResponse book(UUID tenantId, ForwardRequest req) {
    String idem = req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = forwardRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      return ForwardResponse.from(existing.get());
    }
    String sell = rateService.normalize(req.getSellCurrency());
    String buy = rateService.normalize(req.getBuyCurrency());
    if (sell.equals(buy)) {
      throw new IllegalArgumentException("sell and buy currencies must differ for a forward");
    }
    if (!req.getValueDate().isAfter(LocalDate.now())) {
      throw new IllegalArgumentException("valueDate must be in the future");
    }
    int tenorDays = (int) ChronoUnit.DAYS.between(LocalDate.now(), req.getValueDate());
    if (tenorDays > props.getForwardMaxTenorDays()) {
      throw new IllegalArgumentException("tenor exceeds the maximum of " + props.getForwardMaxTenorDays() + " days");
    }

    BigDecimal spot = provider.midRate(sell, buy);
    BigDecimal t = BigDecimal.valueOf(tenorDays).divide(DAY_COUNT, 10, RoundingMode.HALF_UP);
    BigDecimal rBase = provider.interestRate(sell);
    BigDecimal rQuote = provider.interestRate(buy);
    BigDecimal forwardRate = spot
      .multiply(BigDecimal.ONE.add(rQuote.multiply(t)))
      .divide(BigDecimal.ONE.add(rBase.multiply(t)), RATE_SCALE, RoundingMode.HALF_UP);
    BigDecimal forwardPoints = forwardRate.subtract(spot.setScale(RATE_SCALE, RoundingMode.HALF_UP));

    BigDecimal notional = req.getNotionalAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal buyAmount = notional.multiply(forwardRate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal margin = notional.multiply(props.getForwardMarginRate()).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    FxForward fwd = forwardRepository.save(FxForward.builder()
      .tenantId(tenantId).idempotencyKey(idem)
      .sellCurrency(sell).buyCurrency(buy)
      .notionalAmount(notional)
      .spotRateAtBook(spot.setScale(RATE_SCALE, RoundingMode.HALF_UP))
      .forwardRate(forwardRate).forwardPoints(forwardPoints).buyAmount(buyAmount)
      .valueDate(req.getValueDate()).tenorDays(tenorDays)
      .marginRate(props.getForwardMarginRate()).marginAmount(margin)
      .status(ForwardStatus.BOOKED)
      .createdBy(AuthContext.currentUserId().orElse(null)).build());

    log.info("FX forward booked: {} {} → {} {} @ {} value {} (tenant={})",
      notional, sell, buyAmount, buy, forwardRate, req.getValueDate(), tenantId);
    outbox.enqueue(tenantId, "fx.forward.booked", fwd.getId().toString(), ForwardResponse.from(fwd));
    return ForwardResponse.from(fwd);
  }

  /** Settles a matured forward into a conversion at the contracted forward rate. */
  public ForwardResponse settle(UUID tenantId, UUID id) {
    FxForward fwd = load(tenantId, id);
    if (fwd.getStatus() != ForwardStatus.BOOKED) {
      throw new IllegalStateException("Only a BOOKED forward can be settled (" + fwd.getStatus() + ")");
    }
    if (LocalDate.now().isBefore(fwd.getValueDate())) {
      throw new IllegalStateException("Forward cannot be settled before its value date " + fwd.getValueDate());
    }

    conversionRepository.save(FxConversion.builder()
      .tenantId(tenantId).idempotencyKey("forward:" + id)
      .sellCurrency(fwd.getSellCurrency()).buyCurrency(fwd.getBuyCurrency())
      .sellAmount(fwd.getNotionalAmount()).buyAmount(fwd.getBuyAmount()).rate(fwd.getForwardRate())
      .dealType(FxConversion.DealType.FORWARD).forwardId(id).status(FxConversion.ConversionStatus.SETTLED)
      .createdBy(AuthContext.currentUserId().orElse(null)).build());

    fwd.setStatus(ForwardStatus.SETTLED);
    fwd.setSettledAt(LocalDateTime.now());
    FxForward saved = forwardRepository.save(fwd);
    log.info("FX forward settled: id={}, {} {} → {} {} (tenant={})",
      id, fwd.getNotionalAmount(), fwd.getSellCurrency(), fwd.getBuyAmount(), fwd.getBuyCurrency(), tenantId);
    outbox.enqueue(tenantId, "fx.forward.settled", id.toString(), ForwardResponse.from(saved));
    return ForwardResponse.from(saved);
  }

  public ForwardResponse cancel(UUID tenantId, UUID id, String reason) {
    FxForward fwd = load(tenantId, id);
    if (fwd.getStatus() != ForwardStatus.BOOKED) {
      throw new IllegalStateException("Only a BOOKED forward can be cancelled (" + fwd.getStatus() + ")");
    }
    fwd.setStatus(ForwardStatus.CANCELLED);
    FxForward saved = forwardRepository.save(fwd);
    log.info("FX forward cancelled: id={}, tenant={}, reason={}", id, tenantId, reason);
    // Releases the blocked margin.
    outbox.enqueue(tenantId, "fx.forward.settled", id.toString(), ForwardResponse.from(saved));
    return ForwardResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public ForwardResponse get(UUID tenantId, UUID id) {
    return ForwardResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<ForwardResponse> list(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    if (status != null) {
      return forwardRepository.findByTenantIdAndStatus(tenantId, parseStatus(status), pageable).map(ForwardResponse::from);
    }
    return forwardRepository.findByTenantId(tenantId, pageable).map(ForwardResponse::from);
  }

  private FxForward load(UUID tenantId, UUID id) {
    return forwardRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Forward not found: " + id));
  }

  private ForwardStatus parseStatus(String value) {
    try {
      return ForwardStatus.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid status: " + value);
    }
  }
}
