package com.baalvion.settlement.transport;

/**
 * Delivers a generated settlement file to the scheme's endpoint (design §5.4 — "delivered to
 * scheme email/SFTP endpoints"). Implementations (SFTP, email, S3) are dropped in as beans;
 * the default logs the delivery so the flow is complete without external connectivity.
 */
public interface SettlementFileTransport {

  void deliver(String scheme, String fileName, String content);
}
