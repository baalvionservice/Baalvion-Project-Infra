import type {
  ConfigResolver,
  ConfigResolverOptions,
  IntegrationConfig,
  SdkCache,
  FetchLike,
} from '../types';
import { createMemoryCache } from '../memory-cache';

const DEFAULT_TTL = 60;

interface ResolverEnvelope {
  success?: boolean;
  data?: IntegrationConfig[];
}

/**
 * Resolves a tenant's API/payment/SMS/AI keys from the CMS Integrations & Keys
 * hub — the platform's ONLY source of truth for secrets. Wraps the internal
 * resolver (GET /api/v1/internal/integrations/:slug, x-internal-secret) with a
 * short-TTL cache so hot paths don't hammer cms-service. Console key changes
 * invalidate via `invalidate(slug)` (wire to the integration-updated event).
 */
export function createConfigResolver(opts: ConfigResolverOptions): ConfigResolver {
  const cache: SdkCache = opts.cache ?? createMemoryCache();
  const ttl = opts.cacheTtlSeconds ?? DEFAULT_TTL;
  const doFetch: FetchLike = opts.fetchImpl ?? ((globalThis as any).fetch as FetchLike);
  const base = opts.cmsBaseUrl.replace(/\/$/, '');
  const keyFor = (slug: string) => `sdk:cfg:${slug}`;

  async function fetchTenant(slug: string): Promise<IntegrationConfig[]> {
    const cached = await cache.get(keyFor(slug));
    if (cached) {
      try { return JSON.parse(cached) as IntegrationConfig[]; } catch { /* fall through */ }
    }
    if (!doFetch) throw new Error('config-resolver: no fetch implementation available');
    const url = `${base}/internal/integrations/${encodeURIComponent(slug)}`;
    const res = await doFetch(url, { headers: { 'x-internal-secret': opts.internalSecret } });
    if (!res.ok) {
      opts.logger?.warn?.({ slug, status: res.status }, 'config-resolver: CMS hub non-200');
      return [];
    }
    const body = (await res.json()) as ResolverEnvelope;
    const list = Array.isArray(body?.data) ? body.data : [];
    await cache.set(keyFor(slug), JSON.stringify(list), ttl);
    return list;
  }

  return {
    async getIntegrations(slug) {
      return fetchTenant(slug);
    },
    async getIntegration(slug, provider) {
      return (await fetchTenant(slug)).find((i) => i.provider === provider) ?? null;
    },
    async getSecret(slug, provider, key) {
      const i = (await fetchTenant(slug)).find((x) => x.provider === provider);
      return i?.secrets?.[key];
    },
    async getPaymentProvider(slug) {
      return (
        (await fetchTenant(slug)).find(
          (i) => i.category === 'payment' && i.enabled && i.status === 'configured',
        ) ?? null
      );
    },
    async invalidate(slug) {
      await cache.del(keyFor(slug));
    },
  };
}
