package com.baalvion.risk.exception;

/**
 * Thrown when sanctions screening cannot be performed safely (e.g. the watchlist is empty under STRICT
 * enforcement). Screening fails CLOSED — the caller receives a 503, never a misleading {@code CLEAR} from
 * an empty list. This is the runtime counterpart to the boot-time fail-fast in {@code SanctionsBootstrap}.
 */
public class SanctionsUnavailableException extends RuntimeException {
  public SanctionsUnavailableException(String message) {
    super(message);
  }
}
