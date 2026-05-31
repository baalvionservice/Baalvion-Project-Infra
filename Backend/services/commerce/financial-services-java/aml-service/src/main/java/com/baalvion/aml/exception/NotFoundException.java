package com.baalvion.aml.exception;

/** Thrown when an AML alert cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
