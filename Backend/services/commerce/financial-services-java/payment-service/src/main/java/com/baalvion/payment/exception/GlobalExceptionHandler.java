package com.baalvion.payment.exception;

import com.baalvion.payment.gateway.exception.PspConfigNotFoundException;
import com.baalvion.payment.gateway.exception.WebhookAmountMismatchException;
import com.baalvion.payment.gateway.exception.WebhookVerificationException;
import jakarta.persistence.OptimisticLockException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Standard error envelope (design §3.1): { code, message, traceId, timestamp } — plus
 * numeric status and field errors. traceId comes from the correlation-id MDC.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
    log.error("Bad request: {}", ex.getMessage());
    return envelope(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), null);
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
    log.error("Conflict: {}", ex.getMessage());
    return envelope(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), null);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
    log.warn("Access denied: {}", ex.getMessage());
    return envelope(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), null);
  }

  @ExceptionHandler(WebhookVerificationException.class)
  public ResponseEntity<Map<String, Object>> handleWebhookVerification(WebhookVerificationException ex) {
    // Generic message so an attacker cannot distinguish bad-signature from unknown-provider.
    log.warn("Webhook verification failed: {}", ex.getMessage());
    return envelope(HttpStatus.BAD_REQUEST, "WEBHOOK_VERIFICATION_FAILED", "Webhook signature verification failed", null);
  }

  @ExceptionHandler(WebhookAmountMismatchException.class)
  public ResponseEntity<Map<String, Object>> handleWebhookAmountMismatch(WebhookAmountMismatchException ex) {
    // The signature was valid but the amount is not — refuse the transition. Generic client
    // message; the specific expected/actual amounts are logged server-side only.
    log.error("Webhook amount mismatch — status transition refused: {}", ex.getMessage());
    return envelope(HttpStatus.BAD_REQUEST, "WEBHOOK_AMOUNT_MISMATCH",
      "Webhook amount did not match the recorded charge", null);
  }

  @ExceptionHandler(PspConfigNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handlePspConfigNotFound(PspConfigNotFoundException ex) {
    // Generic message so the response never reveals which slug/provider combination was missing.
    log.warn("PSP config not found: {}", ex.getMessage());
    return envelope(HttpStatus.UNPROCESSABLE_ENTITY, "PSP_CONFIG_NOT_FOUND",
      "No payment provider is configured for this site", null);
  }

  @ExceptionHandler({OptimisticLockingFailureException.class, OptimisticLockException.class})
  public ResponseEntity<Map<String, Object>> handleOptimisticLock(Exception ex) {
    log.error("Concurrent modification: {}", ex.getMessage());
    return envelope(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", "Resource was modified concurrently; retry the request", null);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
    log.error("Constraint violation: {}", ex.getMessage());
    return envelope(HttpStatus.CONFLICT, "CONSTRAINT_VIOLATION", "Resource already exists or violates a constraint", null);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    log.error("Validation error: {}", ex.getMessage());
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
    return envelope(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", "Request validation failed", errors);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
    log.error("Unhandled exception", ex);
    return envelope(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", null);
  }

  private ResponseEntity<Map<String, Object>> envelope(HttpStatus status, String code, String message, Map<String, String> errors) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("code", code);
    body.put("message", message);
    body.put("traceId", MDC.get("traceId"));
    body.put("timestamp", LocalDateTime.now());
    body.put("status", status.value());
    if (errors != null) {
      body.put("errors", errors);
    }
    return ResponseEntity.status(status).body(body);
  }
}
