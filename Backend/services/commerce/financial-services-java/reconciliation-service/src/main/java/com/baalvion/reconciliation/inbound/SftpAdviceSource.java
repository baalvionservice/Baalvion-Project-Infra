package com.baalvion.reconciliation.inbound;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.sftp.RemoteResourceInfo;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Polls a remote SFTP directory for advice files (design §5.4 SFTP polling) using sshj.
 * Mandatory host-key verification (known-hosts file or fixed fingerprint; promiscuous only with
 * an explicit insecure dev flag). Files are downloaded to a temp file then read; processed files
 * are renamed into the remote archive/error directories. One short-lived connection per poll.
 */
@Slf4j
public class SftpAdviceSource implements AdviceSource {

  private final String host;
  private final int port;
  private final String username;
  private final String password;
  private final String privateKeyPath;
  private final String knownHostsPath;
  private final String hostKeyFingerprint;
  private final boolean insecureAllowAnyHostKey;
  private final String inboundDir;
  private final String archiveDir;
  private final String errorDir;
  private final int connectTimeoutMs;

  public SftpAdviceSource(String host, int port, String username, String password, String privateKeyPath,
                          String knownHostsPath, String hostKeyFingerprint, boolean insecureAllowAnyHostKey,
                          String inboundDir, String archiveDir, String errorDir, int connectTimeoutMs) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.privateKeyPath = privateKeyPath;
    this.knownHostsPath = knownHostsPath;
    this.hostKeyFingerprint = hostKeyFingerprint;
    this.insecureAllowAnyHostKey = insecureAllowAnyHostKey;
    this.inboundDir = inboundDir;
    this.archiveDir = archiveDir;
    this.errorDir = errorDir;
    this.connectTimeoutMs = connectTimeoutMs;
  }

  @Override
  public List<AdviceFile> poll() {
    List<AdviceFile> files = new ArrayList<>();
    try (SSHClient ssh = connect(); SFTPClient sftp = ssh.newSFTPClient()) {
      sftp.mkdirs(archiveDir);
      sftp.mkdirs(errorDir);
      for (RemoteResourceInfo r : sftp.ls(inboundDir)) {
        if (!r.isRegularFile()) {
          continue;
        }
        Path tmp = Files.createTempFile("advice-", ".tmp");
        try {
          sftp.get(r.getPath(), tmp.toString());
          files.add(new AdviceFile(r.getName(), Files.readAllBytes(tmp)));
        } finally {
          Files.deleteIfExists(tmp);
        }
      }
    } catch (Exception e) {
      log.warn("SFTP advice poll failed for {}@{}:{} {}: {}", username, host, port, inboundDir, e.getMessage());
    }
    return files;
  }

  @Override
  public void archive(String name) {
    rename(name, archiveDir);
  }

  @Override
  public void reject(String name) {
    rename(name, errorDir);
  }

  private void rename(String name, String targetDir) {
    try (SSHClient ssh = connect(); SFTPClient sftp = ssh.newSFTPClient()) {
      sftp.rename(inboundDir + "/" + name, targetDir + "/" + System.currentTimeMillis() + "_" + name);
    } catch (Exception e) {
      log.error("SFTP move {} -> {} failed: {}", name, targetDir, e.getMessage());
    }
  }

  private SSHClient connect() throws Exception {
    SSHClient ssh = new SSHClient();
    if (hostKeyFingerprint != null && !hostKeyFingerprint.isBlank()) {
      ssh.addHostKeyVerifier(hostKeyFingerprint);
    } else if (knownHostsPath != null && !knownHostsPath.isBlank()) {
      ssh.loadKnownHosts(new File(knownHostsPath));
    } else if (insecureAllowAnyHostKey) {
      log.warn("SFTP advice source host-key verification DISABLED (insecure) — local/dev only");
      ssh.addHostKeyVerifier(new PromiscuousVerifier());
    } else {
      throw new IllegalStateException("SFTP advice source requires host-key verification "
        + "(known-hosts-path or host-key-fingerprint), or insecure-allow-any-host-key=true for dev");
    }
    ssh.setConnectTimeout(connectTimeoutMs);
    ssh.setTimeout(connectTimeoutMs);
    ssh.connect(host, port);
    if (privateKeyPath != null && !privateKeyPath.isBlank()) {
      ssh.authPublickey(username, ssh.loadKeys(privateKeyPath));
    } else {
      ssh.authPassword(username, password);
    }
    return ssh;
  }
}
