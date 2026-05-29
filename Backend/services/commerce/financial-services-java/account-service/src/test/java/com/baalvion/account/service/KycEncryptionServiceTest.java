package com.baalvion.account.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AES-256-GCM KYC encryption tests (pure JUnit). Round-trip, tamper detection (GCM auth tag),
 * and the missing-key guard.
 */
class KycEncryptionServiceTest {

  private KycEncryptionService withKey(String secret) {
    KycEncryptionService svc = new KycEncryptionService();
    ReflectionTestUtils.setField(svc, "base64Key", secret);
    return svc;
  }

  @Test
  void encryptThenDecryptRoundTrips() {
    KycEncryptionService svc = withKey("a-high-entropy-kyc-secret-for-tests-1234567890");
    byte[] plaintext = "passport-scan-bytes".getBytes(StandardCharsets.UTF_8);

    KycEncryptionService.Encrypted enc = svc.encrypt(plaintext);
    assertThat(enc.ciphertext()).isNotEqualTo(plaintext);
    assertThat(enc.iv()).hasSize(12);
    assertThat(svc.decrypt(enc.ciphertext(), enc.iv())).isEqualTo(plaintext);
  }

  @Test
  void tamperedCiphertextFailsAuthentication() {
    KycEncryptionService svc = withKey("secret-material-xyz");
    KycEncryptionService.Encrypted enc = svc.encrypt("sensitive".getBytes(StandardCharsets.UTF_8));
    enc.ciphertext()[0] ^= 0x01; // flip a bit
    assertThatThrownBy(() -> svc.decrypt(enc.ciphertext(), enc.iv()))
      .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void missingKeyIsRejected() {
    KycEncryptionService svc = withKey("");
    assertThatThrownBy(() -> svc.encrypt("x".getBytes(StandardCharsets.UTF_8)))
      .isInstanceOf(IllegalStateException.class);
  }
}
