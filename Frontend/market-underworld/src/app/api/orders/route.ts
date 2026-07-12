import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { id: 'ORD-8472', buyer_id: 'USR-1001', seller_id: 'S-1', listing_id: 'p1', price: 15000, status: 'Completed', created_at: new Date().toISOString() },
      { id: 'ORD-9102', buyer_id: 'USR-1001', seller_id: 'S-2', listing_id: 'p2', price: 450, status: 'Preparing', created_at: new Date().toISOString() }
    ]
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    order_id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    message: "Escrow payment initialized successfully."
  });
}