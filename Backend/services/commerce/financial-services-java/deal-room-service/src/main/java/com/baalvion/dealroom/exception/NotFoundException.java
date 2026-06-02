package com.baalvion.dealroom.exception;

/** Thrown when a deal room, offer, or term sheet cannot be found for the current tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
