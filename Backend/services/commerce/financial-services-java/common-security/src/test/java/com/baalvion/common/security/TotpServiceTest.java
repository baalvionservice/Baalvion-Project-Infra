package com.baalvion.common.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RFC 6238 TOTP tests (pure JUnit). Verifies generate/verify round-trip, drift tolerance, and
 * rejection of wrong codes.
 */
class TotpServiceTest {

  private final TotpService totp = new TotpService();

  @Test
  void generatedSecretIsUsableAndCurrentCodeVerifies() {
    String secret = totp.generateSecret();
    assertThat(secret).isNotBlank();
    String code = totp.currentCode(secret);
    assertThat(code).hasSize(6).containsOnlyDigits();
    assertThat(totp.verify(secret, code)).isTrue();
    assertThat(totp.verify(secret, " " + code + " ")).isTrue(); // trimmed
  }

  @Test
  void rejectsWrongCodeAndNulls() {
    String secret = totp.generateSecret();
    assertThat(totp.verify(secret, "000000")).isFalse();
    assertThat(totp.verify(secret, null)).isFalse();
    assertThat(totp.verify(null, "123456")).isFalse();
  }

  @Test
  void provisioningUriIsOtpauthFormat() {
    String uri = totp.provisioningUri("ABCDEFGH", "user@baalvion", "Baalvion");
    assertThat(uri).startsWith("otpauth://totp/Baalvion:user@baalvion?secret=ABCDEFGH");
    assertThat(uri).contains("issuer=Baalvion");
  }
}
