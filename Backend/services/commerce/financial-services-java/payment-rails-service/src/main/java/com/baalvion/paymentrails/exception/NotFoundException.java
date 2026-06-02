package com.baalvion.paymentrails.exception;

/** Thrown when a payment instruction cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
