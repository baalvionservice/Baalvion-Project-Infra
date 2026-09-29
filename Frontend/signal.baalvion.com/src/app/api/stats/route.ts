import { NextResponse } from "next/server";
import { fetchNewsService, NewsApiError } from "@/lib/news-api.server";

export async function GET() {
  try {
    const data = await fetchNewsService("/v1/stats/overview");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status = error instanceof NewsApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
