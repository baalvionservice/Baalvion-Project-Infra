package com.baalvion.payment.gateway.exception;

/**
 * Raised when a provider webhook fails signature verification or is outside the
 * replay-tolerance window. Mapped to HTTP 400 by the gateway exception handling
 * so an attacker cannot distinguish "unknown provider" from "bad signature".
 */
public class WebhookVerificationException extends RuntimeException {

  public WebhookVerificationException(String message) {
    super(message);
  }

  public WebhookVerificationException(String message, Throwable cause) {
    super(message, cause);
  }
}
