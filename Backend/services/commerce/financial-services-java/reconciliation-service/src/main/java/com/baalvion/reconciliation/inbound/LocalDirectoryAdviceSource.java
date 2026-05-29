package com.baalvion.reconciliation.inbound;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Polls a local directory for advice files (design §5.4). The directory is the integration
 * boundary — an SFTP mount, S3 sync, or {@link SftpAdviceSource} feeds it. Only files quiescent
 * for {@code quietPeriod} are picked up, to avoid reading partially-written files. Processed
 * files are moved to {@code archive/}; rejects to {@code error/}.
 */
@Slf4j
public class LocalDirectoryAdviceSource implements AdviceSource {

  private final Path inboundDir;
  private final Path archiveDir;
  private final Path errorDir;
  private final Duration quietPeriod;

  public LocalDirectoryAdviceSource(String inboundDir, long quietPeriodMs) {
    this.inboundDir = Path.of(inboundDir);
    this.archiveDir = this.inboundDir.resolve("archive");
    this.errorDir = this.inboundDir.resolve("error");
    this.quietPeriod = Duration.ofMillis(quietPeriodMs);
    try {
      Files.createDirectories(archiveDir);
      Files.createDirectories(errorDir);
    } catch (IOException e) {
      throw new UncheckedIOException("Cannot prepare inbound directories under " + inboundDir, e);
    }
  }

  @Override
  public List<AdviceFile> poll() {
    List<AdviceFile> files = new ArrayList<>();
    Instant cutoff = Instant.now().minus(quietPeriod);
    try (Stream<Path> stream = Files.list(inboundDir)) {
      for (Path p : stream.filter(Files::isRegularFile).toList()) {
        if (Files.getLastModifiedTime(p).toInstant().isAfter(cutoff)) {
          continue; // still being written
        }
        files.add(new AdviceFile(p.getFileName().toString(), Files.readAllBytes(p)));
      }
    } catch (IOException e) {
      log.warn("Failed to list inbound dir {}: {}", inboundDir, e.getMessage());
    }
    return files;
  }

  @Override
  public void archive(String name) {
    move(name, archiveDir);
  }

  @Override
  public void reject(String name) {
    move(name, errorDir);
  }

  private void move(String name, Path targetDir) {
    try {
      Path src = inboundDir.resolve(name);
      if (Files.exists(src)) {
        Files.move(src, targetDir.resolve(System.currentTimeMillis() + "_" + name), StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException e) {
      log.error("Failed to move {} to {}: {}", name, targetDir, e.getMessage());
    }
  }
}
