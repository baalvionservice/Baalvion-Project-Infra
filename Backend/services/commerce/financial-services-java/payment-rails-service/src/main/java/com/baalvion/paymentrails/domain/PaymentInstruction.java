package com.baalvion.paymentrails.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A payment instruction routed to a clearing rail. Created INITIATED, assigned a {@link Rail} by
 * the routing engine (ROUTED), submitted to the provider (SUBMITTED), then SETTLED or FAILED.
 */
@Entity
@Table(name = "payment_instructions", schema = "payment_rails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInstruction {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(nullable = false, length = 40)
  private String reference;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  @Builder.Default
  private Direction direction = Direction.OUTBOUND;

  @Column(name = "debtor_name", length = 255)
  private String debtorName;
  @Column(name = "debtor_account", length = 64)
  private String debtorAccount;
  @Column(name = "debtor_country", length = 2)
  private String debtorCountry;

  @Column(name = "creditor_name", nullable = false, length = 255)
  private String creditorName;
  @Column(name = "creditor_account", length = 64)
  private String creditorAccount;
  @Column(name = "creditor_bic", length = 11)
  private String creditorBic;
  @Column(name = "creditor_routing", length = 34)
  private String creditorRouting;
  @Column(name = "creditor_country", nullable = false, length = 2)
  private String creditorCountry;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(length = 255)
  private String purpose;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  @Builder.Default
  private Urgency urgency = Urgency.STANDARD;

  @Enumerated(EnumType.STRING)
  @Column(name = "requested_rail", length = 16)
  private Rail requestedRail;

  @Enumerated(EnumType.STRING)
  @Column(length = 16)
  private Rail rail;

  @Column(name = "rail_ref", length = 255)
  private String railRef;

  @Column(name = "fee_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal feeAmount = BigDecimal.ZERO;

  @Column(name = "fee_currency", length = 3)
  private String feeCurrency;

  @Column(length = 40)
  private String provider;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  @Builder.Default
  private PaymentStatus status = PaymentStatus.INITIATED;

  @Column(name = "failure_reason", columnDefinition = "TEXT")
  private String failureReason;

  @Column(name = "routing_note", columnDefinition = "TEXT")
  private String routingNote;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String metadata = "{}";

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;

  @Column(name = "settled_at")
  private LocalDateTime settledAt;

  public enum Direction { OUTBOUND, INBOUND }

  public enum Urgency { STANDARD, INSTANT, PRIORITY }

  /** Clearing rails the router can select. */
  public enum Rail { SWIFT, SEPA, SEPA_INSTANT, ACH, FEDWIRE, UPI, PIX, MPESA, SPEI, PAYNOW, FPS, INTERAC }

  /** INITIATED → ROUTED → SUBMITTED → SETTLED; failure: FAILED, RETURNED; terminal: SETTLED, CANCELLED. */
  public enum PaymentStatus { INITIATED, ROUTED, SUBMITTED, SETTLED, FAILED, RETURNED, CANCELLED }
}
