package com.baalvion.payment.gateway.domain;

import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentMethod;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * GatewayPayment: a PSP (Razorpay / Stripe / PayU) charge in the gateway-checkout vertical.
 *
 * <p>Java port of the Node {@code GatewayPayment} model. Distinct from the legacy
 * interbank {@link com.baalvion.payment.domain.Transaction} (NIP/VISA/…); no fee/VAT
 * columns — gateway-checkout fees are provider-side. The {@code Idempotency-Key} is
 * unique (see {@code uk_gateway_idempotency_key}) so a retried create returns the
 * existing charge instead of double-charging.
 */
@Entity
@Table(
  name = "gateway_payments",
  schema = "payments",
  indexes = {
    @Index(name = "idx_gwpay_provider_ref", columnList = "provider,provider_ref"),
    @Index(name = "idx_gwpay_status", columnList = "status,created_at DESC"),
    @Index(name = "idx_gwpay_order_ref", columnList = "order_ref")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_gateway_idempotency_key", columnNames = {"idempotency_key"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GatewayPayment {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(length = 40, nullable = false)
  private String provider;

  /** Provider-side identifier (order id / payment intent id / txnid). */
  @Column(name = "provider_ref", length = 190)
  private String providerRef;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GatewayStatus status;

  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal amount;

  @Column(length = 3, nullable = false)
  private String currency;

  @Enumerated(EnumType.STRING)
  @Column
  private PaymentMethod method;

  /** Merchant order reference / receipt echoed to the provider. */
  @Column(name = "order_ref", length = 190)
  private String orderRef;

  @Column(name = "customer_json", columnDefinition = "jsonb")
  private String customerJson;

  @Column(name = "idempotency_key", length = 190, nullable = false)
  private String idempotencyKey;

  @Column(name = "raw_request", columnDefinition = "jsonb")
  private String rawRequest;

  @Column(name = "raw_response", columnDefinition = "jsonb")
  private String rawResponse;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (status == null) {
      status = GatewayStatus.CREATED;
    }
    if (customerJson == null) {
      customerJson = "{}";
    }
  }
}
