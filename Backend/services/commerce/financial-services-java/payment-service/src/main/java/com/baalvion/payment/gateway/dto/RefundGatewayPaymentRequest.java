package com.baalvion.payment.gateway.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Inbound body for {@code POST /v1/gateway/payments/{id}/refund}.
 *
 * <p>{@code amount} is optional: omit for a FULL refund, supply (minor units) for a
 * PARTIAL refund. An empty body is valid and means a full refund.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundGatewayPaymentRequest {

  @DecimalMin(value = "1", message = "Refund amount (minor units) must be at least 1")
  @Digits(integer = 19, fraction = 0, message = "Refund amount must be a whole number in minor units")
  private BigDecimal amount;

  @Size(max = 255, message = "Reason must not exceed 255 characters")
  private String reason;
}
