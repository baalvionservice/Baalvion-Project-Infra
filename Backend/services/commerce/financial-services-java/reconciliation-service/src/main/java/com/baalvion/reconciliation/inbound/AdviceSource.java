package com.baalvion.reconciliation.inbound;

import java.util.List;

/**
 * An inbound source of settlement-advice files (design §5.4 inbound file processing). Polled by
 * {@code InboundAdviceIngestionService}; after processing, each file is moved to the archive
 * (success) or the error/quarantine area (poison message). Implementations: local directory
 * (default) and SFTP (sshj).
 */
public interface AdviceSource {

  /** Files currently available to process (stable/complete only). */
  List<AdviceFile> poll();

  /** Move a successfully-processed file to the archive area. */
  void archive(String name);

  /** Move an unprocessable file to the error/quarantine area (DLQ). */
  void reject(String name);
}
