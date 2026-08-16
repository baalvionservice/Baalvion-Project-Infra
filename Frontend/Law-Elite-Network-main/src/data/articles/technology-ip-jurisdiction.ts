import type { LawArticle } from '../law-content';

const TECHNOLOGY_IP_CATEGORY = {
  id: 'cat_technology_ip',
  name: 'Technology & IP',
  slug: 'tech-ip',
};

/**
 * Jurisdiction-specific companion to the comparative `ti-002` "Data Privacy
 * Law Basics" pillar, which deliberately stays worldwide-general and only
 * name-checks GDPR as one example framework among several. This piece is the
 * deeper, UK-specific explainer covering how UK GDPR has actually diverged
 * from EU GDPR since the Data (Use and Access) Act 2025 -- see the Phase
 * 2/Phase R jurisdiction clusters in the other category files for the
 * established pattern this follows.
 */
export const technologyIpJurisdictionArticles: LawArticle[] = [
  {
    id: 'ti-301',
    title: 'UK GDPR vs. EU GDPR: How They Differ Today',
    slug: 'uk-gdpr-vs-eu-gdpr',
    alphabet: 'U',
    categoryId: 'cat_technology_ip',
    subcategoryId: 'sub_ti_privacy',
    category: TECHNOLOGY_IP_CATEGORY,
    subcategory: { id: 'sub_ti_privacy', name: 'Data Privacy', slug: 'data-privacy' },
    summary:
      'UK GDPR was once a copy of EU GDPR. The Data (Use and Access) Act 2025 rewrote the rules on legitimate interests, automated decisions, cookies, and transfers.',
    author: 'Marcus Hale',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'uk-gdpr-vs-eu-gdpr',
    country: 'United Kingdom',
    content: `<p>For the first few years after Brexit, "UK GDPR" was essentially a copy-paste of the EU GDPR with different letterhead — the same rules, transplanted into UK law and left largely untouched. That's no longer true. The Data (Use and Access) Act 2025 has spent the past year rewriting real parts of the UK regime — how organizations justify processing data, how automated decisions get made, how cookies get consented to — and the two frameworks are now genuinely diverging in substance, not just in which regulator enforces them. Anyone still explaining UK data protection law as "GDPR, but British" is describing a version of the law that stopped being accurate in early 2026.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>UK GDPR is the EU GDPR as it stood at the end of the Brexit transition period, retained in UK law and sitting alongside the Data Protection Act 2018 — but the Data (Use and Access) Act 2025 has now substantively amended it.</li><li>Since 5 February 2026, the UK has its own closed list of "recognised legitimate interests" that skip the normal balancing test, a restructured framework for automated decision-making, new low-risk cookie-consent exemptions, and a new test for international data transfers — none of which exist in the EU GDPR.</li><li>The UK's regulator is itself being restructured, from a single Information Commissioner to a board-led "Information Commission" — a transition that was still underway, not fully complete, as of this article's publication.</li><li>The European Commission renewed its UK adequacy decisions in December 2025, keeping the free flow of personal data from the EU to the UK lawful for years to come, after specifically assessing the impact of these UK reforms.</li><li>Structural differences that predate the 2025 reforms remain: separate regulators, no "one-stop-shop" for UK organizations operating in the EU, and separate international transfer mechanisms.</li></ul></div>

<h2>Where "UK GDPR" Actually Comes From</h2>
<p>UK GDPR is not a new law written from scratch — it's the EU's General Data Protection Regulation as it applied in the UK at the end of the Brexit transition period on 31 December 2020, carried into UK domestic law as "retained EU law" under the European Union (Withdrawal) Act 2018, and then adjusted for domestic operability by a 2019 statutory instrument. It sits alongside the Data Protection Act 2018 (DPA 2018), which supplies UK-specific detail — law enforcement processing, national security exemptions, and the Information Commissioner's enforcement powers, among other things. For its first several years, this arrangement meant the UK and EU regimes were nearly identical in substance, differing mainly in which regulator enforced them. That is the part that has now changed.</p>

<h2>The Data (Use and Access) Act 2025: What Actually Changed</h2>
<p>The Data (Use and Access) Act 2025 (DUAA) received Royal Assent on 19 June 2025, but its reforms did not all take effect at once — they commenced in stages, and getting the current in-force status right matters, because large parts of it are genuinely new as of only a few months before this article was written.</p>
<p>The bulk of the substantive changes to UK GDPR itself came into force on <strong>5 February 2026</strong>:</p>
<ul>
<li><strong>A new "recognised legitimate interests" list.</strong> UK GDPR now has a closed list of purposes — including public-task disclosures, national security, public security and defence, responding to emergencies, and crime prevention and safeguarding — for which an organization no longer needs to carry out the normal three-part legitimate-interests balancing test. This is a genuinely new shortcut that doesn't exist under the EU GDPR. It's narrower than it might sound: everyday uses like direct marketing, sharing data within a corporate group, and network security remain ordinary legitimate interests that still require the standard balancing test.</li>
<li><strong>A restructured framework for automated decision-making.</strong> New UK GDPR Articles 22A–22D replace the old Article 22, which generally prohibited solely automated decisions with legal or similarly significant effects, subject to narrow exceptions. Under the new structure, solely automated significant decisions based on <em>ordinary</em> personal data are now permitted by default, provided safeguards apply — the right to be informed, the right to obtain human intervention, and the right to contest the decision. Decisions based wholly or partly on <em>special category data</em> (health, biometric, and similar sensitive information) remain under a narrower permission model closer to the old rule. This is a structural divergence from the EU GDPR's Article 22, which the UK has not mirrored.</li>
<li><strong>New cookie-consent exemptions.</strong> The Privacy and Electronic Communications Regulations (PECR) now exempt certain low-risk cookie uses from the normal consent requirement — first-party website analytics, cookies that simply remember a user's display or accessibility preferences, and cookies used to provide emergency assistance — provided users are still given clear information and an easy way to opt out. Third-party-shared analytics cookies still require consent as before. Separately, PECR's maximum fine was raised from a flat £500,000 cap up to the same level as UK GDPR fines (see below).</li>
<li><strong>A "soft opt-in" for charities.</strong> Direct marketing's existing "soft opt-in" exception — allowing an organization to email or text someone who has already shown interest, without needing fresh explicit consent — has been extended to charities and other non-commercial organizations for their own charitable purposes, subject to conditions including that the contact details were collected directly from the individual and every message offers a clear opt-out.</li>
<li><strong>A new test for international transfers.</strong> The UK has replaced the EU-style "essentially equivalent" protection standard with its own statutory "data protection test," asking instead whether a destination country's protections are "not materially lower" than the UK's own. This applies both to the government's own adequacy-style regulations for other countries and to organizations' own transfer risk assessments when relying on safeguards like the UK's International Data Transfer Agreement.</li>
</ul>
<p>A separate, later change took effect on <strong>19 June 2026</strong>: organizations must now have a formal internal complaints-handling procedure for data protection complaints — accepting, acknowledging, investigating, and responding to them — and individuals are generally expected to complain to the organization first before escalating to the regulator. As of this article's publication date, that requirement is already in force.</p>

<h2>The Regulator Is Changing Too</h2>
<p>DUAA also restructures who enforces all of this. The single Information Commissioner — a "corporation sole," meaning one person legally embodying the office — is being replaced by a board-led body called the <strong>Information Commission</strong>, with a chair, a chief executive, and non-executive board members. This transition was underway but not yet fully complete as this article was written: a board of non-executive members had been appointed, with recruitment for the permanent chair still open. Because this is a live organizational transition, confirm the Information Commission's current status directly with the regulator before assuming the changeover is finished.</p>

<h2>Did the UK Keep Its EU Adequacy Status?</h2>
<p>This mattered enormously to any business moving personal data from the EU to the UK. The European Commission's original UK adequacy decisions — one under the GDPR, one under the Law Enforcement Directive — were adopted in June 2021 with a four-year "sunset clause" built in, set to expire in mid-2025. Rather than let them lapse, the Commission extended them administratively for several months specifically so it could assess what the Data (Use and Access) Act 2025 would actually change, consulting the European Data Protection Board along the way. The Commission renewed both adequacy decisions in December 2025, each now running for a longer period than the original four years. In short: the UK's post-Brexit data flows with the EU remain lawful, but the renewal process itself is a reminder that UK adequacy is not permanent or unconditional — it's periodically reassessed against how UK law actually develops.</p>

<h2>What Still Separates the Two Regimes, Reform or No Reform</h2>
<p>Even before DUAA, and independently of it, UK GDPR and EU GDPR differ in ways that follow directly from Brexit itself:</p>
<ul>
<li><strong>Different regulators.</strong> The UK's Information Commissioner's Office (transitioning to the Information Commission) enforces UK GDPR alone. Each EU member state has its own data protection authority, coordinated at EU level by the European Data Protection Board.</li>
<li><strong>No one-stop-shop for the UK.</strong> Inside the EU, a company can often deal with a single "lead" regulator for cross-border processing. A UK organization operating across the EU can't use the ICO as a lead authority for its EU-side operations — it has to engage the relevant EU member state regulator directly, commonly in whichever EU country its main EU establishment sits.</li>
<li><strong>A mirrored, but separate, representative requirement.</strong> A non-UK organization with no UK establishment that offers goods or services to, or monitors, people in the UK generally must appoint a UK representative. The same obligation runs the other way under the EU GDPR for non-EU organizations, including UK ones, targeting people in the EU. Many organizations operating on both sides of the Channel end up needing two separate representatives, not one.</li>
<li><strong>Separate transfer mechanisms.</strong> The UK maintains its own International Data Transfer Agreement and a UK-specific Addendum that can be used alongside the EU's Standard Contractual Clauses, while the EU relies on its own, separately updated Standard Contractual Clauses. A transfer arrangement built for one side generally needs its own paperwork for the other.</li>
</ul>

<h2>The Fines: Structurally Identical, Numerically Different</h2>
<p>Both regimes keep the same two-tier maximum fine structure. Under UK GDPR, the higher tier is up to £17.5 million or 4% of global annual turnover, whichever is greater; under the EU GDPR, it's up to €20 million or 4% of global annual turnover. The mechanism — a percentage-of-turnover cap alongside a fixed maximum, with the higher figure applying — is identical; the currency and the flat-figure ceiling are the only numeric difference. DUAA separately raised PECR's own maximum fine to match the UK GDPR ceiling, closing what had been a much lower cap for things like unlawful marketing calls and cookie violations.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is UK GDPR still basically the same law as EU GDPR?</h3>
<p>Less so than it used to be. For several years after Brexit the two were nearly identical, but the Data (Use and Access) Act 2025 has made genuine substantive changes to the UK version — its legitimate-interests rules, automated decision-making framework, cookie-consent exemptions, and international transfer test all now differ from the EU original in ways that go beyond just having a different regulator.</p>
<h3>Can a UK company rely on the ICO to cover its EU data protection compliance?</h3>
<p>No. Since Brexit, the UK no longer participates in the EU's one-stop-shop mechanism, so a UK organization with EU operations generally needs to deal directly with the relevant EU member state regulator for its EU-side processing, separately from its ICO relationship for UK processing.</p>
<h3>Does the EU still allow personal data to flow freely to the UK?</h3>
<p>Yes, as things currently stand — the European Commission renewed its UK adequacy decisions in December 2025 after assessing the impact of the 2025 reforms. Adequacy isn't permanent, though; it's subject to periodic review, so this is a current status rather than a fixed guarantee.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>UK GDPR (retained Regulation (EU) 2016/679) and the Data Protection Act 2018</li>
<li>Data (Use and Access) Act 2025, and the Information Commissioner's Office guidance on its provisions</li>
<li>European Commission adequacy decisions for the United Kingdom (originally adopted 28 June 2021; renewed December 2025)</li>
<li>Privacy and Electronic Communications Regulations 2003, as amended by the Data (Use and Access) Act 2025</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If your organization handles personal data connected to both the UK and the EU, treat this as two related but separately maintained compliance programs rather than one — confirm which specific UK reforms (recognised legitimate interests, the new automated-decision-making rules, the cookie exemptions, the new transfer test) actually apply to what you do, since several took effect only in early 2026. Check the ICO's current guidance directly given the regulator itself is mid-transition, and revisit your EU and UK representative and transfer-mechanism arrangements to make sure both sides are actually covered rather than assuming one filing covers both. For the general, worldwide picture of how modern data privacy law works, see <a href="/tech-ip/data-privacy-law-basics">Data Privacy Law Basics: How Personal Data Is Protected</a>.</p>

<p><em>This article is general legal information, not legal advice. UK and EU data protection law is changing rapidly — confirm the current position with the Information Commissioner's Office or the European Data Protection Board, and consult a qualified data protection lawyer for advice on your specific situation.</em></p>`,
  },
];
