import { NextResponse } from "next/server";

const DEVELOPER_SERVICE_URL = process.env.DEVELOPER_SERVICE_URL ?? "http://localhost:3042";

export async function GET() {
  try {
    const response = await fetch(`${DEVELOPER_SERVICE_URL}/v1/billing/launch-offer`, { cache: "no-store" });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    // Billing service unreachable — hide the banner rather than error the page.
    return NextResponse.json({ success: true, data: { remaining: 0, max: 10 } });
  }
}
