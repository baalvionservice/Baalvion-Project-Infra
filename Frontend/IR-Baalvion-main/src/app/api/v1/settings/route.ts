import { NextResponse } from 'next/server';

// Seed platform settings singleton (standalone mode). Consumed by settingsApi.get → json.data.
export const dynamic = 'force-dynamic';

const SETTINGS = {
  branding: { siteName: 'Baalvion Investor Relations', primaryColor: '#0b5fff', logoUrl: '' },
  seo: {
    title: 'Baalvion — Investor Relations',
    description: 'Institutional investor relations portal for Baalvion.',
    keywords: ['Baalvion', 'investor relations', 'institutional'],
  },
  features: { voting: true, dataRoom: true, emailAlerts: true, capitalOps: true },
  environment: 'production',
};

export async function GET() {
  return NextResponse.json({ success: true, data: SETTINGS });
}
