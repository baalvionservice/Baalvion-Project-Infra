import type { AllocationDocument } from '../../token/src/allocation.ts';
import { formatBaseUnits } from '../../token/src/units.ts';
import { esc, placeholder } from './render.ts';
import type { Page } from './render.ts';

function allocationRows(doc: AllocationDocument): string {
  return doc.allocations
    .map(
      (a) =>
        `<tr><th scope="row">${esc(a.label)}</th><td>${esc(a.percent)}%</td><td>${esc(formatBaseUnits(BigInt(a.baseUnits), doc.token.decimals))} ${esc(doc.token.symbol)}</td></tr>`,
    )
    .join('\n');
}

function vestingBlock(doc: AllocationDocument): string {
  const items = doc.allocations.map((a) => {
    const v = a.vesting;
    const text =
      v.type === 'cliff-linear'
        ? `${v.tgeUnlockPercent}% at launch, nothing for ${v.cliffMonths} months (the cliff), then released linearly over ${v.linearMonths} months.`
        : v.type === 'none'
          ? 'Fully liquid at launch.'
          : 'Release schedule TBD (not yet approved or published).';
    return `<li><strong>${esc(a.label)}</strong> (${esc(a.percent)}%): ${text}</li>`;
  });
  return `<ul>\n${items.join('\n')}\n</ul>`;
}

