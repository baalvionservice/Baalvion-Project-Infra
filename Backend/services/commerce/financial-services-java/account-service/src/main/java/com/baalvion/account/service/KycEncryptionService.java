package com.baalvion.account.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * AES-256-GCM envelope encryption for KYC documents (design §7.3 encryption at rest).
 *
 * The 256-bit data key is derived (SHA-256) from the high-entropy secret in
 * {@code app.kyc.encryption-key} (supplied from the secret store in real environments; rotate by
 * re-encrypting under a new secret). A fresh 96-bit IV is generated per document and stored with
 * the ciphertext; GCM provides authenticated encryption (tamper detection on decrypt).
 * (For multi-key rotation, HKDF with a per-document salt + key id is the hardening path.)
 */
@Service
public class KycEncryptionService {

  private static final int GCM_TAG_BITS = 128;
  private static final int IV_BYTES = 12;
  private static final SecureRandom RANDOM = new SecureRandom();

  @Value("${app.kyc.encryption-key:}")
  private String base64Key;

  public record Encrypted(byte[] ciphertext, byte[] iv) {}

  public Encrypted encrypt(byte[] plaintext) {
    try {
      byte[] iv = new byte[IV_BYTES];
      RANDOM.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(GCM_TAG_BITS, iv));
      return new Encrypted(cipher.doFinal(plaintext), iv);
    } catch (Exception e) {
      throw new IllegalStateException("KYC document encryption failed: " + e.getMessage(), e);
    }
  }

  public byte[] decrypt(byte[] ciphertext, byte[] iv) {
    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(GCM_TAG_BITS, iv));
      return cipher.doFinal(ciphertext);
    } catch (Exception e) {
      throw new IllegalStateException("KYC document decryption failed (key mismatch or tampered): " + e.getMessage(), e);
    }
  }

  private SecretKey key() {
    if (base64Key == null || base64Key.isBlank()) {
      throw new IllegalStateException("KYC encryption key not configured (app.kyc.encryption-key / KYC_ENCRYPTION_KEY)");
    }
    try {
      // Derive a 256-bit AES key from the configured secret material (SHA-256).
      byte[] keyBytes = MessageDigest.getInstance("SHA-256").digest(base64Key.getBytes(StandardCharsets.UTF_8));
      return new SecretKeySpec(keyBytes, "AES");
    } catch (Exception e) {
      throw new IllegalStateException("Unable to derive KYC encryption key", e);
    }
  }
}
