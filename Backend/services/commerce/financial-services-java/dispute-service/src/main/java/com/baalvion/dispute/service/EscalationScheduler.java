package com.baalvion.dispute.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically auto-escalates disputes whose response/mediation SLA window has elapsed. */
@Slf4j
@Component
@RequiredArgsConstructor
public class EscalationScheduler {

  private final DisputeService disputeService;

  @Scheduled(fixedDelayString = "${app.dispute.escalation-sweep-ms:300000}")
  public void sweep() {
    try {
      disputeService.escalateOverdue();
    } catch (Exception e) {
      log.warn("Dispute escalation sweep failed: {}", e.getMessage());
    }
  }
}
