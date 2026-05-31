package com.baalvion.wallet.exception;

/** Raised when a requested wallet / balance / hold does not exist for the tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
