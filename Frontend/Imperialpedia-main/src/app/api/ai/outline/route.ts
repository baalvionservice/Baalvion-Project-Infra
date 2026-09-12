import { NextResponse } from "next/server";
import { generateArticleOutline } from "@/ai/flows/ai-content-outline-tool";

export async function POST(req: Request) {
  try {
    const { financialSubject } = await req.json();
    if (!financialSubject || typeof financialSubject !== "string") {
      return NextResponse.json({ error: "financialSubject is required" }, { status: 400 });
    }
    const output = await generateArticleOutline({ financialSubject });
    return NextResponse.json(output);
  } catch (error) {
    console.error("[API /api/ai/outline] Error generating outline:", error);
    return NextResponse.json(
      {
        articleTitle: "AI generation error. Please try again.",
        outline: [],
        keyTopics: [],
      },
      { status: 500 }
    );
  }
}
