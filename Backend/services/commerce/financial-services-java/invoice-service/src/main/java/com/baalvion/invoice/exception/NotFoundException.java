package com.baalvion.invoice.exception;

/** Thrown when an invoice cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
