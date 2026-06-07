import { cmsGetNavigation } from '@/lib/cms';
import { SEED_NAVIGATION } from '@/lib/cms-seed';

// Same-origin BFF for the IR primary navigation tree (cms-service 'post' slug primary-navigation).
// Falls back to seed navigation when the central CMS is unreachable or has none configured.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await cmsGetNavigation();
    return Response.json({ success: true, data: items.length > 0 ? items : SEED_NAVIGATION });
  } catch {
    return Response.json({ success: true, data: SEED_NAVIGATION });
  }
}
