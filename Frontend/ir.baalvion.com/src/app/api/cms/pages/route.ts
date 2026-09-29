import { cmsListPages } from '@/lib/cms';
import { SEED_PAGES } from '@/lib/cms-seed';

// Same-origin BFF: serves the IR page-builder definitions from cms-service (server-side, so the
// CMS_PUBLIC_URL stays private and the strict CSP holds). Consumed by the client-side
// page.repository which used to read the in-memory StorageAdapter/MOCK_PAGES.
// Falls back to seed content when the central CMS is unreachable or returns no pages, so the
// public site renders standalone.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await cmsListPages();
    return Response.json({ success: true, data: pages.length > 0 ? pages : SEED_PAGES });
  } catch {
    return Response.json({ success: true, data: SEED_PAGES });
  }
}
