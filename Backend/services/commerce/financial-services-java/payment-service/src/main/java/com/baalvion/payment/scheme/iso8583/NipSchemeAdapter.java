package com.baalvion.payment.scheme.iso8583;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * NIBSS NIP (instant transfer) ISO 8583 adapter. Active only when {@code app.scheme.nip.host}
 * is set (else the simulated fallback handles NIP). Uses the shared ISO 8583 codec/transport;
 * processing code defaults to a transfer ("500000").
 */
@Component
@ConditionalOnProperty(name = "app.scheme.nip.host")
public class NipSchemeAdapter extends AbstractIso8583SchemeAdapter {

  @Value("${app.scheme.nip.host}")
  private String host;
  @Value("${app.scheme.nip.port:5005}")
  private int port;
  @Value("${app.scheme.nip.processing-code:500000}")
  private String processingCode;
  @Value("${app.scheme.nip.terminal-id:BAALNIP1}")
  private String terminalId;
  @Value("${app.scheme.nip.merchant-id:BAALVIONNIP00001}")
  private String merchantId;
  @Value("${app.scheme.nip.institution-code:000001}")
  private String acquirerId;
  @Value("${app.scheme.nip.connect-timeout-ms:5000}")
  private int connectTimeoutMs;
  @Value("${app.scheme.nip.read-timeout-ms:25000}")
  private int readTimeoutMs;

  public NipSchemeAdapter(Iso8583Codec codec, Iso8583Client client) {
    super(codec, client);
  }

  @Override
  public boolean supports(PaymentScheme scheme) {
    return scheme == PaymentScheme.NIP;
  }

  @Override protected String host() { return host; }
  @Override protected int port() { return port; }
  @Override protected String processingCode() { return processingCode; }
  @Override protected String terminalId() { return terminalId; }
  @Override protected String merchantId() { return merchantId; }
  @Override protected String acquirerId() { return acquirerId; }
  @Override protected int connectTimeoutMs() { return connectTimeoutMs; }
  @Override protected int readTimeoutMs() { return readTimeoutMs; }
}
