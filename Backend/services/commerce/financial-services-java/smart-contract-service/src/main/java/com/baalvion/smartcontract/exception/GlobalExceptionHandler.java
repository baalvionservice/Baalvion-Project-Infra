package com.baalvion.smartcontract.exception;

import com.baalvion.smartcontract.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/** Standard error envelope: { timestamp, status, error, code, message, path, correlationId, fieldErrors? }. */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex, HttpServletRequest request) {
    log.warn("Not found: {}", ex.getMessage());
    return build(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
    log.warn("Bad request: {}", ex.getMessage());
    return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request);
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
    log.warn("Conflict: {}", ex.getMessage());
    return build(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
    log.warn("Constraint violation: {}", ex.getMessage());
    return build(HttpStatus.CONFLICT, "CONSTRAINT_VIOLATION", "Resource already exists or violates a constraint", request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(e -> fieldErrors.put(e.getField(), e.getDefaultMessage()));
    log.warn("Validation failed: {}", fieldErrors);
    ErrorResponse body = ErrorResponse.builder()
      .timestamp(LocalDateTime.now())
      .status(HttpStatus.UNPROCESSABLE_ENTITY.value())
      .error(HttpStatus.UNPROCESSABLE_ENTITY.getReasonPhrase())
      .code("VALIDATION_FAILED")
      .message("Request validation failed")
      .path(request.getRequestURI())
      .correlationId(MDC.get("traceId"))
      .fieldErrors(fieldErrors)
      .build();
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
    log.error("Unhandled exception", ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", request);
  }

  private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message, HttpServletRequest request) {
    ErrorResponse body = ErrorResponse.builder()
      .timestamp(LocalDateTime.now())
      .status(status.value())
      .error(status.getReasonPhrase())
      .code(code)
      .message(message)
      .path(request.getRequestURI())
      .correlationId(MDC.get("traceId"))
      .build();
    return ResponseEntity.status(status).body(body);
  }
}
