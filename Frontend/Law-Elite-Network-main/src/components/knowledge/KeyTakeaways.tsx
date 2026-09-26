import React from 'react';

/**
 * Law Elite Editorial Key Takeaways Module.
 * Black header bar with white uppercase label + red top-border rule.
 * Numbered badges with serif body text, divider lines between items.
 */
export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section
      className="key-takeaways scroll-mt-32"
      id="key-takeaways"
      aria-labelledby="key-takeaways-heading"
    >
      <h2 id="key-takeaways-heading">KEY TAKEAWAYS</h2>

      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {/* Numbered badge */}
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                width: '1.375rem',
                height: '1.375rem',
                background: '#E13131',
                color: '#fff',
                fontFamily: 'var(--font-headline)',
                fontSize: '0.625rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '0.2rem',
              }}
            >
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
