package com.baalvion.audit.webhook;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Known-answer tests for HMAC-SHA256 webhook signing (pure JUnit — runs on any JDK 17).
 * The vector is the widely-published HMAC-SHA256("key", "The quick brown fox...") value.
 */
class WebhookSignerTest {

  private final WebhookSigner signer = new WebhookSigner();

  @Test
  void matchesKnownHmacSha256Vector() {
    String sig = signer.sign("key", "The quick brown fox jumps over the lazy dog");
    assertThat(sig).isEqualTo("sha256=f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  }

  @Test
  void differentSecretProducesDifferentSignature() {
    String payload = "{\"event\":\"payments.transaction.completed\"}";
    assertThat(signer.sign("secret-a", payload)).isNotEqualTo(signer.sign("secret-b", payload));
  }

  @Test
  void isDeterministicForSameInputs() {
    assertThat(signer.sign("s", "p")).isEqualTo(signer.sign("s", "p"));
  }
}
