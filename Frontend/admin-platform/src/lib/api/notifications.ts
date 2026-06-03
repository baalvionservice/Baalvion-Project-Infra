import { serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

// notification-service (port 3031, mounts at /v1). The admin-reachable surface is the queue
// admin API under /v1/notifications/queues/* (super_admin/admin bearer → requireAdmin):
//   GET  /notifications/queues/stats               → per-queue waiting/active/failed counts
//   GET  /notifications/queues/dlq                 → dead-letter queue (failed deliveries)
//   POST /notifications/queues/dlq/:entryId/retry  → requeue a failed delivery
// Templates are file-based Handlebars compiled in-process (no REST CRUD endpoint), and there is
// NO DB-backed full delivery-log endpoint — the DLQ IS the delivery-failure history the service
// keeps. Methods without a backing endpoint are kept (so call sites stay stable) but clearly
// marked; they do NOT fabricate data.

const notifications = serviceClients.notifications;

// ── Templates (no backend REST endpoint) ───────────────────────────────────────
// notification-service templates live in templates/index.js as compiled Handlebars and are only
// exposed internally via a TEMPLATE_NAMES constant — there is no GET /templates HTTP route, and
// no create/update/delete. These methods are intentionally left UNWIRED rather than pointed at a
// fabricated source. `list` resolves to an empty set so the Templates pages render their honest
// empty state. Wiring these requires a backend endpoint (e.g. GET /v1/notifications/templates).
export interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Delivery / DLQ types ────────────────────────────────────────────────────────
// Raw shape of a dead-letter-queue entry as returned by GET /notifications/queues/dlq. Fields are
// Redis-stream key/values written by the failing worker, so they are loosely typed.
export interface DlqEntry {
  id: string;
  source?: string;
  error?: string;
  payload?: string;
  failedAt?: string;
  [key: string]: string | undefined;
}

// UI-facing delivery record. Derived from a DlqEntry — these are FAILED deliveries (the only
// per-delivery history the service persists). Kept named `NotificationLog` so the logs page and
// its columns continue to compile unchanged.
export interface NotificationLog {
  id: string;
  templateKey?: string;
  channel: string;
  recipient: string;
  subject?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened';
  errorMessage?: string;
  sentAt: string | null;
  createdAt: string;
}

export interface QueueCounts {
  waiting: number;
  active: number;
  failed: number;
}

export interface QueueStats {
  email: QueueCounts;
  webhook: QueueCounts;
  sms: QueueCounts;
  push: QueueCounts;
  notification: QueueCounts;
}

// ── Mapping helpers ──────────────────────────────────────────────────────────────
// A DLQ entry's `payload` is the JSON-stringified original job. Best-effort parse to surface the
// recipient / template / subject the operator cares about; never throws.
function parsePayload(raw?: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function channelFromSource(source?: string): string {
  if (!source) return 'unknown';
  // Worker sources look like "email-worker", "sms-worker", "push-worker", "webhook-worker".
  const match = source.match(/^(email|sms|push|webhook|in_app|inapp|notification)/i);
  return match ? match[1].toLowerCase().replace('inapp', 'in_app') : source;
}

function dlqEntryToLog(entry: DlqEntry): NotificationLog {
  const payload = parsePayload(entry.payload);
  const recipient =
    (payload.to as string) ||
    ((payload.recipients as Record<string, unknown> | undefined)?.email as string) ||
    ((payload.recipients as Record<string, unknown> | undefined)?.phone as string) ||
    (payload.userId as string) ||
    '—';
  const subject =
    (payload.rawSubject as string) || (payload.subject as string) || undefined;
  const templateKey =
    (payload.templateName as string) || (payload.templateKey as string) || undefined;
  const failedAt = entry.failedAt || null;

  return {
    id: entry.id,
    templateKey,
    channel: channelFromSource(entry.source),
    recipient,
    subject,
    // Everything in the DLQ is, by definition, a failed delivery.
    status: 'failed',
    errorMessage: entry.error,
    sentAt: null,
    createdAt: failedAt ?? new Date().toISOString(),
  };
}

export const notificationsApi = {
  templates: {
    // No backend endpoint (see note above) — resolves to an empty, non-fabricated list so the
    // Templates pages render their empty state instead of erroring against the dead gateway.
    list: () =>
      Promise.resolve({ data: { success: true, data: [] as NotificationTemplate[] } } as {
        data: ApiResponse<NotificationTemplate[]>;
      }),
    // get/create/update/delete have no backend route on notification-service. Left UNWIRED:
    // re-add once a templates REST endpoint exists. Calling these will reject (no route).
    // get:    (id: string) => notifications.get<ApiResponse<NotificationTemplate>>(`/notifications/templates/${id}`),
    // create: (payload) => notifications.post<ApiResponse<NotificationTemplate>>('/notifications/templates', payload),
    // update: (id, payload) => notifications.patch<ApiResponse<NotificationTemplate>>(`/notifications/templates/${id}`, payload),
    // delete: (id) => notifications.delete<ApiResponse<void>>(`/notifications/templates/${id}`),
  },

  // ── Delivery failures (Dead-Letter Queue) ─────────────────────────────────────
  // The DLQ is the service's real per-delivery failure history. There is no full "all deliveries"
  // log endpoint, so the logs page now shows failed deliveries. We adapt the DLQ envelope
  // ({ items, total }) to the PaginatedResponse<NotificationLog> the page already expects, and
  // paginate/filter client-side (the DLQ endpoint returns the latest 50, unpaginated).
  logs: {
    list: async (
      params?: PaginationParams & { channel?: string; status?: string },
    ): Promise<{ data: PaginatedResponse<NotificationLog> }> => {
      const { data } = await notifications.get<ApiResponse<{ items: DlqEntry[]; total?: number }>>(
        '/notifications/queues/dlq',
      );
      const all = (data.data?.items ?? []).map(dlqEntryToLog);

      // Client-side filtering (the backend DLQ endpoint takes no filters).
      const channel = params?.channel;
      const status = params?.status;
      const filtered = all.filter(
        (log) =>
          (!channel || log.channel === channel) &&
          // DLQ entries are always 'failed'; honor a status filter only when it matches.
          (!status || log.status === status),
      );

      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit);
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data: {
          success: true,
          data: pageItems,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    },

    // Requeue a failed delivery for retry. Real, low-risk admin endpoint (requireAdmin).
    retry: (entryId: string) =>
      notifications.post<ApiResponse<{ message: string }>>(
        `/notifications/queues/dlq/${encodeURIComponent(entryId)}/retry`,
      ),
  },

  // ── Queue health ──────────────────────────────────────────────────────────────
  // Per-queue waiting/active/failed counts across all channels.
  queues: {
    stats: () => notifications.get<ApiResponse<QueueStats>>('/notifications/queues/stats'),
  },

  // ── Ad-hoc dispatch (NOT admin-reachable from the browser) ─────────────────────
  // POST /notifications/dispatch is guarded by `internalAuth` (service-to-service HMAC secret),
  // NOT a user bearer — an admin's browser token will be rejected (401). Left UNWIRED to avoid a
  // dead button. Re-enable only via a server-side proxy that holds the internal secret.
  // send: (payload: {
  //   userId?: string;
  //   recipients?: { email?: string; phone?: string };
  //   channels?: Array<'email' | 'sms' | 'push' | 'inapp'>;
  //   email?: Record<string, unknown>;
  //   sms?: { body: string };
  //   push?: { title?: string; body?: string; data?: Record<string, unknown> };
  //   inapp?: { title?: string; body?: string; data?: Record<string, unknown>; type?: string };
  // }) => notifications.post<ApiResponse<void>>('/notifications/dispatch', payload),
};
