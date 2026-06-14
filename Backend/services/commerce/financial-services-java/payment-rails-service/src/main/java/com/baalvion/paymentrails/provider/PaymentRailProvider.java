package com.baalvion.paymentrails.provider;

import com.baalvion.paymentrails.domain.PaymentInstruction;

import java.math.BigDecimal;

/**
 * Port to the rail/PSP that actually clears the payment (SWIFT correspondent, SEPA gateway,
 * UPI/PSP aggregator, etc.). When no real adapter is wired, {@link FailClosedRailProvider} is the
 * default fallback ({@link RailProviderConfig}) and refuses instructions rather than fabricating a
 * settlement. Real PSP adapters can be dropped in without touching the routing/domain logic.
 */
public interface PaymentRailProvider {

  /** Outcome of submitting an instruction to the rail. */
  record SubmitResult(boolean accepted, String railRef, BigDecimal fee, String failureReason) {}

  /** Submits a routed instruction to its chosen rail and returns the scheme reference + fee. */
  SubmitResult submit(PaymentInstruction instruction);

  /** Identifier of the active provider, surfaced in logs/responses for traceability. */
  String providerName();
}
