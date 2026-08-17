'use strict';
/*
 * One-off: the live CMS record for Law Elite Network's "A Logistics Guide to
 * Booking Hearing Rooms at London's International Arbitration Centres"
 * (slug: booking-hearing-rooms-london-international-arbitration-centre)
 * predates two fixes already applied to the bundled source
 * (Frontend/Law-Elite-Network-main/src/data/articles/lcia-arbitration-series.ts,
 * article id dr-009):
 *
 *   1. Design/sourcing: replaces the plain-text "Sources & Further Reading"
 *      list with the new collapsible "Article Sources" panel -- done here by
 *      removing that block from the HTML body and instead populating
 *      customFields.citations (the CitationsPanel field), which the site's
 *      <PrimarySources> component renders as a collapsed-by-default,
 *      hyperlinked disclosure. See src/components/knowledge/PrimarySources.tsx
 *      and the readPrimarySources() mapping in src/lib/cms.ts.
 *
 *   2. Factual correction: the IDRC's room count/capacity figures were stale
 *      ("more than 70 rooms... 18 large... up to roughly 200 people"). Verified
 *      against the IDRC's own live site (idrc.co.uk) on 2026-08-17: "over 100
 *      rooms... 20 large... rooms accommodate from 15 to 100 people". All
 *      three new source links (IAC, IDRC, LCIA Rules 2020 Art. 16) were
 *      fetched and confirmed live before being added here.
 *
 * Idempotent: checks for the new room-count text and existing citations
 * before touching anything, so a re-run after a successful patch is a no-op.
 *
 * USAGE
 *   node scripts/patchBookingHearingRoomsSources.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/patchBookingHearingRoomsSources.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin / cms_editor bearer from admin.baalvion.com
 *        (DevTools -> any /cms/ request -> copy the Authorization header value).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const SLUG = 'booking-hearing-rooms-london-international-arbitration-centre';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

// Verified live 2026-08-17 -- see script header for how each was checked.
const CITATIONS = [
  { title: 'International Arbitration Centre (IAC), 190 Fleet Street, London — official site', url: 'https://www.iac-london.com/' },
  { title: 'International Dispute Resolution Centre (IDRC), London — facilities & rooms', url: 'https://www.idrc.co.uk/facilities/rooms/' },
  { title: 'LCIA Arbitration Rules 2020, Article 16 (distinguishing the legal seat from the physical hearing venue)', url: 'https://www.lcia.org/Dispute_Resolution_Services/lcia-arbitration-rules-2020.aspx' },
];

const REPLACEMENTS = [
  {
    from: "The IDRC offers more than 70 rooms in total, including 18 large hearing-capable rooms, with its biggest reconfigurable room accommodating up to roughly 200 people and smaller hearing rooms seating around 15.",
    to: "The IDRC offers over 100 rooms in total, including 20 large hearing-capable rooms, with individual hearing rooms accommodating between roughly 15 and 100 people depending on size.",
  },
  {
    from: "located near St Paul's Cathedral, offering more than 70 rooms in total, of which 18 are large rooms suitable for hearings and the remainder serve as breakout or retirement rooms and smaller meeting spaces. Rooms are soundproofed and equipped with full Category 6 wiring for voice and data. The centre can reconfigure its largest room to accommodate up to roughly 200 people, while smaller hearing rooms comfortably seat around 15.",
    to: "located near St Paul's Cathedral, offering over 100 rooms in total, of which 20 are large rooms suitable for hearings and the remainder serve as breakout or retirement rooms and smaller meeting spaces. Rooms are soundproofed and equipped with full Category 6 wiring for voice and data. The centre's arbitration hearing rooms accommodate between roughly 15 and 100 people depending on size.",
  },
];

// Removes the plain-text sources heading + list, from "<h2>Sources & Further
// Reading</h2>" up to (not including) the following "<h2>Practical Next Steps</h2>".
const SOURCES_BLOCK_RE = /\n\n<h2>Sources & Further Reading<\/h2>[\s\S]*?(?=\n\n<h2>Practical Next Steps<\/h2>)/;

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
  }
  return json;
}

async function main() {
  if (!DRY_RUN && !TOKEN) throw new Error('CMS_TOKEN not set (or pass --dry-run)');

  const pub = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(SITE)}/content/${encodeURIComponent(SLUG)}`).then((r) => r.json());
  const doc = pub?.data;
  if (!doc) throw new Error(`content "${SLUG}" not found on live site`);

  const blocks = (doc.contentBlocks || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  if (blocks.length !== 1 || blocks[0].type !== 'html') {
    throw new Error(`expected exactly one html contentBlock, found ${blocks.length} (types: ${blocks.map((b) => b.type).join(', ')}) — check manually before patching`);
  }

  let html = blocks[0].content?.html || '';
  const existingCitations = Array.isArray(doc.customFields?.citations) ? doc.customFields.citations : [];
  const alreadyHasCitations = CITATIONS.every((c) => existingCitations.some((e) => e?.url === c.url));
  const alreadyFixedRooms = !html.includes('more than 70 rooms');
  const alreadyRemovedSourcesHeading = !html.includes('<h2>Sources & Further Reading</h2>');

  if (alreadyHasCitations && alreadyFixedRooms && alreadyRemovedSourcesHeading) {
    console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, changed: false, reason: 'already patched' }, null, 2));
    return;
  }

  let nextHtml = html;
  const applied = [];
  if (!alreadyFixedRooms) {
    for (const { from, to } of REPLACEMENTS) {
      if (!nextHtml.includes(from)) throw new Error(`expected room-count text not found verbatim — live content has drifted, patch manually:\n${from.slice(0, 80)}...`);
      nextHtml = nextHtml.replace(from, to);
    }
    applied.push('room-count correction');
  }
  if (!alreadyRemovedSourcesHeading) {
    if (!SOURCES_BLOCK_RE.test(nextHtml)) throw new Error('expected "Sources & Further Reading" block not found in the expected shape — live content has drifted, patch manually');
    nextHtml = nextHtml.replace(SOURCES_BLOCK_RE, '');
    applied.push('removed inline sources list');
  }

  const nextBlocks = [{ ...blocks[0], content: { ...blocks[0].content, html: nextHtml } }];
  const nextCustomFields = alreadyHasCitations
    ? doc.customFields
    : { ...doc.customFields, citations: CITATIONS.map((c) => ({ title: c.title, url: c.url })) };
  if (!alreadyHasCitations) applied.push('added Article Sources citations');

  console.log(`${SLUG}: applying — ${applied.join(', ')}`);
  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, dryRun: true, changed: true, htmlLengthBefore: html.length, htmlLengthAfter: nextHtml.length, citationCount: nextCustomFields.citations?.length || existingCitations.length }, null, 2));
    return;
  }

  await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${encodeURIComponent(doc.id)}`, { contentBlocks: nextBlocks, customFields: nextCustomFields });
  console.log(JSON.stringify({ ok: true, dryRun: false, changed: true, applied }, null, 2));
}

main().catch((e) => { console.error('booking-hearing-rooms sources patch failed:', e.message); process.exit(1); });
