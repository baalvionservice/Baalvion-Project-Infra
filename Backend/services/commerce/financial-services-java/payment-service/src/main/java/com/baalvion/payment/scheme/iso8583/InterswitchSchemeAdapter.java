package com.baalvion.payment.scheme.iso8583;

import com.baalvion.payment.domain.Transaction.PaymentScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Interswitch ISO 8583 adapter. Active only when {@code app.scheme.interswitch.host} is set
 * (else the simulated fallback handles INTERSWITCH). Endpoint/terminal identifiers come from
 * config; credentials/keys are injected via the secret store at deploy time.
 */
@Component
@ConditionalOnProperty(name = "app.scheme.interswitch.host")
public class InterswitchSchemeAdapter extends AbstractIso8583SchemeAdapter {

  @Value("${app.scheme.interswitch.host}")
  private String host;
  @Value("${app.scheme.interswitch.port:5003}")
  private int port;
  @Value("${app.scheme.interswitch.processing-code:000000}")
  private String processingCode;
  @Value("${app.scheme.interswitch.terminal-id:BAAL0001}")
  private String terminalId;
  @Value("${app.scheme.interswitch.merchant-id:BAALVION0000001}")
  private String merchantId;
  @Value("${app.scheme.interswitch.acquirer-id:00000000001}")
  private String acquirerId;
  @Value("${app.scheme.interswitch.connect-timeout-ms:5000}")
  private int connectTimeoutMs;
  @Value("${app.scheme.interswitch.read-timeout-ms:25000}")
  private int readTimeoutMs;

  public InterswitchSchemeAdapter(Iso8583Codec codec, Iso8583Client client) {
    super(codec, client);
  }

  @Override
  public boolean supports(PaymentScheme scheme) {
    return scheme == PaymentScheme.INTERSWITCH;
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
