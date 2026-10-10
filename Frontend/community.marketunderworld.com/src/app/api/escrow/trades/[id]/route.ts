import { NextResponse } from "next/server";
import { updateTradeState, appendChatMessage, getStoredTrades } from "@/lib/escrow-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trades = getStoredTrades();
  const trade = trades.find((t) => t.id === id);
  if (!trade) {
    return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, trade });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.chatMessage) {
      const msg = appendChatMessage(id, body.chatMessage);
      return NextResponse.json({ success: true, chatMessage: msg });
    }

    const updated = updateTradeState(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Trade update failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, trade: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
