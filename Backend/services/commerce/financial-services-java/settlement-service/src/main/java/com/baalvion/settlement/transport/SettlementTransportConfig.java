package com.baalvion.settlement.transport;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Selects the settlement-file transport: SFTP when {@code app.settlement.transport=sftp}
 * (production), otherwise a logging no-op (dev). Deterministic bean wiring (no component-scan
 * ordering ambiguity); credentials come from the secret store via the SFTP env/config.
 */
@Configuration
public class SettlementTransportConfig {

  @Bean
  @ConditionalOnProperty(name = "app.settlement.transport", havingValue = "sftp")
  public SettlementFileTransport sftpSettlementFileTransport(
    @Value("${app.settlement.sftp.host}") String host,
    @Value("${app.settlement.sftp.port:22}") int port,
    @Value("${app.settlement.sftp.username}") String username,
    @Value("${app.settlement.sftp.password:}") String password,
    @Value("${app.settlement.sftp.private-key-path:}") String privateKeyPath,
    @Value("${app.settlement.sftp.known-hosts-path:}") String knownHostsPath,
    @Value("${app.settlement.sftp.host-key-fingerprint:}") String hostKeyFingerprint,
    @Value("${app.settlement.sftp.insecure-allow-any-host-key:false}") boolean insecureAllowAnyHostKey,
    @Value("${app.settlement.sftp.remote-dir:/upload/settlement}") String remoteDir,
    @Value("${app.settlement.sftp.max-attempts:3}") int maxAttempts,
    @Value("${app.settlement.sftp.connect-timeout-ms:10000}") int connectTimeoutMs
  ) {
    return new SftpSettlementFileTransport(host, port, username, password, privateKeyPath,
      knownHostsPath, hostKeyFingerprint, insecureAllowAnyHostKey, remoteDir, maxAttempts, connectTimeoutMs);
  }

  @Bean
  @ConditionalOnMissingBean(SettlementFileTransport.class)
  public SettlementFileTransport loggingSettlementFileTransport() {
    return new LoggingSettlementFileTransport();
  }
}
