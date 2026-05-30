import { cmsListPages } from '@/lib/cms';

// Same-origin BFF: serves the IR page-builder definitions from cms-service (server-side, so the
// CMS_PUBLIC_URL stays private and the strict CSP holds). Consumed by the client-side
// page.repository which used to read the in-memory StorageAdapter/MOCK_PAGES.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await cmsListPages();
    return Response.json({ success: true, data: pages });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load pages from CMS';
    return Response.json({ success: false, data: [], error: { code: 'CMS_UNAVAILABLE', message } }, { status: 502 });
  }
}
