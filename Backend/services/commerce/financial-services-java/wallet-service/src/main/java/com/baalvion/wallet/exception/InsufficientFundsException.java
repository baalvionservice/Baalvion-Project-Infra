package com.baalvion.wallet.exception;

/** Raised when a debit/hold/transfer/conversion exceeds the available balance. */
public class InsufficientFundsException extends RuntimeException {
  public InsufficientFundsException(String message) {
    super(message);
  }
}
