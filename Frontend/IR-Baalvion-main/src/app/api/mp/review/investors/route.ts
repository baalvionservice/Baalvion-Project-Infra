import { forward } from '@/lib/mp-forward';

// Staff review queue. marketplace-service enforces the staff role and reads cross-org over its
// privileged connection; this route is transport only.
export const dynamic = 'force-dynamic';

export const GET = (req: Request) => forward(req, '/admin/investors');
