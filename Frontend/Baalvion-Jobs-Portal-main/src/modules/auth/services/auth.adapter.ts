
import { MockAuthService } from './auth.mock';
import { ApiAuthService } from './auth.api';

// Mock auth is OFF by default everywhere; only enabled by explicit dev opt-in.
const USE_MOCK = process.env.NEXT_PUBLIC_BAALVION_DEV_MOCK === '1';

export const authService = USE_MOCK
  ? MockAuthService
  : ApiAuthService;
