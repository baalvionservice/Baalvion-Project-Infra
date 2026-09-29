import { NextResponse } from 'next/server';
import { cmsGetEcosystem } from '@/lib/cms';

// Content is now managed centrally in the Baalvion CMS (admin-platform console).
const MANAGED_ELSEWHERE = {
  error: 'Content is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

export async function GET() {
  return NextResponse.json(await cmsGetEcosystem());
}

export async function POST() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function PUT() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
