export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Marks a value that will only exist after a (future, human-run) Mainnet launch. */
export function placeholder(label: string, note = 'Not published. BAAL has not launched.'): string {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<span class="ph" data-placeholder="${id}">[${esc(label)}: ${esc(note)}]</span>`;
}

export interface Page {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
}

export const NAV: readonly (readonly [string, string])[] = [
  ['/what-is-baal', 'What is BAAL'],
  ['/baalvion', 'Baalvion'],
  ['/global-trade', 'Global trade'],
  ['/tokenomics', 'Tokenomics'],
  ['/vesting', 'Vesting'],
  ['/security', 'Security'],
  ['/documentation', 'Documentation'],
  ['/roadmap', 'Roadmap'],
  ['/risks', 'Risks'],
  ['/faq', 'FAQ'],
  ['/verify', 'Verify'],
  ['/contact', 'Contact'],
];

export function renderPage(page: Page): string {
  const nav = NAV.map(
    ([href, label]) =>
      `<a href="${href}"${href === page.path ? ' aria-current="page"' : ''}>${esc(label)}</a>`,
  ).join('\n        ');
  const title = page.path === '/' ? 'BAAL' : `${page.title} · BAAL`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="status" role="note"><strong>Status:</strong> BAAL has not launched. No token exists yet. This site is informational only.</div>
  <header>
    <a class="brand" href="/">BAAL</a>
    <nav aria-label="Primary">
        ${nav}
    </nav>
  </header>
  <main id="main">
${page.body}
  </main>
  <footer>
    <p>BAAL is a global token associated with the broader Baalvion vision. BAAL does not represent equity, ownership, revenue rights, or assets of Baalvion. Nothing on this site is an offer, a solicitation, or financial, legal or tax advice, and nothing here promises a price, a return, or any future value.</p>
  </footer>
</body>
</html>
`;
}
