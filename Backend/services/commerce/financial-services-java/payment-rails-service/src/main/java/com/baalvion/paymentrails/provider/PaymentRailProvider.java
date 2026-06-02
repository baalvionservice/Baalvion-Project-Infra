package com.baalvion.paymentrails.provider;

import com.baalvion.paymentrails.domain.PaymentInstruction;

import java.math.BigDecimal;

/**
 * Port to the rail/PSP that actually clears the payment (SWIFT correspondent, SEPA gateway,
 * UPI/PSP aggregator, etc.). Selected by {@code app.payment-rails.rail-provider}; the default
 * {@link SimulatedRailProvider} is self-contained for local/dev, and real PSP adapters can be
 * dropped in without touching the routing/domain logic.
 */
public interface PaymentRailProvider {

  /** Outcome of submitting an instruction to the rail. */
  record SubmitResult(boolean accepted, String railRef, BigDecimal fee, String failureReason) {}

  /** Submits a routed instruction to its chosen rail and returns the scheme reference + fee. */
  SubmitResult submit(PaymentInstruction instruction);

  /** Identifier of the active provider, surfaced in logs/responses for traceability. */
  String providerName();
}
