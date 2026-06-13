package com.baalvion.payment.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * CMS "Integrations &amp; Keys" vault connection settings, bound from the {@code cms.*} namespace.
 *
 * <p>The deleted Node payment-service resolved per-tenant PSP keys by calling
 * {@code GET {baseUrl}/internal/integrations/{slug}} with header
 * {@code x-internal-secret: {INTERNAL_SERVICE_SECRET}}. This service replicates that contract via
 * {@code CmsIntegrationsClient}. Both values are injected at deploy time via env vars — never
 * hardcoded. When {@code base-url} is blank the resolver stays in GLOBAL (env-key) mode and never
 * calls the CMS, so single-tenant deployments need no CMS at all.
 *
 * <p>Example (application.yml):
 * <pre>
 * cms:
 *   base-url: ${CMS_BASE_URL:}          # e.g. http://cms-service:3011/api/v1
 *   internal-secret: ${INTERNAL_SERVICE_SECRET:}
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "cms")
@Data
public class CmsProperties {

  /** CMS API base, e.g. {@code http://cms-service:3011/api/v1}. Blank → GLOBAL (env) mode only. */
  private String baseUrl;

  /** Shared internal-service secret sent as the {@code x-internal-secret} header. Never logged. */
  private String internalSecret;
}
