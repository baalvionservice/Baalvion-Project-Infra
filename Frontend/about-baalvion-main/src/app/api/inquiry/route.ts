
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = "secure-admin-key";

function isAuthorized(req: Request) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET() {
  return NextResponse.json(db.inquiries.getAll());
}

export async function POST(req: Request) {
  const data = await req.json();
  const newInquiry = db.inquiries.add(data);
  return NextResponse.json(newInquiry);
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  db.inquiries.updateStatus(data.id, data.status);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) db.inquiries.delete(id);
  return NextResponse.json({ success: true });
}
