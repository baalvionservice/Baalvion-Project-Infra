package com.baalvion.payment.service;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import com.baalvion.payment.dto.FeeBreakdown;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class FeeEngine {

  @Value("${app.vat-rate:0.075}")
  private BigDecimal vatRate;

  @Value("${app.daily-limit:1000000}")
  private BigDecimal dailyLimit;

  @Value("${app.transaction-min-limit:100}")
  private BigDecimal minLimit;

  @Value("${app.transaction-max-limit:500000}")
  private BigDecimal maxLimit;

  public FeeBreakdown calculateFees(BigDecimal amount, PaymentScheme scheme) {
    validateAmount(amount);

    BigDecimal percentageFee = BigDecimal.ZERO;
    BigDecimal flatFee = BigDecimal.ZERO;

    switch (scheme) {
      case VISA:
        percentageFee = amount.multiply(new BigDecimal("0.02"));
        flatFee = new BigDecimal("1.00");
        break;
      case MASTERCARD:
        percentageFee = amount.multiply(new BigDecimal("0.02"));
        flatFee = new BigDecimal("1.00");
        break;
      case NIP:
        percentageFee = amount.multiply(new BigDecimal("0.005"));
        flatFee = new BigDecimal("0.50");
        break;
      case INTERSWITCH:
        percentageFee = amount.multiply(new BigDecimal("0.015"));
        flatFee = new BigDecimal("0.75");
        break;
      case WALLET:
        percentageFee = amount.multiply(new BigDecimal("0.01"));
        flatFee = BigDecimal.ZERO;
        break;
      case INTERNAL:
        percentageFee = BigDecimal.ZERO;
        flatFee = BigDecimal.ZERO;
        break;
      case ESCROW:
        percentageFee = amount.multiply(new BigDecimal("0.02"));
        flatFee = new BigDecimal("2.00");
        break;
    }

    BigDecimal totalFee = percentageFee.add(flatFee).setScale(4, RoundingMode.HALF_UP);
    BigDecimal vat = totalFee.multiply(vatRate).setScale(4, RoundingMode.HALF_UP);

    log.debug("Fee calculation: scheme={}, amount={}, percentageFee={}, flatFee={}, totalFee={}, vat={}",
      scheme, amount, percentageFee, flatFee, totalFee, vat);

    return FeeBreakdown.builder()
      .amount(amount)
      .percentageFee(percentageFee)
      .flatFee(flatFee)
      .totalFee(totalFee)
      .vat(vat)
      .totalWithVat(totalFee.add(vat))
      .scheme(scheme.name())
      .build();
  }

  public void validateAmount(BigDecimal amount) {
    if (amount.compareTo(minLimit) < 0) {
      throw new IllegalArgumentException("Amount must be at least " + minLimit);
    }
    if (amount.compareTo(maxLimit) > 0) {
      throw new IllegalArgumentException("Amount must not exceed " + maxLimit);
    }
  }

  public void validateDailyLimit(BigDecimal dailyTotal, BigDecimal newAmount) {
    if (dailyTotal.add(newAmount).compareTo(dailyLimit) > 0) {
      throw new IllegalArgumentException("Daily limit of " + dailyLimit + " exceeded");
    }
  }
}
