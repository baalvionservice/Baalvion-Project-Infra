import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseAllocationDocument } from '../token/src/allocation.ts';
import { buildSite } from '../website/src/site.ts';
import { NAV, esc, placeholder } from '../website/src/render.ts';
import { load } from './helpers.ts';

const doc = parseAllocationDocument(load('token', 'allocation.json'));
const site = buildSite(doc);
const byFile = new Map(site.map((f) => [f.file, f.html]));

const REQUIRED = [
  '/',
  '/what-is-baal',
  '/baalvion',
  '/global-trade',
  '/tokenomics',
  '/vesting',
  '/security',
  '/documentation',
  '/roadmap',
  '/risks',
  '/faq',
  '/verify',
  '/contact',
];

describe('website skeleton', () => {
  it('has exactly the specified pages', () => {
    const expected = REQUIRED.map((p) =>
      p === '/' ? 'index.html' : `${p.slice(1)}/index.html`,
    ).sort();
    assert.deepEqual([...byFile.keys()].sort(), expected);
  });

  it('navigation links only to pages that exist', () => {
    for (const [href] of NAV) assert.ok(REQUIRED.includes(href), href);
    assert.equal(NAV.length, REQUIRED.length - 1);
  });

  it('every page says BAAL has not launched, with a title, description and language', () => {
    for (const [file, html] of byFile) {
      assert.match(html, /BAAL has not launched/, file);
      assert.match(html, /<html lang="en">/, file);
      assert.match(html, /<title>[^<]+<\/title>/, file);
      assert.match(html, /<meta name="description" content="[^"]+">/, file);
      assert.match(
        html,
        /does not represent equity, ownership, revenue rights, or assets of Baalvion/,
        file,
      );
    }
  });

  it('has no scripts, forms, buttons, wallet connection or buy/sale calls to action', () => {
    for (const [file, html] of byFile) {
      assert.ok(
        !/<script|<form|<button|<input|onclick=/i.test(html),
        `${file}: interactive element`,
      );
      assert.ok(
        !/connect[- ](your )?wallet\b|wallet[- ]connect|phantom|solflare|backpack|walletconnect/i.test(
          html,
        ),
        `${file}: wallet`,
      );
      assert.ok(
        !/\bbuy\b|\bpurchase\b|\bswap\b|\btrade now\b|\bpresale\b|\bairdrop now\b/i.test(
          html.replace(/<footer>[\s\S]*<\/footer>/, ''),
        ),
        `${file}: buy CTA`,
      );
    }
  });

  it('publishes no token address: the only base58-looking string is the public SPL Token program id', () => {
    for (const [file, html] of byFile) {
      const found = (html.match(/\b[1-9A-HJ-NP-Za-km-z]{32,88}\b/g) ?? []).filter(
        (s) => s !== doc.token.tokenProgram,
      );
      assert.deepEqual(found, [], file);
    }
  });

  it('makes no price, return or launch-date promises', () => {
    for (const [file, html] of byFile) {
      assert.ok(
        !/\b(guaranteed?|100x|moon|profits?|passive income|to the moon|launching (on|in)|coming soon|get in early)\b/i.test(
          html.replace(/<footer>[\s\S]*<\/footer>/, ''),
        ),
        file,
      );
      assert.ok(!/\$\s?\d/.test(html), `${file}: dollar figure`);
    }
  });

  it('shows mainnet-dependent values as explicit placeholders', () => {
    const verify = byFile.get('verify/index.html') ?? '';
    for (const id of [
      'mint-address',
      'mint-authority-status',
      'freeze-authority-status',
      'launch-transaction',
    ]) {
      assert.match(verify, new RegExp(`data-placeholder="${id}"`));
    }
    assert.match(
      byFile.get('tokenomics/index.html') ?? '',
      /data-placeholder="circulating-supply"/,
    );
  });

  it('tokenomics page is generated from allocation.json', () => {
    const html = byFile.get('tokenomics/index.html') ?? '';
    assert.match(html, /1,000,000,000 BAAL \(fixed\)/);
    assert.match(html, /Founder \/ team<\/th><td>15%<\/td><td>150,000,000 BAAL/);
    assert.match(html, /Community \/ ecosystem<\/th><td>30%<\/td><td>300,000,000 BAAL/);
    for (const a of doc.allocations) assert.ok(html.includes(`${a.percent}%`), a.id);
  });

  it('vesting page states the approved founder schedule and that others are unapproved', () => {
    const html = byFile.get('vesting/index.html') ?? '';
    assert.match(
      html,
      /0% at launch, nothing for 12 months \(the cliff\), then released linearly over 36 months/,
    );
    assert.match(html, /Release schedule TBD \(not yet approved or published\)/);
  });

  it('escapes HTML in dynamic values', () => {
    assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    assert.ok(!placeholder('<b>x</b>').includes('<b>'));
  });

  it('builds relative-safe output paths', () => {
    for (const { file } of site) assert.ok(!file.startsWith('/') && !file.includes('..'), file);
    assert.equal(join('a', byFile.has('index.html') ? 'index.html' : ''), join('a', 'index.html'));
  });
});
