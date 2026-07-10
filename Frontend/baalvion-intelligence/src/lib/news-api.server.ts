const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL ?? "http://localhost:3045";
const NEWS_API_KEY = process.env.NEWS_API_KEY;

export class NewsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchNewsService(path: string, searchParams?: URLSearchParams): Promise<unknown> {
  if (!NEWS_API_KEY) {
    throw new NewsApiError("NEWS_API_KEY is not configured on the server", 500);
  }

  const query = searchParams?.toString();
  const url = `${NEWS_SERVICE_URL}${path}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${NEWS_API_KEY}` },
    cache: "no-store",
  });

  const body = await response.json();
  if (!response.ok) {
    throw new NewsApiError(body?.error?.message ?? "news-service request failed", response.status);
  }
  return body.data;
}
