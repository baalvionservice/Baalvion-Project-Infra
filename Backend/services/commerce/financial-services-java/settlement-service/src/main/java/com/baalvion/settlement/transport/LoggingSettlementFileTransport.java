package com.baalvion.settlement.transport;

import lombok.extern.slf4j.Slf4j;

/**
 * Default transport: records that a settlement file would be delivered. Selected by
 * {@code SettlementTransportConfig} when no real transport (e.g. SFTP) is configured, so the
 * delivery flow is complete without external connectivity.
 */
@Slf4j
public class LoggingSettlementFileTransport implements SettlementFileTransport {

  @Override
  public void deliver(String scheme, String fileName, String content) {
    int size = content != null ? content.length() : 0;
    log.info("[settlement-delivery] scheme={}, file={}, bytes={} (no transport configured — logged only)", scheme, fileName, size);
  }
}
