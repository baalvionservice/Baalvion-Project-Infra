package com.baalvion.settlement.service;

import com.baalvion.settlement.domain.SettlementBatch;
import com.baalvion.settlement.domain.SettlementItem;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generates scheme-specific settlement file content.
 *
 * The formats here are representative, fixed-layout renderings (header / detail /
 * trailer) rather than byte-exact scheme specs — enough to drive downstream
 * delivery and reconciliation while keeping the service self-contained:
 *   VISA        -> EP745-style
 *   MASTERCARD  -> T112-style
 *   INTERSWITCH -> ISO 8583-style positional
 *   NIP/WALLET  -> generic pipe-delimited net file
 */
@Component
public class SchemeFileGenerator {

  private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

  public record GeneratedFile(String fileName, String content, String checksum) {}

  public GeneratedFile generate(SettlementBatch batch, List<SettlementItem> items) {
    String body = switch (batch.getScheme()) {
      case VISA -> visaEp745(batch, items);
      case MASTERCARD -> mastercardT112(batch, items);
      case INTERSWITCH -> interswitchIso8583(batch, items);
      case NIP, WALLET -> genericNetFile(batch, items);
    };
    String fileName = String.format("%s_%s_%s_%s.txt",
      batch.getScheme().name(),
      batch.getSettlementType().name(),
      batch.getSettlementDate().format(DATE),
      batch.getBatchRef());
    String checksum = DigestUtils.sha256Hex(body);
    return new GeneratedFile(fileName, body, checksum);
  }

  private String visaEp745(SettlementBatch b, List<SettlementItem> items) {
    StringBuilder sb = new StringBuilder();
    sb.append(String.format("EP745HDR|%s|%s|%s|%s%n",
      b.getSettlementDate().format(DATE), b.getCurrency(), b.getBatchRef(), b.getRecordCount()));
    int seq = 1;
    for (SettlementItem i : items) {
      sb.append(String.format("EP745DTL|%06d|%s|%s|%s%n", seq++, i.getTransactionId(), i.getAmount(), i.getFee()));
    }
    sb.append(String.format("EP745TRL|%s|%s|%s%n", b.getTotalAmount(), b.getTotalFees(), b.getNetAmount()));
    return sb.toString();
  }

  private String mastercardT112(SettlementBatch b, List<SettlementItem> items) {
    StringBuilder sb = new StringBuilder();
    sb.append(String.format("T112*HDR*%s*%s*%s*%d%n",
      b.getSettlementDate().format(DATE), b.getCurrency(), b.getBatchRef(), b.getRecordCount()));
    int seq = 1;
    for (SettlementItem i : items) {
      sb.append(String.format("T112*DTL*%06d*%s*%s*%s%n", seq++, i.getTransactionId(), i.getAmount(), i.getFee()));
    }
    sb.append(String.format("T140*TRL*%s*%s*%s%n", b.getTotalAmount(), b.getTotalFees(), b.getNetAmount()));
    return sb.toString();
  }

  private String interswitchIso8583(SettlementBatch b, List<SettlementItem> items) {
    StringBuilder sb = new StringBuilder();
    sb.append(String.format("0800%s%s%s%04d%n",
      b.getSettlementDate().format(DATE), pad(b.getCurrency(), 3), pad(b.getBatchRef(), 16), b.getRecordCount()));
    for (SettlementItem i : items) {
      sb.append(String.format("0220%s%012d%012d%n",
        pad(i.getTransactionId().toString(), 36),
        i.getAmount().movePointRight(2).longValue(),
        i.getFee().movePointRight(2).longValue()));
    }
    sb.append(String.format("0820%012d%012d%012d%n",
      b.getTotalAmount().movePointRight(2).longValue(),
      b.getTotalFees().movePointRight(2).longValue(),
      b.getNetAmount().movePointRight(2).longValue()));
    return sb.toString();
  }

  private String genericNetFile(SettlementBatch b, List<SettlementItem> items) {
    StringBuilder sb = new StringBuilder();
    sb.append(String.format("HDR|%s|%s|%s|%s|%d%n",
      b.getScheme().name(), b.getSettlementDate().format(DATE), b.getCurrency(), b.getBatchRef(), b.getRecordCount()));
    for (SettlementItem i : items) {
      sb.append(String.format("DTL|%s|%s|%s|%s%n", i.getTransactionId(),
        i.getTransactionRef() != null ? i.getTransactionRef() : "", i.getAmount(), i.getFee()));
    }
    sb.append(String.format("TRL|%s|%s|%s%n", b.getTotalAmount(), b.getTotalFees(), b.getNetAmount()));
    return sb.toString();
  }

  private String pad(String value, int len) {
    if (value == null) {
      value = "";
    }
    if (value.length() >= len) {
      return value.substring(0, len);
    }
    return String.format("%-" + len + "s", value);
  }
}
