package com.baalvion.payment.gateway.exception;

/**
 * Raised when a VERIFIED provider webhook reports an amount that does not match the recorded
 * charge for a money-positive status transition (CAPTURED/AUTHORIZED must equal the charge
 * amount; a REFUNDED amount must be within (0, charge amount]). The signature was valid but the
 * amount is not — so the charge is NOT transitioned and the request is rejected (HTTP 400 via
 * {@code GlobalExceptionHandler}). This blocks forged/tampered webhooks that try to mark a charge
 * paid for a different amount.
 */
public class WebhookAmountMismatchException extends RuntimeException {

  public WebhookAmountMismatchException(String message) {
    super(message);
  }
}
