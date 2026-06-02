package com.baalvion.audit.controller;

import com.baalvion.audit.dto.DltMessageResponse;
import com.baalvion.audit.service.DltService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * DLT monitor + manual replay tool (design §4.3). Surfaced here in Audit; the platform
 * Admin Service can proxy these endpoints into its ops console.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/audit/dlt")
public class DltController {

  private final DltService dltService;

  public DltController(DltService dltService) {
    this.dltService = dltService;
  }

  @GetMapping
  public ResponseEntity<Page<DltMessageResponse>> list(
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(dltService.list(status, page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<DltMessageResponse> get(@PathVariable UUID id) {
    return ResponseEntity.ok(dltService.get(id));
  }

  @PostMapping("/{id}/replay")
  public ResponseEntity<DltMessageResponse> replay(
    @PathVariable UUID id,
    @RequestHeader(value = "X-Actor", required = false) String actor
  ) {
    String safeActor = actor == null ? null : actor.replaceAll("[\r\n\t]", "_");
    log.info("POST /audit/dlt/{}/replay by {}", id, safeActor);
    return ResponseEntity.ok(dltService.replay(id, actor));
  }

  @PostMapping("/{id}/discard")
  public ResponseEntity<DltMessageResponse> discard(
    @PathVariable UUID id,
    @RequestHeader(value = "X-Actor", required = false) String actor
  ) {
    String safeActor = actor == null ? null : actor.replaceAll("[\r\n\t]", "_");
    log.info("POST /audit/dlt/{}/discard by {}", id, safeActor);
    return ResponseEntity.ok(dltService.discard(id, actor));
  }
}
