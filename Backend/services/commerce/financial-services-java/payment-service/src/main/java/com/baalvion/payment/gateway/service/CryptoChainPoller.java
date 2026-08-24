package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.provider.CryptoGateway;
import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Polls the public block-explorer APIs for every open crypto charge and applies confirmed
 * payments through {@link GatewayService#applyVerifiedResult} — the ONE way a crypto charge is
 * ever marked CAPTURED (there is no inbound webhook for a self-custodied wallet; see
 * {@code CryptoGateway}'s javadoc for why {@code POST /v1/gateway/webhooks/crypto} always
 * rejects). This class is the trust anchor for crypto payments: it is the only caller
 * permitted to construct a {@link WebhookResult} without a provider signature, because the
 * confirmation IS a direct, independent read of the blockchain, not a provider's say-so.
 */
@Slf4j
@Component
public class CryptoChainPoller {

  private static final String PROVIDER = "crypto";

  private final GatewayPaymentRepository repository;
  private final GatewayService gatewayService;
  private final CryptoGateway cryptoGateway;
  private final PspConfigResolver resolver;
  private final ObjectMapper objectMapper;

  public CryptoChainPoller(GatewayPaymentRepository repository, GatewayService gatewayService,
                            CryptoGateway cryptoGateway, PspConfigResolver resolver, ObjectMapper objectMapper) {
    this.repository = repository;
    this.gatewayService = gatewayService;
    this.cryptoGateway = cryptoGateway;
    this.resolver = resolver;
    this.objectMapper = objectMapper;
  }

  @Scheduled(fixedDelayString = "${app.psp.crypto.poll-interval-ms:30000}")
  public void pollPendingCharges() {
    List<GatewayPayment> pending = repository.findByProviderAndStatus(PROVIDER, GatewayStatus.CREATED);
    if (pending.isEmpty()) {
      return;
    }
    log.debug("Crypto poller: checking {} pending charge(s)", pending.size());
    for (GatewayPayment payment : pending) {
      try {
        checkOne(payment);
      } catch (Exception ex) {
        // One charge's transient failure (chain API hiccup, malformed rawResponse, …) must never
        // stop the rest of the batch from being checked.
        log.warn("Crypto poller: failed to check charge {}: {}", payment.getId(), ex.getMessage());
      }
    }
  }

  private void checkOne(GatewayPayment payment) {
    JsonNode raw = readTree(payment.getRawResponse());
    String asset = textOrNull(raw, "asset");
    String address = textOrNull(raw, "address");
    // BigInteger, read via .asText() (never .asLong()) — a stable 18-decimal asset's target
    // amount for a realistic dollar charge overflows a 64-bit long (see CryptoGateway's
    // ChainMatch javadoc for the real bug this was).
    String targetStr = textOrNull(raw, "targetSmallestUnit");
    java.math.BigInteger targetSmallestUnit = targetStr == null ? null : new java.math.BigInteger(targetStr);
    java.math.BigInteger taggingOffset = java.math.BigInteger.valueOf(raw.path("taggingOffsetSmallestUnit").asLong(0));
    String usdRateStr = textOrNull(raw, "usdRateUsed");
    BigDecimal usdRateUsed = usdRateStr == null ? null : new BigDecimal(usdRateStr);
    String expiresAtStr = textOrNull(raw, "expiresAt");

    if (asset == null || address == null || targetSmallestUnit == null) {
      log.warn("Crypto poller: charge {} has unparseable rawResponse — skipping", payment.getId());
      return;
    }

    if (expiresAtStr != null && Instant.now().isAfter(Instant.parse(expiresAtStr))) {
      log.info("Crypto charge {} expired unpaid — marking FAILED", payment.getId());
      payment.setStatus(GatewayStatus.FAILED);
      repository.save(payment);
      return;
    }

    String site = "__global__".equals(payment.getWebsiteSlug()) ? null : payment.getWebsiteSlug();
    ProviderConfig cfg = resolver.resolve(site, PROVIDER);

    Instant createdSince = payment.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toInstant();
    Optional<CryptoGateway.ChainMatch> match =
      cryptoGateway.checkForPayment(asset, address, targetSmallestUnit, createdSince, cfg);
    if (match.isEmpty()) {
      return;
    }

    CryptoGateway.ChainMatch m = match.get();
    long confirmedCents = cryptoGateway.confirmedAmountToCents(asset, m.confirmedSmallestUnit(), taggingOffset, usdRateUsed);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("asset", asset);
    payload.put("address", address);
    payload.put("txHash", m.txHash());
    payload.put("confirmedSmallestUnit", m.confirmedSmallestUnit());
    payload.put("confirmations", m.confirmations());

    WebhookResult result = new WebhookResult(
      PROVIDER,
      payment.getProviderRef(),
      m.txHash(),
      "crypto.payment.confirmed",
      GatewayStatus.CAPTURED,
      BigDecimal.valueOf(confirmedCents),
      payload
    );

    log.info("Crypto payment confirmed: charge={}, asset={}, txHash={}, confirmations={}",
      payment.getId(), asset, m.txHash(), m.confirmations());
    gatewayService.applyVerifiedResult(site, PROVIDER, result);
  }

  private JsonNode readTree(String body) {
    try {
      return objectMapper.readTree(body == null ? "{}" : body);
    } catch (Exception ex) {
      return objectMapper.getNodeFactory().objectNode();
    }
  }

  private static String textOrNull(JsonNode node, String field) {
    JsonNode value = node.get(field);
    return (value == null || value.isNull()) ? null : value.asText();
  }
}
