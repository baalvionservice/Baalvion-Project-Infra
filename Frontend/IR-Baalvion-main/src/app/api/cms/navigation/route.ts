import { cmsGetNavigation } from '@/lib/cms';

// Same-origin BFF for the IR primary navigation tree (cms-service 'post' slug primary-navigation).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await cmsGetNavigation();
    return Response.json({ success: true, data: items });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load navigation from CMS';
    return Response.json({ success: false, data: [], error: { code: 'CMS_UNAVAILABLE', message } }, { status: 502 });
  }
}
