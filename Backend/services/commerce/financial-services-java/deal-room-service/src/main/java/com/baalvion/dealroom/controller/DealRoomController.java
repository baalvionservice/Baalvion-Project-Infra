package com.baalvion.dealroom.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.dealroom.dto.*;
import com.baalvion.dealroom.service.DealRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** REST API for bilateral deal-room negotiation. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/deal-rooms")
@RequiredArgsConstructor
public class DealRoomController {

  private final DealRoomService service;

  @PostMapping
  public ResponseEntity<DealResponse> open(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody OpenDealRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank() && request.getIdempotencyKey() == null) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.open(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<DealResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), id));
  }

  @GetMapping
  public ResponseEntity<Page<DealResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) UUID buyerId,
    @RequestParam(required = false) UUID sellerId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), status, buyerId, sellerId, page, size));
  }

  // --- negotiation ---

  @PostMapping("/{id}/counter-offers")
  public ResponseEntity<CounterOfferResponse> counter(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @Valid @RequestBody CounterOfferRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.counter(TenantContext.resolve(tenant), id, request));
  }

  @GetMapping("/{id}/counter-offers")
  public ResponseEntity<List<CounterOfferResponse>> listOffers(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listOffers(TenantContext.resolve(tenant), id));
  }

  @PostMapping("/{id}/accept")
  public ResponseEntity<DealResponse> accept(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam String party
  ) {
    return ResponseEntity.ok(service.accept(TenantContext.resolve(tenant), id, party));
  }

  @PostMapping("/{id}/reject-offer")
  public ResponseEntity<CounterOfferResponse> rejectOffer(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam String party,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.rejectOffer(TenantContext.resolve(tenant), id, party, reason));
  }

  @PostMapping("/{id}/reject")
  public ResponseEntity<DealResponse> rejectDeal(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.rejectDeal(TenantContext.resolve(tenant), id, reason));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<DealResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.cancel(TenantContext.resolve(tenant), id, reason));
  }

  // --- term sheet ---

  @GetMapping("/{id}/term-sheet")
  public ResponseEntity<TermSheetResponse> getTermSheet(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.getTermSheet(TenantContext.resolve(tenant), id));
  }

  @PostMapping("/{id}/term-sheet/sign")
  public ResponseEntity<TermSheetResponse> sign(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam String party
  ) {
    return ResponseEntity.ok(service.sign(TenantContext.resolve(tenant), id, party));
  }

  // --- messages ---

  @PostMapping("/{id}/messages")
  public ResponseEntity<MessageResponse> postMessage(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @Valid @RequestBody MessageRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.postMessage(TenantContext.resolve(tenant), id, request));
  }

  @GetMapping("/{id}/messages")
  public ResponseEntity<List<MessageResponse>> listMessages(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listMessages(TenantContext.resolve(tenant), id));
  }
}
