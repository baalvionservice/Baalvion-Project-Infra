package com.baalvion.payment.gateway.dto;

import com.baalvion.payment.gateway.spi.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Inbound body for {@code POST /v1/gateway/payments}.
 *
 * <p>Mirrors the Node gateway-checkout create contract. {@code amount} is in MINOR
 * units (paise/cents). The {@code Idempotency-Key} arrives as a header, not in the body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiateGatewayPaymentRequest {

  @NotBlank(message = "Provider required")
  @Pattern(regexp = "(?i)razorpay|stripe|payu|cashfree", message = "Provider must be razorpay, stripe, payu, or cashfree")
  private String provider;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "1", message = "Amount (minor units) must be at least 1")
  @Digits(integer = 19, fraction = 0, message = "Amount must be a whole number in minor units")
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be an ISO 4217 code (3 chars)")
  private String currency;

  @NotNull(message = "Payment method required")
  private PaymentMethod method;

  @Size(max = 190, message = "Order reference must not exceed 190 characters")
  private String orderRef;

  private Map<String, String> customer;

  private Map<String, String> metadata;
}
