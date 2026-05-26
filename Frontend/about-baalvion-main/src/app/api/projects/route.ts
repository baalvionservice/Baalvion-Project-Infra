import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = "secure-admin-key";

function isAuthorized(req: Request) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const project = db.projects.getById(id);
    return project 
      ? NextResponse.json(project) 
      : NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(db.projects.getAll());
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const newProject = db.projects.add(data);
  return NextResponse.json(newProject);
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const { id, ...updates } = data;
  const updated = db.projects.update(id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) db.projects.delete(id);
  return NextResponse.json({ success: true });
}
