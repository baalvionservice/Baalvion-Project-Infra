// Reusable JSON-LD structured-data renderer. Server component (no "use client") so the script
// tag is present in the initial HTML for crawlers, not injected after hydration.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
