import React from 'react';
import { Container } from '@/design-system/layout/container';
import { BacktestingClient } from './BacktestingClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Strategy Backtesting Terminal | Pro Intelligence',
  description: 'Architect, simulate, and audit financial strategies against 5+ years of institutional historical data. Features visual equity curves and drawdown analysis.',
});

/**
 * Premium Strategy Backtesting Terminal (Server Entry).
 * Orchestrates the discovery of historical performance nodes and strategy validation logic.
 */
export default function BacktestingTerminalPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <BacktestingClient />
      </Container>
    </main>
  );
}
