package com.baalvion.payment.scheme;

import com.baalvion.payment.domain.Transaction.PaymentScheme;

/**
 * Strategy for routing a payment to a specific downstream scheme (design §5.2 / §3).
 *
 * Real adapters (NIP/Interswitch ISO 8583, Visa, Mastercard) implement this with their own
 * protocol/transport and are discovered as Spring beans by {@code SchemeRouter}. A single
 * {@link #fallback()} adapter handles any scheme without a dedicated implementation.
 */
public interface SchemeAdapter {

  /** Whether this adapter handles the given scheme. */
  boolean supports(PaymentScheme scheme);

  /**
   * Submit to the scheme and return its reference (e.g. ISO 8583 RRN).
   * @throws RuntimeException on a transport/scheme failure or decline (handled by the router's
   *         resilience layer, which degrades to deferred routing)
   */
  String send(SchemeRequest request);

  /** A fallback adapter is used only when no dedicated adapter supports the scheme. */
  default boolean fallback() {
    return false;
  }
}
