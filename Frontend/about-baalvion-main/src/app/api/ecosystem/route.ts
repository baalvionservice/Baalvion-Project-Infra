import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = "secure-admin-key";

function isAuthorized(req: Request) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET() {
  return NextResponse.json(db.ecosystem.getAll());
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const newItem = db.ecosystem.add(data);
  return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  const { id, ...updates } = data;
  const updated = db.ecosystem.update(id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) db.ecosystem.delete(id);
  return NextResponse.json({ success: true });
}
