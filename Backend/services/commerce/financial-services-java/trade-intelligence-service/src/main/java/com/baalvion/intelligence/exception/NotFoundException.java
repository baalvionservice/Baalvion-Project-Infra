package com.baalvion.intelligence.exception;

/** Thrown when a forecast or risk assessment cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
