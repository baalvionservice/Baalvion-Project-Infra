package com.baalvion.payment.gateway.exception;

/**
 * Raised when a tenant (website slug) has no enabled/configured PSP provider matching the
 * requested provider in the CMS "Integrations &amp; Keys" vault. Mapped to HTTP 422 by the global
 * exception handler with a generic message — an unconfigured tenant is a client-side
 * mis-configuration, not a server fault, and the response never reveals which slug/provider
 * combination was missing.
 */
public class PspConfigNotFoundException extends RuntimeException {

  public PspConfigNotFoundException(String provider, String siteSlug) {
    super("No enabled '" + provider + "' payment integration configured for site '" + siteSlug + "'");
  }
}
