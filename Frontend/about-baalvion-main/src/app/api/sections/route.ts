import { NextResponse } from 'next/server';
import { cmsGetPages } from '@/lib/cms';

// Page-builder sections are stored within each CMS page (customFields.sections).
// This read-only endpoint flattens them across all pages. Editing happens in the
// central Baalvion CMS admin console.
const MANAGED_ELSEWHERE = {
  error: 'Content is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

export async function GET() {
  const pages = await cmsGetPages();
  const sections = pages.flatMap((p) => p.sectionData || []);
  return NextResponse.json(sections);
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
