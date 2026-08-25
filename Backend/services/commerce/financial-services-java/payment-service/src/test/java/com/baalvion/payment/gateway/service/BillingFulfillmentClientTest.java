package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentMethod;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * dispatch()'s fulfillTarget branching was previously untested end-to-end (GatewayServiceTest
 * only mocks BillingFulfillmentClient). Stands up a real local HTTP endpoint (no test-only HTTP
 * dependency in this module) to prove a fulfillTarget:"wallet" charge is routed to
 * app.billing.wallet-fulfill-url — the same way "community"/"giftcard" already are.
 */
class BillingFulfillmentClientTest {

  private HttpServer server;

  @AfterEach
  void stop() {
    if (server != null) server.stop(0);
  }

  @Test
  void walletFulfillTargetDispatchesToWalletFulfillUrl() throws Exception {
    AtomicReference<String> hitPath = new AtomicReference<>();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/wallet/billing/fulfill", exchange -> {
      hitPath.set(exchange.getRequestURI().getPath());
      byte[] body = "{\"applied\":true}".getBytes();
      exchange.sendResponseHeaders(200, body.length);
      exchange.getResponseBody().write(body);
      exchange.close();
    });
    server.start();
    int port = server.getAddress().getPort();

    BillingFulfillmentClient client = new BillingFulfillmentClient(
        new ObjectMapper(),
        "http://127.0.0.1:" + port + "/default/billing/fulfill",
        "http://127.0.0.1:" + port + "/community/billing/fulfill",
        "http://127.0.0.1:" + port + "/giftcard/billing/fulfill",
        "http://127.0.0.1:" + port + "/wallet/billing/fulfill",
        true,
        "test-internal-secret");

    GatewayPayment payment = GatewayPayment.builder()
        .id(UUID.randomUUID())
        .provider("crypto")
        .providerRef("tx-abc123")
        .status(GatewayStatus.CAPTURED)
        .amount(new BigDecimal("2500"))
        .currency("USD")
        .method(PaymentMethod.CRYPTO)
        .rawRequest("{\"fulfillTarget\":\"wallet\",\"holderId\":\"" + UUID.randomUUID() + "\"}")
        .build();
    WebhookResult result = new WebhookResult("crypto", "tx-abc123", "evt-1", "payment.captured",
        GatewayStatus.CAPTURED, new BigDecimal("2500"), Map.of());

    client.dispatch(payment, result, "evt-1");

    assertThat(hitPath.get()).isEqualTo("/wallet/billing/fulfill");
  }
}
