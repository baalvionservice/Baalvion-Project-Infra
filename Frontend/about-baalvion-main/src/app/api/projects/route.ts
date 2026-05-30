import { NextResponse } from 'next/server';
import { cmsGetProjects, cmsGetProject } from '@/lib/cms';

// Content is now managed centrally in the Baalvion CMS (admin-platform console).
// This route is read-only; create/update/delete happen in the central console.
const MANAGED_ELSEWHERE = {
  error: 'Content is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const project = await cmsGetProject(id);
    return project
      ? NextResponse.json(project)
      : NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(await cmsGetProjects());
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
