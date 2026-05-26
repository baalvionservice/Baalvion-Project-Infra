import React from 'react';
import { Container } from '@/design-system/layout/container';
import { IncidentResponseClient } from './IncidentResponseClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Incident Response & Alerts | Governance',
  description: 'Manage platform anomalies, triage system incidents, and monitor real-time infrastructure alerts for the Imperialpedia cluster.',
});

/**
 * Platform Incident Response & Alerts Hub (Governance).
 * Specialized control suite for monitoring system health and triaging production threats.
 */
export default function IncidentResponsePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <IncidentResponseClient />
      </Container>
    </main>
  );
}
