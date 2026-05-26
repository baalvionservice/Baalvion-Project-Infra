import React from 'react';
import { Container } from '@/design-system/layout/container';
import { AccessManagementClient } from './AccessManagementClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Access Orchestration | Governance',
  description: 'Manage platform feature gateways, define system personas, and orchestrate granular role-based access control for the Imperialpedia Index.',
});

/**
 * Platform Access Orchestration Hub (Governance).
 * Specialized suite for managing feature rollouts and role-based functional boundaries.
 */
export default function AccessManagementPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <AccessManagementClient />
      </Container>
    </main>
  );
}
