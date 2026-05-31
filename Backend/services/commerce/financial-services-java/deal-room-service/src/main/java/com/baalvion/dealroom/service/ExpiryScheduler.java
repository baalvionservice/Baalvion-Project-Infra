package com.baalvion.dealroom.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically sweeps open/negotiating deal rooms past their expiry to EXPIRED. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiryScheduler {

  private final DealRoomService dealRoomService;

  @Scheduled(fixedDelayString = "${app.deal-room.expiry-sweep-ms:60000}")
  public void sweep() {
    try {
      dealRoomService.expireOverdue();
    } catch (Exception e) {
      log.warn("Deal-room expiry sweep failed: {}", e.getMessage());
    }
  }
}
