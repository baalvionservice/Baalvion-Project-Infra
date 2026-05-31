package com.baalvion.trustscore.exception;

/** Thrown when a trust score cannot be found for the current tenant + subject. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
