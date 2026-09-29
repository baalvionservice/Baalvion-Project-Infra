import { serverAdapter } from './adapters/server';
import { ApiAdapter } from './adapters/api.adapter';

// Single real backend adapter (jobs-service). The mock adapter tree has been retired:
// serverAdapter implements the full ApiAdapter surface (campus/talent/jobs/etc.) against
// jobs-service. Runtime is unchanged from USE_MOCK=false; this just removes the dead branch.
export const adapter: ApiAdapter = serverAdapter;
