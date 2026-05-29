package com.baalvion.settlement.transport;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.xfer.InMemorySourceFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Production SFTP transport for settlement-file delivery (design §5.4) using sshj.
 *
 * Hardening:
 *  - host-key verification is MANDATORY — a configured known_hosts file or fixed fingerprint;
 *    promiscuous verification is only permitted when explicitly enabled for local/dev.
 *  - credentials are supplied from the secret store (never in code).
 *  - the file and a {@code .sha256} checksum sidecar are uploaded; the upload is validated by
 *    re-stat'ing the remote size.
 *  - transient failures are retried with backoff.
 */
@Slf4j
public class SftpSettlementFileTransport implements SettlementFileTransport {

  private final String host;
  private final int port;
  private final String username;
  private final String password;
  private final String privateKeyPath;
  private final String knownHostsPath;
  private final String hostKeyFingerprint;
  private final boolean insecureAllowAnyHostKey;
  private final String remoteDir;
  private final int maxAttempts;
  private final int connectTimeoutMs;

  public SftpSettlementFileTransport(String host, int port, String username, String password,
                                     String privateKeyPath, String knownHostsPath, String hostKeyFingerprint,
                                     boolean insecureAllowAnyHostKey, String remoteDir, int maxAttempts, int connectTimeoutMs) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.privateKeyPath = privateKeyPath;
    this.knownHostsPath = knownHostsPath;
    this.hostKeyFingerprint = hostKeyFingerprint;
    this.insecureAllowAnyHostKey = insecureAllowAnyHostKey;
    this.remoteDir = remoteDir;
    this.maxAttempts = Math.max(1, maxAttempts);
    this.connectTimeoutMs = connectTimeoutMs;
  }

  @Override
  public void deliver(String scheme, String fileName, String content) {
    byte[] body = (content != null ? content : "").getBytes(StandardCharsets.UTF_8);
    String checksum = sha256(body);
    RuntimeException last = null;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        upload(scheme, fileName, body, checksum);
        log.info("Settlement file delivered via SFTP: scheme={}, file={}, bytes={}, sha256={}", scheme, fileName, body.length, checksum);
        return;
      } catch (Exception e) {
        last = new RuntimeException("SFTP delivery failed (attempt " + attempt + "/" + maxAttempts + "): " + e.getMessage(), e);
        log.warn(last.getMessage());
        sleep(attempt);
      }
    }
    throw last;
  }

  private void upload(String scheme, String fileName, byte[] body, String checksum) throws Exception {
    try (SSHClient ssh = new SSHClient()) {
      configureHostKeyVerification(ssh);
      ssh.setConnectTimeout(connectTimeoutMs);
      ssh.setTimeout(connectTimeoutMs);
      ssh.connect(host, port);
      authenticate(ssh);

      try (SFTPClient sftp = ssh.newSFTPClient()) {
        sftp.mkdirs(remoteDir);
        String remotePath = remoteDir + "/" + fileName;
        sftp.put(source(fileName, body), remotePath);

        // Upload the checksum sidecar for downstream integrity verification.
        byte[] sidecar = (checksum + "  " + fileName + "\n").getBytes(StandardCharsets.UTF_8);
        sftp.put(source(fileName + ".sha256", sidecar), remotePath + ".sha256");

        // Validate the upload by re-stat'ing the remote size.
        long remoteSize = sftp.stat(remotePath).getSize();
        if (remoteSize != body.length) {
          throw new IllegalStateException("Remote size mismatch: expected " + body.length + ", got " + remoteSize);
        }
      }
    }
  }

  private void configureHostKeyVerification(SSHClient ssh) throws Exception {
    if (hostKeyFingerprint != null && !hostKeyFingerprint.isBlank()) {
      ssh.addHostKeyVerifier(hostKeyFingerprint);
    } else if (knownHostsPath != null && !knownHostsPath.isBlank()) {
      ssh.loadKnownHosts(new File(knownHostsPath));
    } else if (insecureAllowAnyHostKey) {
      log.warn("SFTP host-key verification DISABLED (insecure) — local/dev only");
      ssh.addHostKeyVerifier(new PromiscuousVerifier());
    } else {
      throw new IllegalStateException(
        "SFTP refuses to connect without host-key verification: set app.settlement.sftp.host-key-fingerprint "
          + "or known-hosts-path (or insecure-allow-any-host-key=true for dev).");
    }
  }

  private void authenticate(SSHClient ssh) throws Exception {
    if (privateKeyPath != null && !privateKeyPath.isBlank()) {
      ssh.authPublickey(username, ssh.loadKeys(privateKeyPath));
    } else {
      ssh.authPassword(username, password);
    }
  }

  private InMemorySourceFile source(String name, byte[] data) {
    return new InMemorySourceFile() {
      @Override public String getName() { return name; }
      @Override public long getLength() { return data.length; }
      @Override public InputStream getInputStream() { return new ByteArrayInputStream(data); }
    };
  }

  private String sha256(byte[] data) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
    } catch (Exception e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  private void sleep(int attempt) {
    try {
      Thread.sleep(Math.min(1000L * attempt, 5000L));
    } catch (InterruptedException ie) {
      Thread.currentThread().interrupt();
    }
  }
}
