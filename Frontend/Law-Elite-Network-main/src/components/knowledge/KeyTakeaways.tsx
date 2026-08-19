import React from 'react';

/**
 * Renders the editor-authored key-takeaways list (see
 * `src/lib/seo/key-takeaways-extractor.ts`) as its own top-level section
 * after the article body, using the existing Investopedia-style
 * `.key-takeaways` box from globals.css. Only ever shows bullets an editor
 * actually wrote -- never generated from the surrounding prose -- so an
 * article with no such block simply renders nothing here.
 */
export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section className="key-takeaways" aria-labelledby="key-takeaways-heading">
      <h2 id="key-takeaways-heading">Key Takeaways</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
