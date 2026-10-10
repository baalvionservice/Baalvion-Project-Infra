import { NextResponse } from "next/server";
import { getStoredTrades, createNewTrade } from "@/lib/escrow-store";

export async function GET() {
  const trades = getStoredTrades();
  return NextResponse.json({ success: true, trades });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trade = createNewTrade(body);
    return NextResponse.json({ success: true, trade }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
