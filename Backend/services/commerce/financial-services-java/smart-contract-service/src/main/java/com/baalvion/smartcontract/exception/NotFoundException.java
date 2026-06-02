package com.baalvion.smartcontract.exception;

/** Thrown when a contract or signature cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
