package com.baalvion.tradefinance.exception;

/** Raised when a requested instrument (LC / guarantee / claim) does not exist for the tenant. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
