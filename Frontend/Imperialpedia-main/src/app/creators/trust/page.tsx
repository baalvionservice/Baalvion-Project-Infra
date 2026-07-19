import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FeatureUnavailable } from '@/components/system/FeatureUnavailable';

// Previous metadata advertised "real-time trust scores" — the page was entirely
// `mock-api/creators.getTrustDirectory()` fabricated data, so that claim was false.
export const metadata: Metadata = buildMetadata({
  canonical: '/creators/trust',
  title: 'Trusted Contributors Directory | Imperialpedia',
  description: 'Verified-contributor trust scoring is in development for Imperialpedia.',
});

/**
 * Was rendering `mock-api/creators.getTrustDirectory()` fabricated trust scores
 * (0-100 "trust_score" per creator) as if real. No real trust-scoring backend
 * exists yet — see the mock-data remediation report.
 */
export default function TrustedContributorsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <FeatureUnavailable
        title="Trusted Contributors Directory"
        reason="Contributor trust scoring isn't connected to a live verification backend yet."
        backHref="/creators"
        backLabel="Back to Creators"
      />
    </main>
  );
}
