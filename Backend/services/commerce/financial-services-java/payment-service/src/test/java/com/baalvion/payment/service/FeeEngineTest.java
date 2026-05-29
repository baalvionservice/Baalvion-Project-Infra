package com.baalvion.payment.service;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import com.baalvion.payment.dto.FeeBreakdown;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Fee-math correctness for {@link FeeEngine} (pure JUnit). Verifies per-scheme percentage + flat
 * fees, VAT, total-with-VAT, and the amount/daily-limit guards.
 */
class FeeEngineTest {

  private final FeeEngine engine = new FeeEngine();

  @BeforeEach
  void configure() {
    ReflectionTestUtils.setField(engine, "vatRate", new BigDecimal("0.075"));
    ReflectionTestUtils.setField(engine, "dailyLimit", new BigDecimal("1000000"));
    ReflectionTestUtils.setField(engine, "minLimit", new BigDecimal("100"));
    ReflectionTestUtils.setField(engine, "maxLimit", new BigDecimal("500000"));
  }

  @Test
  void visaFeesAreTwoPercentPlusFlatWithVat() {
    FeeBreakdown fb = engine.calculateFees(new BigDecimal("1000"), PaymentScheme.VISA);
    assertThat(fb.getPercentageFee()).isEqualByComparingTo("20.00"); // 2%
    assertThat(fb.getFlatFee()).isEqualByComparingTo("1.00");
    assertThat(fb.getTotalFee()).isEqualByComparingTo("21.0000");
    assertThat(fb.getVat()).isEqualByComparingTo("1.5750"); // 7.5% of 21
    assertThat(fb.getTotalWithVat()).isEqualByComparingTo("22.5750");
    assertThat(fb.getScheme()).isEqualTo("VISA");
  }

  @Test
  void nipIsCheaperThanCardSchemes() {
    FeeBreakdown fb = engine.calculateFees(new BigDecimal("1000"), PaymentScheme.NIP);
    assertThat(fb.getPercentageFee()).isEqualByComparingTo("5.000"); // 0.5%
    assertThat(fb.getFlatFee()).isEqualByComparingTo("0.50");
    assertThat(fb.getTotalFee()).isEqualByComparingTo("5.5000");
    assertThat(fb.getTotalWithVat()).isEqualByComparingTo("5.9125");
  }

  @Test
  void internalTransfersAreFree() {
    FeeBreakdown fb = engine.calculateFees(new BigDecimal("1000"), PaymentScheme.INTERNAL);
    assertThat(fb.getTotalFee()).isEqualByComparingTo("0");
    assertThat(fb.getVat()).isEqualByComparingTo("0");
    assertThat(fb.getTotalWithVat()).isEqualByComparingTo("0");
  }

  @Test
  void amountBoundsAreEnforced() {
    assertThatThrownBy(() -> engine.calculateFees(new BigDecimal("50"), PaymentScheme.VISA))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("at least");
    assertThatThrownBy(() -> engine.calculateFees(new BigDecimal("600000"), PaymentScheme.VISA))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("not exceed");
  }

  @Test
  void dailyLimitIsEnforced() {
    // within limit: ok
    engine.validateDailyLimit(new BigDecimal("900000"), new BigDecimal("50000"));
    // over limit: rejected
    assertThatThrownBy(() ->
      engine.validateDailyLimit(new BigDecimal("900000"), new BigDecimal("200000")))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("Daily limit");
  }
}
