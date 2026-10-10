import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';
import { getStorefrontProducts } from '@/lib/api/commerce';

const rateLimit = new Map<string, { count: number, resetTime: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  const limit = rateLimit.get(ip);
  if (limit && now < limit.resetTime) {
    if (limit.count > 50) return new Response('Rate limit exceeded', { status: 429 });
    limit.count++;
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
  }

  const body = await req.json();
  const messages = body.messages;
  if (!Array.isArray(messages)) {
    return new Response('Invalid request', { status: 400 });
  }

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(4),
    system: 'You are a helpful AI assistant for the Market Underworld platform. ' +
            'You have access to the product catalogue. Use the searchProducts tool to find real product names, prices, stock, and descriptions to answer user questions accurately. ' +
            'If a product is not found or out of stock, explicitly state that it is unavailable and do NOT invent prices or stock. ' +
            'If a user asks for a recommendation, use searchProducts for related terms and suggest up to 3 options. ' +
            'Always be polite, concise, and helpful.',
    tools: {
      searchProducts: tool({
        description: 'Search the product catalogue for items matching a query',
        inputSchema: z.object({
          query: z.string().describe('The search query (e.g. "watches", "shoes", or specific brand)'),
        }),
        execute: async ({ query }) => {
          try {
            const products = await getStorefrontProducts(undefined, { search: query, limit: 5 });
            return products.map(p => ({
              id: p.id,
              name: p.name,
              price: `${p.price} ${p.currencyCode}`,
              stock: p.stock,
              inStock: p.inStock,
            }));
          } catch (e) {
            return { error: 'Failed to search products' };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
