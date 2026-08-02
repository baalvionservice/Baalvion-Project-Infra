/**
 * @fileOverview Relays a validated form submission to notification-service's public
 * lead-capture endpoint (api.baalvion.com/v1/public/lead), which owns the actual email send.
 * This app has no email provider credentials of its own.
 *
 * Server-only: called from Route Handlers, never from the client.
 */
const LEAD_API_URL =
  process.env.LEAD_NOTIFICATION_API_URL || 'https://api.baalvion.com/v1/public/lead';

export interface LeadField {
  k: string;
  v: string;
}

export interface SendLeadResult {
  success: boolean;
  error?: string;
}

/**
 * @param site One of notification-service's controller/publicController.js SITES keys —
 *   the recipient inbox is resolved server-side there, never passed from here.
 */
export async function sendLead(
  site: string,
  fields: LeadField[],
  message?: string
): Promise<SendLeadResult> {
  try {
    const res = await fetch(LEAD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, fields, message }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[leadNotify] upstream_error', { site, status: res.status, body: body.slice(0, 300) });
      return { success: false, error: `upstream_${res.status}` };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('[leadNotify] request_failed', {
      site,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'request_failed' };
  }
}
