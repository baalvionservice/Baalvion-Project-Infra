
import { MockAuthService } from './auth.mock';
import { ApiAuthService } from './auth.api';

// Mock auth is OFF by default and can NEVER activate in production — NODE_ENV is inlined at build
// time, so the MockAuthService branch is dead-code-eliminated from production bundles.
const USE_MOCK =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BAALVION_DEV_MOCK === '1';

export const authService = USE_MOCK
  ? MockAuthService
  : ApiAuthService;
