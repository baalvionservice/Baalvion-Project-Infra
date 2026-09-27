import { NextResponse } from 'next/server';

/**
 * @fileOverview Fire-and-forget "Copy prompt" counter.
 *
 * Proxies server-side to imperialpedia-service's real prompts table
 * (POST /prompts/:slug/copy — see Backend/services/knowledge/imperialpedia-service/
 * controller/promptsController.js's recordPromptCopy). Same env/localhost-in-prod
 * guard as newsletter/route.ts.
 */
const envImpApi = process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL?.trim();
const isProd = process.env.NODE_ENV === 'production';
const IMP_API =
  (envImpApi && !(isProd && (envImpApi.includes('localhost') || envImpApi.includes('127.0.0.1'))))
    ? envImpApi
    : (isProd
        ? 'https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1'
        : 'http://localhost:3004/api/v1');

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const upstream = await fetch(`${IMP_API}/prompts/${encodeURIComponent(slug)}/copy`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) return NextResponse.json({ success: false }, { status: 502 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
