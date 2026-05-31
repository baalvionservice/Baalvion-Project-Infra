package com.baalvion.credit.exception;

/** Raised when a requested credit facility (invoice / plan / installment) does not exist. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