export function buildPages(doc: AllocationDocument): Page[] {
  const { token } = doc;
  const supply = formatBaseUnits(BigInt(token.totalSupplyBaseUnits), token.decimals);
  return [
    {
      path: '/',
      title: 'BAAL',
      description:
        'BAAL is a planned global token associated with the Baalvion vision. It has not launched.',
      body: `<h1>BAAL</h1>
<p class="lead">A planned global token associated with the broader Baalvion vision.</p>
<p><strong>BAAL has not launched.</strong> There is no token address, no sale, no listing and no way to obtain BAAL today. This website explains the approved design so it can be reviewed before anything is created.</p>
<ul>
  <li>Fixed supply of ${esc(supply)} ${esc(token.symbol)}, ${token.decimals} decimals.</li>
  <li>Classic Solana SPL Token. No custom smart contract in version 1.</li>
  <li>Mint authority to be permanently revoked at launch; freeze authority never enabled.</li>
</ul>
<p>Start with <a href="/what-is-baal">what BAAL is</a>, the <a href="/tokenomics">tokenomics</a> and the <a href="/risks">risks</a>.</p>`,
    },
    {
      path: '/what-is-baal',
      title: 'What is BAAL',
      description: 'What BAAL is, and what it is not.',
      body: `<h1>What is BAAL</h1>
<p>BAAL is a global token associated with the broader Baalvion vision. It is designed as a plain, fixed-supply Solana token so that anyone can inspect its rules directly on-chain once it exists.</p>
<h2>What BAAL is not</h2>
<ul>
  <li>It does not represent equity, ownership, revenue rights, or assets of Baalvion. That would change only if a future, legally valid structure explicitly established such rights, and no such structure exists.</li>
  <li>It is not an investment product, and no price, return or future value is promised.</li>
  <li>It is not live. There is no initial public sale.</li>
</ul>
<h2>Design in one paragraph</h2>
<p>Classic SPL Token program, ${token.decimals} decimals, ${esc(supply)} total supply minted once, mint authority permanently revoked, freeze authority not enabled, no custom program. Details: <a href="/tokenomics">tokenomics</a>, <a href="/security">security</a>.</p>`,
    },
    {
      path: '/baalvion',
      title: 'Baalvion',
      description: 'How BAAL relates to the Baalvion vision.',
      body: `<h1>Baalvion</h1>
<p>BAAL is associated with the broader Baalvion vision. Baalvion's own products, services and company information are published by Baalvion itself and are not described or warranted by this site.</p>
<p>Association with Baalvion does not give BAAL holders any claim on Baalvion, its revenue, or its assets.</p>
<p>${placeholder('Baalvion company information link', 'To be added when approved for publication.')}</p>`,
    },
    {
      path: '/global-trade',
      title: 'Global trade',
      description:
        'Global trade as part of the long-term Baalvion vision. BAAL has no utility today.',
      body: `<h1>Global trade</h1>
<p>Global trade is part of Baalvion's long-term vision. BAAL is intended to be a token associated with that vision.</p>
<p><strong>Today BAAL has no function in any trade, payment, shipping, customs or financing product.</strong> Because BAAL does not exist yet, no such use is live, and none is promised here. Any future use would be announced separately, with its own documentation and risks.</p>`,
    },
    {
      path: '/tokenomics',
      title: 'Tokenomics',
      description: 'Fixed supply and allocation of BAAL.',
      body: `<h1>Tokenomics</h1>
<p>These figures are generated from the project's single source of truth, <code>token/allocation.json</code>, and are checked by automated tests on every change.</p>
<dl class="facts">
  <dt>Total supply</dt><dd>${esc(supply)} ${esc(token.symbol)} (fixed)</dd>
  <dt>Decimals</dt><dd>${token.decimals}</dd>
  <dt>Token standard</dt><dd>Classic Solana SPL Token</dd>
  <dt>Mint authority</dt><dd>To be permanently revoked at launch</dd>
  <dt>Freeze authority</dt><dd>None</dd>
  <dt>Public sale</dt><dd>None in the initial version</dd>
  <dt>Circulating supply at launch</dt><dd>${placeholder('Circulating supply', 'Not yet determined. Release schedules for six of seven allocations are TBD.')}</dd>
</dl>
<table>
  <caption>Allocation of the fixed supply</caption>
  <thead><tr><th scope="col">Allocation</th><th scope="col">Share</th><th scope="col">Amount</th></tr></thead>
  <tbody>
${allocationRows(doc)}
  </tbody>
</table>
<p><strong>Allocated is not vested, and vested is not circulating.</strong> The table shows allocation only. Tokens become circulating only after a schedule releases them and they are actually distributed.</p>
<p>Allocation wallets do not exist yet. Their addresses will appear on the <a href="/verify">verify page</a> only after launch.</p>`,
    },
    {
      path: '/vesting',
      title: 'Vesting',
      description: 'Vesting schedule for BAAL allocations.',
      body: `<h1>Vesting</h1>
<p>Only the founder and team schedule has been approved. Nothing is claimable for the first 12 months and there is no lump sum at the cliff. After month 12, tokens vest continuously, per second, reaching 100% at month 48. Months are calendar months in UTC counted from launch. Every other allocation's schedule is TBD.</p>
${vestingBlock(doc)}
<p>The schedule is currently a specification with automated tests. <strong>No on-chain vesting enforcement exists yet and the choice of one is still open.</strong> Until a verified solution is chosen, this schedule is a specification only.</p>`,
    },
    {
      path: '/security',
      title: 'Security',
      description: 'Security design for BAAL and the status of verification.',
      body: `<h1>Security</h1>
<p>BAAL has not launched and has <strong>not been audited</strong>. The design minimises what can go wrong:</p>
<ul>
  <li><strong>No custom program.</strong> Version 1 uses only the standard Solana SPL Token program, so there is no bespoke contract code to exploit.</li>
  <li><strong>Fixed supply.</strong> The mint authority is to be revoked permanently, so no one can create more.</li>
  <li><strong>No freeze authority.</strong> No one will be able to freeze holders' tokens.</li>
  <li><strong>Hardware-wallet signing.</strong> Any real deployment will be signed by humans on hardware wallets, outside automation.</li>
  <li><strong>No automated deployment.</strong> The repository's CI has no deployment path, and tests enforce that.</li>
  <li><strong>No secrets in the repository.</strong> Secret scanning runs on every change.</li>
</ul>
<p>Security reports: ${placeholder('Security contact', 'To be published before launch.')}</p>`,
    },
    {
      path: '/documentation',
      title: 'Documentation',
      description: 'Index of BAAL project documentation.',
      body: `<h1>Documentation</h1>
<p>Project documentation lives in the repository's <code>docs/</code> directory. Public hosting of these documents is not set up yet.</p>
<ol>
  <li>Overview</li><li>Architecture, including decision records ADR-001 to ADR-005</li><li>Token</li><li>Tokenomics</li><li>Governance</li><li>Treasury</li><li>Security</li><li>Deployment</li><li>Verification</li><li>Risks</li><li>Roadmap</li><li>Legal</li><li>Incident response</li><li>Transparency</li>
</ol>
<p>${placeholder('Public documentation URL', 'To be added when documentation is published.')}</p>`,
    },
    {
      path: '/roadmap',
      title: 'Roadmap',
      description: 'Where the BAAL project stands. No dates are promised.',
      body: `<h1>Roadmap</h1>
<p>Stages are listed in order. No dates are given, and later stages may change or may not happen.</p>
<ol>
  <li><strong>Phase 0: design decisions.</strong> Approved.</li>
  <li><strong>Phase 1: repository and test infrastructure.</strong> Local only: allocation validator, vesting specification, network-safety guards, this site. Nothing deployed.</li>
  <li><strong>Later phases.</strong> Devnet rehearsal, independent review, legal review, and a human-signed launch. Each requires explicit approval before it starts and none is scheduled.</li>
</ol>`,
    },
    {
      path: '/risks',
      title: 'Risks',
      description: 'Risks associated with BAAL.',
      body: `<h1>Risks</h1>
<ul>
  <li><strong>No guarantees.</strong> BAAL may have little or no value, and there is no promise of price, liquidity, listing or return.</li>
  <li><strong>No rights in Baalvion.</strong> BAAL does not represent equity, ownership, revenue rights, or assets of Baalvion.</li>
  <li><strong>Unlaunched and unaudited.</strong> The design has had no independent security review yet.</li>
  <li><strong>Irreversibility.</strong> Revoking the mint authority cannot be undone, and an error at launch could not be fixed by changing the supply.</li>
  <li><strong>Key loss or compromise.</strong> Lost or stolen keys cannot be recovered. No freeze authority means stolen tokens cannot be frozen.</li>
  <li><strong>Concentration.</strong> Large allocations are held by few parties; see the <a href="/tokenomics">allocation</a>.</li>
  <li><strong>Regulatory.</strong> Laws on tokens vary by country and may change. Legal review is not complete.</li>
  <li><strong>Impersonation and scams.</strong> Fake tokens and fake sites are common. See <a href="/verify">how to verify</a>.</li>
  <li><strong>Network risk.</strong> Solana can suffer outages, congestion or software bugs.</li>
</ul>`,
    },
    {
      path: '/faq',
      title: 'FAQ',
      description: 'Frequently asked questions about BAAL.',
      body: `<h1>FAQ</h1>
<h2>Has BAAL launched?</h2>
<p>No. There is no BAAL token and no token address. Treat any token claiming to be BAAL as fake.</p>
<h2>Is there a sale or an airdrop?</h2>
<p>No. There is no public sale in the initial version, and no sale or airdrop has been announced.</p>
<h2>Does BAAL give me a share of Baalvion?</h2>
<p>No. It does not represent equity, ownership, revenue rights, or assets of Baalvion.</p>
<h2>Can more BAAL be created later?</h2>
<p>The design revokes the mint authority permanently at launch, so supply stays at ${esc(supply)}.</p>
<h2>Does this site connect to wallets?</h2>
<p>No. This site is informational. It does not connect wallets or create transactions. Be wary of any site claiming otherwise.</p>
<h2>Where will I be able to verify the real token?</h2>
<p>On the <a href="/verify">verify page</a>, after launch.</p>`,
    },
    {
      path: '/verify',
      title: 'Verify',
      description: 'How the real BAAL token will be verified after launch.',
      body: `<h1>Verify</h1>
<p>BAAL has not launched, so there is nothing to verify yet. These fields will be filled in only after a real launch, and only by a person approving the exact values.</p>
<dl class="facts">
  <dt>Mint address</dt><dd>${placeholder('Mint address')}</dd>
  <dt>Mint authority</dt><dd>${placeholder('Mint authority status', 'Verified after launch. Expected: none (revoked).')}</dd>
  <dt>Freeze authority</dt><dd>${placeholder('Freeze authority status', 'Verified after launch. Expected: none.')}</dd>
  <dt>Launch transaction</dt><dd>${placeholder('Launch transaction')}</dd>
  <dt>Token program</dt><dd>Classic SPL Token: <code>${esc(token.tokenProgram)}</code></dd>
</dl>
<h2>What to check once an address is published</h2>
<ol>
  <li>The address matches the one published here and in the project's other official channels.</li>
  <li>On a block explorer: ${token.decimals} decimals, raw supply ${esc(token.totalSupplyBaseUnits)}.</li>
  <li>Mint authority and freeze authority are both empty.</li>
</ol>`,
    },
    {
      path: '/contact',
      title: 'Contact',
      description: 'Contact information for the BAAL project.',
      body: `<h1>Contact</h1>
<p>${placeholder('Official contact channels', 'To be published before launch.')}</p>
<p>Until official channels are listed here, any account or message claiming to represent BAAL is not verified. The project will never ask for your seed phrase or private keys.</p>`,
    },
  ];
}
