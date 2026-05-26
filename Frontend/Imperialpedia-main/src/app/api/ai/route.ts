import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  // Mock AI summary response
  return NextResponse.json({
    summary: `This is a mock AI generated summary based on your prompt: "${prompt}". In a production environment, this would connect to Genkit or another LLM service.`
  });
}
