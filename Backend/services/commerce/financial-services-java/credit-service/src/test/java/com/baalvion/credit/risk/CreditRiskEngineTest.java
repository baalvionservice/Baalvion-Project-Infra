package com.baalvion.credit.risk;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CreditRiskEngineTest {

  private final CreditRiskEngine engine = new CreditRiskEngine();

  @Test
  void cleanCounterparty_withShortTenor_isApprovedAtStrongGrade() {
    RiskAssessment a = engine.assess(RiskInput.builder()
      .amount(new BigDecimal("50000")).tenorDays(30).currency("USD")
      .priorDefaults(0).priorSettled(3).currentExposure(BigDecimal.ZERO).build());

    assertThat(a.isApproved()).isTrue();
    assertThat(a.getGrade()).isIn(RiskGrade.A, RiskGrade.B);
    assertThat(a.getMaxAdvanceRate()).isGreaterThanOrEqualTo(new BigDecimal("0.85"));
  }

  @Test
  void repeatedDefaults_pushScoreToDeclined() {
    RiskAssessment a = engine.assess(RiskInput.builder()
      .amount(new BigDecimal("400000")).tenorDays(120).currency("USD")
      .priorDefaults(3).priorSettled(0).currentExposure(new BigDecimal("300000")).build());

    assertThat(a.getGrade()).isEqualTo(RiskGrade.E);
    assertThat(a.isApproved()).isFalse();
    assertThat(a.getMaxAdvanceRate()).isEqualByComparingTo("0");
  }

  @Test
  void bureauScoreIsBlendedFiftyFifty() {
    RiskInput in = RiskInput.builder()
      .amount(new BigDecimal("10000")).tenorDays(30).currency("USD")
      .priorDefaults(0).priorSettled(0).currentExposure(BigDecimal.ZERO)
      .bureauScore(500).build();
    // internal base ~700, blended with 500 → ~600
    assertThat(engine.assess(in).getScore()).isBetween(590, 610);
  }
}
