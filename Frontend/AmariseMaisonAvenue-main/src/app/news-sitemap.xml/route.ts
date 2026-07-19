import { getEditorials } from "@/lib/cms";
import { COUNTRIES } from "@/lib/mock-data";

/**
 * Google News sitemap (https://www.google.com/schemas/sitemap-news/0.9).
 * Google News only considers <url> entries whose <news:publication_date> is within
 * the last 2 days, so this route is intentionally separate from the main sitemap.ts
 * (which covers permanent/evergreen discovery). Submit this URL in Search Console
 * under Sitemaps once the Journal has a steady publishing cadence — News inclusion
 * itself is a manual Google review, not something this file can force.
 */
export const revalidate = 300;

const PUBLICATION_NAME = "AMARISÉ MAISON AVENUE";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = "https://www.amarisemaisonavenue.com";
  const countryCodes = Object.keys(COUNTRIES);
  const editorials = await getEditorials();

  const now = Date.now();
  const recent = editorials.filter((ed) => {
    const parsed = new Date(ed.date);
    return !Number.isNaN(parsed.getTime()) && now - parsed.getTime() <= TWO_DAYS_MS;
  });

  const urls = recent.flatMap((ed) =>
    countryCodes.map((code) => {
      const loc = `${baseUrl}/${code}/journal/${ed.id}`;
      const pubDate = new Date(ed.date).toISOString();
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(ed.title)}</news:title>
    </news:news>
  </url>`;
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
