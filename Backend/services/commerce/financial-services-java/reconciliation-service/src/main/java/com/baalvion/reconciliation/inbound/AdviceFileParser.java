package com.baalvion.reconciliation.inbound;

import com.baalvion.reconciliation.dto.ReconRecord;
import com.baalvion.reconciliation.dto.ReconcileRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Parses a reconciliation advice file into a {@link ReconcileRequest} (design §5.4 advice
 * parsing). Pipe-delimited, line-oriented; carries both the platform extract (INT) and the
 * scheme advice (EXT) for a run, plus the tenant:
 *
 * <pre>
 *   RECON|&lt;runRef&gt;|&lt;tenantId&gt;|&lt;sourceLabel&gt;
 *   INT|&lt;transactionRef&gt;|&lt;amount&gt;
 *   EXT|&lt;transactionRef&gt;|&lt;amount&gt;
 * </pre>
 *
 * Blank lines and lines starting with '#' are ignored. Malformed files throw and are routed to
 * the error area by the ingestion service.
 */
@Component
public class AdviceFileParser {

  public record ParsedAdvice(UUID tenantId, ReconcileRequest request) {}

  public ParsedAdvice parse(String fileName, byte[] content) {
    String text = new String(content, StandardCharsets.UTF_8);
    String[] lines = text.split("\\r?\\n");

    String runRef = null;
    UUID tenantId = null;
    String sourceLabel = fileName;
    List<ReconRecord> internal = new ArrayList<>();
    List<ReconRecord> external = new ArrayList<>();

    for (int i = 0; i < lines.length; i++) {
      String line = lines[i].trim();
      if (line.isEmpty() || line.startsWith("#")) {
        continue;
      }
      String[] f = line.split("\\|", -1);
      switch (f[0]) {
        case "RECON" -> {
          require(f.length >= 3, fileName, i, "RECON|runRef|tenantId[|source]");
          runRef = f[1].trim();
          tenantId = UUID.fromString(f[2].trim());
          if (f.length >= 4 && !f[3].isBlank()) {
            sourceLabel = f[3].trim();
          }
        }
        case "INT" -> internal.add(record(fileName, i, f));
        case "EXT" -> external.add(record(fileName, i, f));
        default -> throw new IllegalArgumentException(
          "Unknown record type '" + f[0] + "' in " + fileName + " line " + (i + 1));
      }
    }

    if (runRef == null || tenantId == null) {
      throw new IllegalArgumentException("Missing RECON header (runRef/tenantId) in " + fileName);
    }

    ReconcileRequest request = ReconcileRequest.builder()
      .runRef(runRef)
      .sourceFile(fileName)
      .batchRef(sourceLabel)
      .internalRecords(internal)
      .externalRecords(external)
      .build();
    return new ParsedAdvice(tenantId, request);
  }

  private ReconRecord record(String fileName, int line, String[] f) {
    require(f.length >= 3, fileName, line, f[0] + "|transactionRef|amount");
    return new ReconRecord(f[1].trim(), new BigDecimal(f[2].trim()));
  }

  private void require(boolean ok, String fileName, int line, String expected) {
    if (!ok) {
      throw new IllegalArgumentException("Malformed line " + (line + 1) + " in " + fileName + "; expected " + expected);
    }
  }
}
