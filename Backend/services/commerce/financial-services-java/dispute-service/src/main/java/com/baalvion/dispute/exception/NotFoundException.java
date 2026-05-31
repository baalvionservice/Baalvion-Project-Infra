package com.baalvion.dispute.exception;

/** Thrown when a dispute cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
