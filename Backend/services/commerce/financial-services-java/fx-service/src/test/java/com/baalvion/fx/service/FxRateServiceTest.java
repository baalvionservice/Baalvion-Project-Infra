package com.baalvion.fx.service;

import com.baalvion.fx.config.FxProperties;
import com.baalvion.fx.dto.QuoteResponse;
import com.baalvion.fx.provider.SimulatedFxRateProvider;
import com.baalvion.fx.repository.FxRateRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class FxRateServiceTest {

  private final FxRateService service = new FxRateService(
    new SimulatedFxRateProvider(), mock(FxRateRepository.class), new FxProperties());

  @Test
  void crossRate_isConsistentWithAnchorTable() {
    // EUR/USD ~ (USD perUsd 1) / (EUR perUsd 0.92) ≈ 1.087, within drift + spread tolerance.
    BigDecimal rate = service.dealRateForSell("EUR", "USD");
    assertThat(rate).isBetween(new BigDecimal("1.04"), new BigDecimal("1.13"));
  }

  @Test
  void quote_appliesRateToSellAmount() {
    QuoteResponse q = service.quote("USD", "INR", new BigDecimal("1000"));
    assertThat(q.getSellCurrency()).isEqualTo("USD");
    assertThat(q.getBuyCurrency()).isEqualTo("INR");
    // ~83 INR per USD, less spread → roughly 80k–84k INR for 1000 USD.
    assertThat(q.getBuyAmount()).isBetween(new BigDecimal("80000"), new BigDecimal("84000"));
  }

  @Test
  void sameCurrency_isUnitRate() {
    assertThat(service.dealRateForSell("USD", "USD")).isEqualByComparingTo("1");
  }

  @Test
  void unsupportedCurrency_isRejected() {
    assertThatThrownBy(() -> service.dealRateForSell("USD", "XXX"))
      .isInstanceOf(IllegalArgumentException.class);
  }
}
