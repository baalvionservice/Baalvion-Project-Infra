import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = "secure-admin-key";

function isAuthorized(req: Request) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET() {
  return NextResponse.json(db.operationalUpdates.getAll());
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const newUpdate = db.operationalUpdates.add(data);
  return NextResponse.json(newUpdate);
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const { id, ...updates } = data;
  const updated = db.operationalUpdates.update(id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) db.operationalUpdates.delete(id);
  return NextResponse.json({ success: true });
}