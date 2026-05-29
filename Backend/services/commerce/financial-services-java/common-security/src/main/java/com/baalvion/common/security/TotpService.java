package com.baalvion.common.security;

import org.apache.commons.codec.binary.Base32;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * RFC 6238 TOTP (Google Authenticator compatible) — design §7.1 MFA.
 *
 * Pure JDK implementation (HMAC-SHA1, 6 digits, 30s step). Secrets are Base32-encoded.
 * This is the verification primitive; enrolment/secret storage is delegated to
 * {@link MfaSecretStore} (ultimately backed by the Identity service).
 * Registered as a bean by {@code BaalvionSecurityAutoConfiguration}.
 */
public class TotpService {

  private static final int DIGITS = 6;
  private static final long STEP_SECONDS = 30;
  private static final int ALLOWED_DRIFT_STEPS = 1; // accept previous/next window for clock skew
  private static final Base32 BASE32 = new Base32();
  private static final SecureRandom RANDOM = new SecureRandom();

  /** Generates a new Base32 secret suitable for an authenticator app. */
  public String generateSecret() {
    byte[] bytes = new byte[20]; // 160-bit
    RANDOM.nextBytes(bytes);
    return BASE32.encodeToString(bytes).replace("=", "");
  }

  /** otpauth:// URI for QR enrolment. */
  public String provisioningUri(String secret, String account, String issuer) {
    return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d",
      issuer, account, secret, issuer, DIGITS, STEP_SECONDS);
  }

  /** Verifies a code against the secret, tolerating +/- one time step. */
  public boolean verify(String base32Secret, String code) {
    if (base32Secret == null || code == null) {
      return false;
    }
    String normalized = code.trim();
    long counter = Instant.now().getEpochSecond() / STEP_SECONDS;
    byte[] key = BASE32.decode(base32Secret);
    for (int drift = -ALLOWED_DRIFT_STEPS; drift <= ALLOWED_DRIFT_STEPS; drift++) {
      if (generate(key, counter + drift).equals(normalized)) {
        return true;
      }
    }
    return false;
  }

  /** The current TOTP code for a secret — useful for enrolment confirmation and testing. */
  public String currentCode(String base32Secret) {
    long counter = Instant.now().getEpochSecond() / STEP_SECONDS;
    return generate(BASE32.decode(base32Secret), counter);
  }

  private String generate(byte[] key, long counter) {
    try {
      byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
      Mac mac = Mac.getInstance("HmacSHA1");
      mac.init(new SecretKeySpec(key, "HmacSHA1"));
      byte[] hash = mac.doFinal(data);
      int offset = hash[hash.length - 1] & 0xF;
      int binary = ((hash[offset] & 0x7F) << 24)
        | ((hash[offset + 1] & 0xFF) << 16)
        | ((hash[offset + 2] & 0xFF) << 8)
        | (hash[offset + 3] & 0xFF);
      int otp = binary % (int) Math.pow(10, DIGITS);
      return String.format("%0" + DIGITS + "d", otp);
    } catch (Exception e) {
      throw new IllegalStateException("TOTP generation failed", e);
    }
  }
}
