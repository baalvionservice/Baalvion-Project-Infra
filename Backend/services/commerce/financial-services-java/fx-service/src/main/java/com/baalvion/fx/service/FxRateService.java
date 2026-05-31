package com.baalvion.fx.service;

import com.baalvion.fx.config.FxProperties;
import com.baalvion.fx.domain.FxRate;
import com.baalvion.fx.dto.QuoteResponse;
import com.baalvion.fx.dto.RateResponse;
import com.baalvion.fx.provider.FxRateProvider;
import com.baalvion.fx.repository.FxRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Computes dealable FX rates from the active {@link FxRateProvider}, applying the dealer spread,
 * and maintains a refreshed snapshot of the major pairs in {@code fx_rates} for fast reads and
 * audit. Rates carry a short TTL (the platform's 30s standard).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FxRateService {

  private static final int RATE_SCALE = 8;
  private static final int MONEY_SCALE = 4;
  private static final BigDecimal BPS = new BigDecimal("10000");

  private final FxRateProvider provider;
  private final FxRateRepository rateRepository;
  private final FxProperties props;

  /** Full two-sided snapshot for a pair (mid / bid / ask) with the dealer spread applied. */
  public FxRate computeRate(String base, String quote) {
    String b = normalize(base), q = normalize(quote);
    BigDecimal mid = provider.midRate(b, q);
    BigDecimal spread = BigDecimal.valueOf(props.getSpreadBps()).divide(BPS, 10, RoundingMode.HALF_UP);
    BigDecimal bid = mid.multiply(BigDecimal.ONE.subtract(spread)).setScale(RATE_SCALE, RoundingMode.HALF_UP);
    BigDecimal ask = mid.multiply(BigDecimal.ONE.add(spread)).setScale(RATE_SCALE, RoundingMode.HALF_UP);
    return FxRate.builder()
      .baseCurrency(b).quoteCurrency(q)
      .midRate(mid.setScale(RATE_SCALE, RoundingMode.HALF_UP))
      .bidRate(bid).askRate(ask)
      .source(provider.providerName())
      .asOf(LocalDateTime.now())
      .ttlSeconds(props.getRateTtlSeconds())
      .build();
  }

  public RateResponse getRate(String base, String quote) {
    return RateResponse.from(computeRate(base, quote));
  }

  /** Snapshot of every supported pair against the given base currency. */
  public List<RateResponse> listRates(String base) {
    String b = normalize(base);
    List<RateResponse> out = new ArrayList<>();
    for (String q : provider.supportedCurrencies()) {
      if (!q.equals(b)) {
        out.add(RateResponse.from(computeRate(b, q)));
      }
    }
    out.sort((a, c) -> a.getQuoteCurrency().compareTo(c.getQuoteCurrency()));
    return out;
  }

  /**
   * Dealable rate for a client SELLING {@code sell} to BUY {@code buy}: buy-units per 1 sell-unit,
   * net of the dealer spread (the client receives the bid side).
   */
  public BigDecimal dealRateForSell(String sell, String buy) {
    String s = normalize(sell), b = normalize(buy);
    if (s.equals(b)) {
      return BigDecimal.ONE.setScale(RATE_SCALE, RoundingMode.HALF_UP);
    }
    BigDecimal mid = provider.midRate(s, b);
    BigDecimal spread = BigDecimal.valueOf(props.getSpreadBps()).divide(BPS, 10, RoundingMode.HALF_UP);
    return mid.multiply(BigDecimal.ONE.subtract(spread)).setScale(RATE_SCALE, RoundingMode.HALF_UP);
  }

  public QuoteResponse quote(String sell, String buy, BigDecimal sellAmount) {
    if (sellAmount == null || sellAmount.signum() <= 0) {
      throw new IllegalArgumentException("sellAmount must be positive");
    }
    BigDecimal rate = dealRateForSell(sell, buy);
    BigDecimal buyAmount = sellAmount.multiply(rate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    return QuoteResponse.builder()
      .sellCurrency(normalize(sell)).buyCurrency(normalize(buy))
      .sellAmount(sellAmount.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
      .buyAmount(buyAmount).rate(rate).asOf(LocalDateTime.now())
      .build();
  }

  /** Periodically persists the USD-base snapshot for fast reads + audit/history. */
  @Scheduled(fixedDelayString = "${app.fx.refresh-ms:15000}")
  @Transactional
  public void refreshSnapshots() {
    try {
      String base = "USD";
      for (String quote : provider.supportedCurrencies()) {
        if (quote.equals(base)) continue;
        FxRate computed = computeRate(base, quote);
        FxRate row = rateRepository.findByBaseCurrencyAndQuoteCurrency(base, quote).orElse(computed);
        row.setBaseCurrency(base);
        row.setQuoteCurrency(quote);
        row.setMidRate(computed.getMidRate());
        row.setBidRate(computed.getBidRate());
        row.setAskRate(computed.getAskRate());
        row.setSource(computed.getSource());
        row.setAsOf(computed.getAsOf());
        row.setTtlSeconds(computed.getTtlSeconds());
        rateRepository.save(row);
      }
    } catch (Exception e) {
      log.warn("FX snapshot refresh failed: {}", e.getMessage());
    }
  }

  String normalize(String c) {
    if (c == null || c.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
    return c.trim().toUpperCase();
  }
}
