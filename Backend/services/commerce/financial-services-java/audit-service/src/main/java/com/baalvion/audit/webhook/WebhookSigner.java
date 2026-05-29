package com.baalvion.audit.webhook;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * HMAC-SHA256 webhook payload signing (design §7.2). Subscribers verify the
 * {@code X-Webhook-Signature: sha256=<hex>} header against the shared secret to authenticate
 * the callback and detect tampering.
 */
@Component
public class WebhookSigner {

  public String sign(String secret, String payload) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(raw.length * 2);
      for (byte b : raw) {
        hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
      }
      return "sha256=" + hex;
    } catch (Exception e) {
      throw new IllegalStateException("Webhook signing failed", e);
    }
  }
}
