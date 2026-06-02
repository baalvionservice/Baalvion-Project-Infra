package com.baalvion.fx.exception;

/** Raised when a requested FX resource (rate / lock / conversion / forward) does not exist. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
