import { NextResponse } from 'next/server';
import { PostHog } from 'posthog-node';

const phClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_dummy_key',
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com' }
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Expected payload from the upstream order-service when an order is completed
    if (payload.event === 'order.completed') {
      const order = payload.data;
      
      // Send verified server-side event to PostHog
      phClient.capture({
        distinctId: order.userId || 'anonymous',
        event: 'purchase_completed_verified',
        properties: {
          order_id: order.id,
          value: order.totalPrice,
          currency: order.currencyCode,
        }
      });

      // Ensure events are sent before shutting down the isolate
      await phClient.shutdown();
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ignored: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
