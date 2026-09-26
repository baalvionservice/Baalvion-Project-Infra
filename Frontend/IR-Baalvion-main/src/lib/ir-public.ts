// Server-side fetchers for public IR surfaces (events, filings, documents), reading live
// from ir-service (:3008) with a seed fallback — same pattern as ir-reports.ts. These run
// in RSC so they reach the backend on 127.0.0.1 with no CORS/NEXT_PUBLIC wiring.

const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

async function fetchItems(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${IR_SERVICE_URL}${path}`, { next: { revalidate: 120 }, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return Array.isArray(json?.data?.items) ? json.data.items : [];
  } catch {
    return [];
  }
}

export interface PublicEvent {
  id: string; title: string; eventType: string; scheduledAt: string; endAt: string | null;
  location: string | null; webcastUrl: string | null; registrationUrl: string | null;
  description: string | null; status: string;
}
export async function getPublicEvents(): Promise<PublicEvent[]> {
  const items = await fetchItems('/api/v1/events?limit=100');
  return items.map((e) => ({
    id: String(e.id), title: e.title, eventType: e.event_type, scheduledAt: e.scheduled_at, endAt: e.end_at ?? null,
    location: e.location ?? null, webcastUrl: e.webcast_url ?? null, registrationUrl: e.registration_url ?? null,
    description: e.description ?? null, status: e.status,
  })).sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
}

export interface PublicFiling {
  id: string; title: string; filingType: string; regulator: string | null; filingDate: string | null;
  status: string; fileUrl: string | null; externalUrl: string | null; description: string | null;
}
export async function getPublicFilings(): Promise<PublicFiling[]> {
  const items = await fetchItems('/api/v1/filings?limit=100');
  return items.map((f) => ({
    id: String(f.id), title: f.title, filingType: f.filing_type, regulator: f.regulator ?? null,
    filingDate: f.filing_date ?? null, status: f.status, fileUrl: f.file_url ?? null,
    externalUrl: f.external_url ?? null, description: f.description ?? null,
  }));
}

export interface PublicDocument {
  id: string; title: string; documentType: string; description: string | null; fileUrl: string;
  year: number | null; isPublic: boolean; publishedAt: string | null;
}
export async function getPublicDocuments(): Promise<PublicDocument[]> {
  const items = await fetchItems('/api/v1/documents?limit=100');
  return items
    .filter((d) => d.is_public !== false)
    .map((d) => ({
      id: String(d.id), title: d.title, documentType: d.document_type, description: d.description ?? null,
      fileUrl: d.file_url, year: d.year ?? null, isPublic: d.is_public !== false, publishedAt: d.published_at ?? null,
    }));
}

export const labelize = (s: string) => (s || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
