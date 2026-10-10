import { NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number, resetTime: number }>();

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  const limit = rateLimit.get(ip);
  if (limit && now < limit.resetTime) {
    if (limit.count > 10) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    limit.count++;
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse",
        instructions: "You are a helpful AI assistant for the Market Underworld platform. Be polite, concise, and helpful. If asked about products, remember to use your tools. If a product is not found or out of stock, explicitly state that it is unavailable and do not invent prices or stock. If a user asks for a recommendation, search for related terms and suggest up to 3 options."
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
