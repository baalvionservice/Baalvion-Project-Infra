package com.baalvion.payment.gateway.dto;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Response envelope for the gateway-checkout endpoints.
 *
 * <p>Carries the persisted charge plus the non-secret {@code clientParams} the
 * browser SDK needs to finish checkout (populated on initiate). {@code idempotentReplay}
 * mirrors the Node flag indicating the create call returned an existing charge.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GatewayPaymentResponse {

  private UUID id;
  private String provider;
  private String providerRef;
  private String status;
  private BigDecimal amount;
  private String currency;
  private String method;
  private String orderRef;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  /** Non-secret values handed to the client SDK (Razorpay key/orderId, Stripe clientSecret, PayU hash). */
  private Map<String, String> clientParams;

  /** True when an idempotent create returned the pre-existing charge instead of creating a new one. */
  private boolean idempotentReplay;

  public static GatewayPaymentResponse from(GatewayPayment p) {
    return GatewayPaymentResponse.builder()
      .id(p.getId())
      .provider(p.getProvider())
      .providerRef(p.getProviderRef())
      .status(p.getStatus() != null ? p.getStatus().name() : null)
      .amount(p.getAmount())
      .currency(p.getCurrency())
      .method(p.getMethod() != null ? p.getMethod().name() : null)
      .orderRef(p.getOrderRef())
      .createdAt(p.getCreatedAt())
      .updatedAt(p.getUpdatedAt())
      .build();
  }
}
