/**
 * Renders a schema.org JSON-LD object into a <script> tag. Server component.
 * Accepts one object or an array of objects.
 */
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * `JSON.stringify` escapes neither `<` nor `/`, so a stored value containing
 * `</script>` closes this element early and everything after it parses as
 * markup. The escaped form is valid JSON and decodes to the same string, so
 * consumers see identical structured data.
 */
const jsonLdHtml = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(item) }}
        />
      ))}
    </>
  );
}
