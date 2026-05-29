package com.baalvion.common.security;

import java.util.Optional;

/**
 * Supplies a user's enrolled TOTP secret. The financial services do not own MFA enrolment
 * (that lives in the Identity service), so the default implementation reports "not enrolled"
 * and MFA enforcement no-ops. A real deployment provides a bean that resolves the secret
 * (e.g., a call to Identity or a shared store), at which point {@link MfaVerificationFilter}
 * begins enforcing TOTP on the configured privileged paths.
 */
public interface MfaSecretStore {

  /** @return the Base32 TOTP secret for the user, or empty if not enrolled. */
  Optional<String> secretForUser(String userId);

  /** Default: nobody is enrolled here → MFA enforcement is inert (scaffolding only). */
  class NotEnrolled implements MfaSecretStore {
    @Override
    public Optional<String> secretForUser(String userId) {
      return Optional.empty();
    }
  }
}
