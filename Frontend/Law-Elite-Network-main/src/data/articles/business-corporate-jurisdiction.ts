import type { LawArticle } from '../law-content';

const BUSINESS_CORPORATE_CATEGORY = {
  id: 'cat_business_corporate',
  name: 'Business & Corporate',
  slug: 'business',
};

/**
 * Jurisdiction-specific companion to the comparative `bc-101` "LLC vs
 * Corporation" pillar, which already flags in its own FAQ that "S-corp" is a
 * US federal tax election rather than a separate entity type -- this piece
 * is the deeper, US-specific explainer that FAQ line points toward, covering
 * the actual eligibility rules, election mechanics, and the self-employment
 * tax planning that is the real reason most small US corporations elect it.
 */
export const businessCorporateJurisdictionArticles: LawArticle[] = [
  {
    id: 'bc-301',
    title: 'What Is an S Corporation? How the Tax Election Actually Works',
    slug: 'what-is-an-s-corporation',
    alphabet: 'W',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      "An S corporation isn't a type of company you form — it's a US federal tax election an eligible corporation or LLC makes with the IRS. Here is who qualifies, how to file, and why it's the default recommendation for so many small US businesses.",
    author: 'Elena Rossi',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 's-corporation-tax-election-us',
    country: 'United States',
    content: `<p>Ask a small business owner in the US what an "S-corp" is, and many will describe it as a kind of company, alongside an LLC or a corporation. That's not quite right. An S corporation isn't a separate legal entity type at all — it's a federal tax election that an eligible corporation, or an LLC that chooses to be taxed as a corporation, files with the IRS. You still form a corporation or LLC under your state's law first; the S-election only changes how the entity's profits are taxed afterward, and eligibility for it comes with real, strictly enforced conditions.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>"S-corp" is a tax election under Subchapter S of the Internal Revenue Code, made by filing IRS Form 2553 — not a distinct entity type you form at the state level.</li><li>Eligibility is strict: no more than 100 shareholders, only individuals, certain trusts, or estates as shareholders (no corporations or partnerships), no nonresident alien shareholders, and only one class of stock.</li><li>Like an LLC or partnership, profits and losses pass through to shareholders' personal returns, avoiding the corporate-level "double taxation" a standard C-corp faces.</li><li>The main planning driver for most small businesses is self-employment tax: shareholder-employees pay payroll tax only on "reasonable compensation," not on additional profit distributions — a distinction the IRS actively audits.</li><li>The one-class-of-stock rule is exactly why most venture-backed startups use C-corps instead — S-corp status can't support the preferred-stock structures investors typically require.</li></ul></div>

<h2>A Tax Election, Not an Entity Type</h2>
<p>The process always starts the same way regardless of the eventual tax treatment: you form a corporation, or an LLC, under the law of a US state. An S-election is then a separate, additional step — filing IRS Form 2553 to ask the IRS to tax that existing entity under Subchapter S of the Internal Revenue Code instead of the default rules that would otherwise apply. Some states also require or allow a separate state-level S-corp filing or impose their own entity-level tax even after a federal S-election (California is a well-known example, with its own minimum franchise tax), so the federal election doesn't automatically determine every state tax consequence.</p>

<h2>Who Actually Qualifies</h2>
<p>Eligibility for S-corp status is narrower than most founders expect, and the requirements are checked closely by the IRS:</p>
<ul>
<li><strong>Domestic entity only.</strong> The corporation (or electing LLC) must be a US domestic entity.</li>
<li><strong>No more than 100 shareholders.</strong> Certain family members can elect to be counted as a single shareholder for this limit.</li>
<li><strong>Eligible shareholders only.</strong> Shareholders must be individuals, certain trusts, or estates — corporations and partnerships generally cannot own shares in an S-corp.</li>
<li><strong>US persons only.</strong> Shareholders must be US citizens or resident aliens; nonresident aliens generally cannot hold shares.</li>
<li><strong>One class of stock.</strong> All outstanding shares must confer identical rights to distribution and liquidation proceeds. Differences in voting rights alone are permitted, but differences in economic rights are not.</li>
<li><strong>Not an ineligible corporation.</strong> Certain financial institutions, insurance companies, and domestic international sales corporations cannot elect S-corp status.</li>
</ul>

<h2>How and When to File Form 2553</h2>
<p>To take effect for the current tax year, Form 2553 generally must be filed no later than two months and fifteen days after the start of that tax year, or at any point during the preceding tax year. Every shareholder as of the election date must consent by signing the form — a single missing signature is enough to make the election invalid. A business that misses the deadline isn't necessarily out of luck: the IRS allows late-election relief for reasonable cause under Revenue Procedure 2013-30, which is used often enough in practice that a missed deadline is worth raising with a tax professional rather than assumed to be fatal.</p>

<h2>Pass-Through Taxation, One Layer</h2>
<p>Like a partnership or a default LLC, an S corporation itself generally pays no federal income tax. Profits and losses pass through to shareholders, who report their share on their personal returns via a Schedule K-1, and are taxed once at the individual level. This avoids the classic "double taxation" a standard C corporation faces, where the company pays corporate income tax on its profits and shareholders are taxed again on any dividends distributed from what's left.</p>

<h2>The Real Reason Most Small Businesses Elect It: Self-Employment Tax</h2>
<p>Pass-through taxation alone doesn't fully explain the S-corp's popularity — an LLC taxed as a partnership already gets that. The distinct advantage is how S-corp profits interact with self-employment tax. A shareholder who actively works in the business must be paid "reasonable compensation" as a W-2 employee, and that salary is subject to ordinary payroll taxes (Social Security and Medicare). But profit distributed beyond that reasonable salary is generally not subject to self-employment tax at all — a real and often substantial saving compared to a sole proprietorship or a default LLC, where all business profit is typically subject to self-employment tax regardless of how much of it reflects the owner's active labor.</p>
<p>This is also the single most audited feature of S-corp taxation. The IRS has long taken the position, reflected in guidance including Revenue Ruling 74-44 and reinforced in court decisions such as <em>Watson v. Commissioner</em>, that shareholder-employees cannot set an artificially low salary purely to shift income into the untaxed distribution category. "Reasonable compensation" is judged against what the role would command in the market, considering the shareholder's duties, time devoted to the business, comparable industry salaries, and the company's overall profitability — an underpaid-salary S-corp is one of the more common triggers for an IRS audit adjustment.</p>

<h2>Real Limitations</h2>
<ul>
<li><strong>Only one class of stock.</strong> This is the main reason most venture-backed startups organize as C corporations instead — investors typically require preferred stock with liquidation preferences and other rights that a single class of S-corp stock cannot provide.</li>
<li><strong>Loss limitations.</strong> A shareholder can only deduct pass-through losses up to their basis in the stock and any loans they've personally made to the company.</li>
<li><strong>Built-in gains tax risk.</strong> A business that converts from a C-corp to an S-corp can face a separate built-in gains tax on appreciated assets sold within a specified recognition period (currently five years) after the conversion.</li>
<li><strong>Ownership restrictions foreclose most outside investment.</strong> The shareholder eligibility rules generally rule out venture capital funds, most institutional investors, and foreign ownership structures.</li>
</ul>

<h2>S-Corp Election vs the Underlying Entity Choice</h2>
<p>It's worth separating two decisions that are easy to conflate. Choosing between an LLC and a corporation as your underlying legal structure is a separate question from whether to elect S-corp tax treatment once you've formed one — see our companion guide on that choice. In practice, both an eligible corporation and an eligible LLC can elect S-corp status; the decision to elect usually comes down to whether the self-employment tax savings outweigh the added payroll administration and the strict eligibility constraints, not which underlying entity type you started with.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is an S corporation a different legal entity from a regular corporation?</h3>
<p>No. It's the same underlying corporation (or LLC) formed under state law — "S-corp" describes a federal tax election made with the IRS, not a different entity type or a different liability structure.</p>
<h3>Can a single-owner business elect S-corp status?</h3>
<p>Yes — a sole shareholder can elect S-corp treatment, and many single-owner LLCs do so specifically for the self-employment tax savings, provided the owner takes a reasonable salary for the work they actually do in the business.</p>
<h3>Why can't a venture-backed startup usually be an S-corp?</h3>
<p>Because S-corps are limited to one class of stock with identical distribution and liquidation rights. Venture investors typically require preferred stock with different economic rights than common stock, which the one-class-of-stock rule doesn't allow — this is the main reason most VC-backed companies use C corporations instead.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Internal Revenue Code, Subchapter S, §§ 1361–1379</li>
<li>IRS, Instructions for Form 2553, Election by a Small Business Corporation</li>
<li>IRS, Revenue Procedure 2013-30 (late S-election relief for reasonable cause)</li>
<li>IRS, Revenue Ruling 74-44, and <em>Watson v. Commissioner</em>, 668 F.3d 1008 (8th Cir. 2012) — reasonable compensation standard</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before electing S-corp status, confirm your business and its owners actually meet every eligibility requirement — shareholder count, shareholder type, residency, and the single-class-of-stock rule — since a disqualifying event can terminate the election unexpectedly. If you do elect, set a defensible, market-based salary for any shareholder-employee before taking additional distributions, and keep documentation supporting how that figure was chosen. A tax professional or CPA can model whether the self-employment tax savings actually outweigh the added payroll and compliance costs for your specific numbers before you file Form 2553. For the underlying choice between forming an LLC or a corporation in the first place, see <a href="/business/llc-vs-corporation">LLC vs Corporation: Which Business Structure Should You Choose?</a></p>

<p><em>This article is general legal information, not legal or tax advice. US federal tax law changes over time, and state-level treatment of S-corps varies separately — consult a CPA or tax attorney before electing S-corp status.</em></p>`,
  },
  {
    id: 'bc-302',
    title: 'Forming a Private Limited Company in the UK via Companies House',
    slug: 'uk-company-formation-companies-house',
    alphabet: 'F',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      'UK company formation is fast, but the rules behind it have changed sharply in the past two years — new fees, a stricter registered-office standard, and mandatory identity verification for directors. Here is the process as it actually stands today.',
    author: 'Elena Rossi',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'uk-company-formation-companies-house',
    country: 'United Kingdom',
    content: `<p>Forming a private limited company in the UK is, on paper, one of the fastest incorporation processes in the world — a digital application can be approved within 24 hours. But the process behind that speed has changed substantially in the past two years. Companies House raised its fees twice, gained new powers to verify who is actually behind a company, and is in the middle of rolling out the biggest reform to how the UK's company register works since it was created. This guide covers the process as it actually stands today, including which reforms are already in force and which are still being phased in.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Registering a private limited company online costs £100 as a standard filing or £156 same-day, rising to £124 by paper form — Companies House raised these fees again from 1 February 2026.</li><li>A registered office must now be an "appropriate address" where mail addressed to the company will genuinely be seen — a bare PO box is no longer enough, and the company must also give Companies House a registered email address.</li><li>Since 18 November 2025, directors and people with significant control must verify their identity with Companies House, either directly via GOV.UK One Login or through an authorised agent — new appointments must verify immediately, and existing office-holders have a 12-month transition window.</li><li>Registration itself is only the beginning: Corporation Tax registration, an annual confirmation statement, and annual accounts all follow on their own separate deadlines.</li><li>A further reform removing small companies' option to file abridged accounts was paused in January 2026 and rescheduled to April 2028 — it is not yet in force.</li></ul></div>

<h2>Choosing How to Register</h2>
<p>There are three practical routes to incorporate a private company limited by shares in England, Wales, Scotland, or Northern Ireland, all administered by Companies House:</p>
<ul>
<li><strong>Standard digital registration</strong>, filed directly through the GOV.UK/Companies House online service, currently costs £100 and is normally processed within 24 hours.</li>
<li><strong>Same-day digital registration</strong>, filed via approved third-party formation software before 11am on a working day, costs £156 and is typically approved the same day.</li>
<li><strong>Paper registration</strong>, filed on Form IN01 by post, costs £124 and takes roughly 8 to 10 days — the slowest and most expensive route, kept mainly for applicants who can't or won't file digitally.</li>
</ul>
<p>These figures took effect for companies incorporated from 1 February 2026 — Companies House had already raised fees once in 2024, and this is the second increase since. Because Companies House has changed its fee schedule twice in under two years, confirm the current figure on GOV.UK immediately before filing rather than relying on any fixed number, including the ones above.</p>

<h2>What You Need to Register</h2>
<h3>Name and Registered Office</h3>
<p>The company needs a name that isn't the "same as" an existing registered name and doesn't use certain restricted or sensitive words without permission. Since March 2024, Companies House also has new powers to challenge and force a change to a company name after registration if it's misleading or was obtained improperly, so the traditional advice to simply clear the name-availability search before filing is no longer the end of the story.</p>
<p>The registered office address requirement changed meaningfully under the Economic Crime and Corporate Transparency Act 2023 (ECCTA), effective from 4 March 2024: it must now be an "appropriate address," meaning a physical location where post addressed to the company can reasonably be expected to come to the attention of someone acting on the company's behalf, with delivery capable of being acknowledged. A PO box on its own no longer qualifies, though a PO box that forms part of a fuller, deliverable street address can still work. Companies must also now supply a registered email address to Companies House — a separate, additional requirement from the same reform. A company that doesn't maintain a valid appropriate address risks Companies House substituting a default address and, ultimately, risks being struck off the register.</p>

<h3>Directors, Shareholders, and Governing Documents</h3>
<p>A private company needs at least one director who is a natural person — a real individual, not another company. A separate ECCTA reform will go further and restrict the use of corporate directors generally, requiring any permitted corporate director to itself be a UK-registered body corporate whose own board consists entirely of natural persons who have verified their identity, and banning overseas corporate directors outright — but this specific restriction has been delayed and, per Companies House's own transition plan, is not expected before November 2026 at the earliest. It is not yet in force.</p>
<p>Incorporation also requires a one-time memorandum of association (which cannot be changed after registration), articles of association (the UK's default "Model Articles" apply automatically unless the company files bespoke articles), at least one shareholder, identification of anyone with significant control over the company (a Person with Significant Control, or PSC — broadly anyone holding more than 25% of shares or voting rights, or with other means of significant influence), and a Standard Industrial Classification (SIC) code describing the company's business activity.</p>

<h2>The New Identity Verification Requirement</h2>
<p>The single biggest operational change to UK company formation in years is mandatory identity verification, also introduced by ECCTA and in force since 18 November 2025. Every director, PSC, and — for LLPs — every member or general partner must verify their identity with Companies House, either directly through GOV.UK One Login or through an Authorised Corporate Service Provider (ACSP) such as an accountant or formation agent. Anyone newly appointed as a director or newly registered as a PSC from 18 November 2025 onward must verify at the point of appointment. Anyone who already held one of these roles before that date has a 12-month transition window — commonly tied to the company's next confirmation statement — to complete verification. Companies House has said it will not prosecute non-compliance during this initial transition period, but continuing to act as a director without verifying, once required, is a criminal offence, and a company cannot be newly formed, nor file a confirmation statement, without the necessary verification codes in place.</p>

<h2>What Happens After You Register</h2>
<p>Successful registration produces a Certificate of Incorporation, stating the company's name, unique company number, date of incorporation, and whether it is private or public and limited or unlimited. Under the Companies Act 2006, this certificate is conclusive evidence that the registration requirements were met and the company is duly incorporated. But incorporation is the start of a compliance calendar, not the end of one:</p>
<ul>
<li><strong>Corporation Tax registration with HMRC</strong> is required within 3 months of the company actually starting to trade — not from the date of incorporation itself, which can be earlier.</li>
<li><strong>A confirmation statement</strong> — the modern replacement for the old annual return, in place since 2016 — must be filed at least once every 12 months, within 14 days of the review period ending.</li>
<li><strong>Annual accounts</strong> must be filed with Companies House 9 months after the company's accounting reference date each year, though the very first set of accounts is due later — 21 months after the date of incorporation.</li>
<li><strong>A Company Tax Return (CT600)</strong> must be filed with HMRC within 12 months of the end of the accounting period, though Corporation Tax itself must actually be paid earlier — 9 months and 1 day after the period ends.</li>
</ul>
<p>One practical filing change worth flagging for anyone used to the old process: the free joint HMRC/Companies House online filing service (which let very small companies file accounts and a tax return together for free) permanently closed on 31 March 2026. From 1 April 2026 onward, accounts and the CT600 must be filed separately, generally through commercial accounting software, Companies House's own web filing service, or paper.</p>

<h2>A Reform That's Coming, But Not Yet</h2>
<p>A further ECCTA-driven change would remove small and micro companies' current option to file abridged or "filleted" accounts, and require them to file a full profit and loss account for the first time (though with an opt-out from public disclosure of that P&amp;L specifically). This was originally expected to roll out around 2025–2027, but Companies House paused it in January 2026 and has since rescheduled it to April 2028. As of today, small and micro companies can still file abridged accounts under the existing rules — this is a genuine, confirmed future change, not something that applies to a company registering right now.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I need a UK address or a UK resident director to form a UK company?</h3>
<p>You need a registered office address in the UK that meets the "appropriate address" standard, but you do not need to be a UK resident yourself to be a director — many non-UK founders incorporate UK companies. You will, however, need to complete the identity verification process regardless of where you live.</p>
<h3>Can I use my home address as my company's registered office?</h3>
<p>Yes, provided it's a genuine address where company post will actually be seen, though many founders prefer a separate registered-office or formation-agent address for privacy, since the registered office appears on the public register.</p>
<h3>Is Companies House registration the same as registering for tax?</h3>
<p>No — these are separate steps. Companies House registration creates the legal entity; you must separately register for Corporation Tax with HMRC within 3 months of starting to trade, and that registration doesn't happen automatically just because the company was incorporated.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>GOV.UK — Register a private limited company and current fee schedule (companies house web incorporation service)</li>
<li>Economic Crime and Corporate Transparency Act 2023, and Companies House's published ECCTA transition plan</li>
<li>Companies Act 2006, ss. 15, 442 (certificate of incorporation; accounts filing deadlines)</li>
<li>GOV.UK — Guidance on verifying your identity for Companies House</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before filing, confirm the current registration fee and the current registered-office and identity-verification requirements directly on GOV.UK, since all three have changed within the past two years and are likely to change again. If you'll be a director or a person with significant control, plan to complete identity verification at the same time as incorporation rather than treating it as a later formality. Once registered, set calendar reminders for your Corporation Tax registration, confirmation statement, and first accounts deadlines immediately — missing any of them is one of the most common (and most avoidable) ways a new UK company runs into trouble with Companies House or HMRC. For the general, worldwide picture of how company formation works, see <a href="/business/company-formation-overview">How to Form a Company: A Practical Overview</a>.</p>

<p><em>This article is general legal information, not legal advice. UK company law and Companies House fees and procedures change frequently — confirm the current requirements on GOV.UK and consult a UK solicitor or accountant before incorporating.</em></p>`,
  },
  {
    id: 'bc-303',
    title: 'Federal vs. Provincial Incorporation in Canada',
    slug: 'federal-vs-provincial-incorporation-canada',
    alphabet: 'F',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      'Incorporating federally under the Canada Business Corporations Act and incorporating provincially both create a fully protected company — the real difference is name protection and registration overhead, not liability.',
    author: 'Elena Rossi',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'federal-vs-provincial-incorporation-canada',
    country: 'Canada',
    content: `<p>Every business incorporating in Canada faces a choice that has nothing to do with what the company does and everything to do with where it's legally domiciled: incorporate federally, under the Canada Business Corporations Act, or incorporate provincially, under the corporate statute of a single province or territory. Both routes create a real company with limited liability and perpetual existence — the choice isn't about protection, it's about name rights, compliance overhead, and how many places you'll eventually have to register anyway.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Federal incorporation, under the Canada Business Corporations Act (CBCA) and administered by Corporations Canada, gives your company name protection recognized nationwide; provincial incorporation protects the name only within that province's own registry.</li><li>Neither choice is a substitute for the other when it comes to actually operating: a federally incorporated company must still register extra-provincially in every province where it carries on business, and the same applies in reverse for a provincially incorporated company expanding elsewhere.</li><li>The CBCA still requires that at least 25% of a corporation's directors be resident Canadians (or at least one, if the board has fewer than four members) — a rule some sources mistakenly describe as repealed. Ontario dropped its own residency requirement in 2021; British Columbia never had one.</li><li>Federal online incorporation costs $200 through Corporations Canada; provincial fees vary by province — for example, British Columbia's government filing fee is $350.</li><li>Both federal and provincial corporations get the same core legal attributes: separate legal personality, limited liability for owners, and perpetual existence until formally wound up.</li></ul></div>

<h2>Two Separate Statutory Regimes</h2>
<p>Federal incorporation happens under the <strong>Canada Business Corporations Act</strong>, administered by <strong>Corporations Canada</strong>, a branch of Innovation, Science and Economic Development Canada (ISED). Provincial incorporation happens under each province or territory's own business corporations act — Ontario's Business Corporations Act, filed through the Ontario Business Registry, or British Columbia's Business Corporations Act, filed through BC Registry Services, are the two most commonly compared examples, though every province has its own equivalent statute and registry.</p>

<h2>The Real Practical Difference: Name Protection</h2>
<p>The clearest, most commonly cited distinction is how far your company name is protected. A federal incorporation runs its name through a national name-approval process at Corporations Canada, giving it recognition and protection across the whole country. A provincial incorporation's name is checked and protected only within that province's own registry — a name cleared for use in British Columbia carries no automatic protection in Ontario or Alberta.</p>
<p>One detail that trips up a lot of first-time founders: a standalone NUANS name search report is <strong>no longer a required separate step for an ordinary federal incorporation</strong>. Corporations Canada has folded the name search directly into its Online Filing Centre, so most applicants no longer need to pre-order a NUANS report before applying. A separate NUANS report is still required in narrower situations — reviving a dissolved federal corporation or completing a federal amalgamation, for instance — but not for a standard new incorporation. Some provinces, including Ontario, still commonly use a province-specific NUANS-style report as part of a named incorporation, so don't assume the federal process and a given province's process work identically.</p>

<h2>What Incorporating Federally Does <em>Not</em> Do</h2>
<p>The single most common misunderstanding about federal incorporation is assuming it functions as a nationwide operating license. It doesn't. Corporations Canada is explicit that a federally incorporated company is still required to register — a process called <strong>extra-provincial registration</strong> — in every province or territory where it actually carries on business, not just where its head office sits. Ontario, Nova Scotia, and Newfoundland and Labrador let a federal corporation complete this registration at the same time as incorporation through integrated federal-provincial filing; Saskatchewan requires a separate registration afterward. Registration costs vary by province — Ontario currently charges no separate fee for this, while Nova Scotia and Newfoundland and Labrador charge their own registration fees.</p>
<p>The same logic runs in reverse. A company incorporated provincially in, say, British Columbia, that wants to open an office or start actively doing business in Ontario, generally has to register extra-provincially in Ontario too. Neither federal nor provincial incorporation is a single filing that covers the whole country automatically — the incorporation determines your company's "home" jurisdiction and its governing corporate law, while extra-provincial registration is what actually authorizes you to operate somewhere else.</p>

<h2>Director Residency: A Frequently Misstated Rule</h2>
<p>This is worth getting right because it's commonly misreported. The CBCA still requires that <strong>at least 25% of a federal corporation's directors be resident Canadians</strong> — or, for a board with fewer than four directors, at least one resident Canadian director — and imposes an even stricter majority-resident requirement for corporations active in certain restricted sectors. This residency rule has not been repealed, despite some online summaries suggesting otherwise.</p>
<p>Provinces have gone different directions on this question. <strong>Ontario eliminated its own director residency requirement in July 2021</strong>, meaning an Ontario-incorporated company can now have an entirely non-resident board. <strong>British Columbia has never imposed a director residency requirement at all.</strong> The practical effect is that a company with an entirely non-Canadian-resident board of directors may find it easier to incorporate in Ontario or BC than federally, where the 25%-resident rule still applies.</p>

<h2>Fees at a Glance</h2>
<p>Federal online incorporation through Corporations Canada currently costs <strong>$200</strong>, with an annual return filed online for <strong>$12</strong> each year. British Columbia's government incorporation fee is <strong>$350</strong> through Corporate Online (plus a small service fee), with an annual report fee of <strong>$43.39</strong> due within two months of the incorporation anniversary. Ontario's current online incorporation fee is commonly cited at <strong>$300</strong> through the Ontario Business Registry, with no separate government fee for the annual return. Because provincial fees are set independently and can change without coordinating with each other or with the federal fee, confirm the current figure on the relevant government registry before filing rather than relying on a fixed number from any single guide.</p>

<h2>Other Differences Worth Knowing</h2>
<p>Federal corporations file an annual return with Corporations Canada within 60 days of their incorporation anniversary, which — since a January 2024 change — must now include information about individuals with significant control over the corporation. Provincial filings follow their own separate schedules: Ontario's annual return is due within six months of the corporation's fiscal year-end (a filing now handled entirely through the Ontario Business Registry, separate from the federal corporate income tax return), while British Columbia's annual report is tied to the incorporation anniversary date. None of these filings substitute for the others — a federal corporation registered extra-provincially in a given province typically owes both the federal annual return and whatever registration-renewal obligation that province imposes.</p>

<h2>When Each Choice Actually Matters</h2>
<p>For a business that expects to operate in a single province for the foreseeable future, provincial incorporation is usually the simpler and cheaper starting point — it avoids the federal 25%-resident-director rule (outside Ontario and BC, at least) and doesn't require extra-provincial registration in a home jurisdiction you're already covered in. For a business planning genuinely national operations, wanting nationwide name protection before a competitor claims a similar name in another province, or wanting the reputational signal of a federal charter, incorporating under the CBCA is the more common recommendation — with the clear understanding that it's a starting point, not a finish line, since extra-provincial registration will still follow wherever the business actually sets up shop.</p>

<h2>Frequently Asked Questions</h2>
<h3>Does federal incorporation give my company stronger limited liability protection than provincial incorporation?</h3>
<p>No. Both federal and provincial incorporation create a separate legal entity with the same core limited-liability protection for owners. The choice between them is about name protection and registration overhead, not about how well-protected your personal assets are.</p>
<h3>If I incorporate federally, do I still need to register in the province where my head office is located?</h3>
<p>Yes, in most cases. Federal incorporation does not exempt you from extra-provincial registration in any province where you actually carry on business, including the province your head office sits in, though a few provinces let you complete that registration alongside the federal incorporation itself.</p>
<h3>Can a federally incorporated company have a board with no Canadian residents at all?</h3>
<p>Generally no — the CBCA requires at least 25% of directors (or at least one, on a board of fewer than four) to be resident Canadians. A company that specifically needs a fully non-resident board may find provincial incorporation in a jurisdiction like Ontario or British Columbia, neither of which imposes this requirement, a better fit.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Canada Business Corporations Act, R.S.C., 1985, c. C-44, s. 105(3)–(3.1) (director residency requirement)</li>
<li>Corporations Canada (ISED) — federal incorporation, fees, annual return, and provincial registration guidance</li>
<li>Ontario Business Registry — incorporation and annual return guidance; Better for People, Smarter for Business Act, 2020 (director residency repeal)</li>
<li>British Columbia Business Corporations Act and BC Registry Services — incorporation and annual report guidance</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by mapping out where your business will actually operate in its first few years, not just where it's headquartered — that answer usually settles the federal-versus-provincial question faster than comparing fees. If your board includes people who aren't Canadian residents, check the current director-residency rule for the specific jurisdiction you're considering before you file, since it can quietly rule out federal incorporation or a particular province. And whichever route you choose, budget for the possibility of extra-provincial registration elsewhere as the business grows — it's a near-certainty for any company that expands beyond its home jurisdiction. For the general, worldwide picture of how company formation works, see <a href="/business/company-formation-overview">How to Form a Company: A Practical Overview</a>.</p>

<p><em>This article is general legal information, not legal advice. Incorporation rules and fees vary by jurisdiction and change over time — consult a lawyer or accountant licensed in the relevant Canadian jurisdiction before incorporating.</em></p>`,
  },
  {
    id: 'bc-304',
    title: 'Registering a Company in Australia: The ASIC Process',
    slug: 'company-registration-australia-asic',
    alphabet: 'R',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      'Registering a company in Australia runs through ASIC and touches two separate identifying numbers — the ACN and the ABN — plus a director residency rule and a Director ID that has to be obtained before appointment.',
    author: 'Elena Rossi',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'company-registration-australia-asic',
    country: 'Australia',
    content: `<p>Registering a company in Australia runs through a single regulator, the Australian Securities and Investments Commission (ASIC), but the process touches two separate government bodies and two separate identifying numbers before you're actually ready to trade. Understanding which is which — and which ongoing obligations start counting down from the day ASIC approves your application — makes the difference between a clean registration and a company that's technically formed but not actually ready to operate.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Company registration in Australia is governed by the Corporations Act 2001 and regulated by ASIC; the most common structure for a small or private business is a proprietary limited company, or "Pty Ltd."</li><li>Registering online through the Business Registration Service at register.business.gov.au lets you apply for your company's ACN and its separate ABN in a single session, even though they're issued by two different bodies — ASIC and the Australian Taxation Office.</li><li>At least one director of a proprietary company must ordinarily reside in Australia, and every director — regardless of residency — must hold a Director ID from the Australian Business Registry Services before being appointed.</li><li>ASIC's fees are indexed every 1 July, so the registration and annual review fees change annually — confirm the current figures on asic.gov.au before you file or budget for the year ahead.</li><li>A once-planned merger of ASIC's company register with the Australian Business Register was abandoned in 2023 after costs ballooned; the two registers remain separate today, with ASIC instead running its own modernization program.</li></ul></div>

<h2>The Legal Basis and the Usual Structure</h2>
<p>Company registration in Australia is governed by the Corporations Act 2001, and ASIC is the regulator responsible for administering it. For a small or privately held business, the standard structure is a proprietary company limited by shares — universally referred to as a Pty Ltd — which is what the rest of this guide assumes unless otherwise noted.</p>

<h2>How to Register</h2>
<p>The most common route today is the <strong>Business Registration Service</strong>, at register.business.gov.au, a whole-of-government portal that lets you apply for your company's Australian Company Number (ACN) and, in the same session, its Australian Business Number (ABN), business name, and tax registrations like GST. ASIC processes the company-registration side of that application. A paper form (Form 201) remains available for company types or circumstances the online service doesn't support. You can also register — and handle your company's ongoing ASIC lodgements afterward — through a registered agent, typically an accountant or lawyer holding an ASIC-issued Registered Agent Number, though using one is optional rather than required.</p>

<h2>What You Need Before You Apply</h2>
<h3>Name, Directors, and Address</h3>
<p>You'll need a unique company name checked against the national names register, or you can simply use your company's ACN as its legal name if you don't want a separate trading name. A proprietary company needs at least one director; a public company needs at least three. At least one director of a proprietary company — and at least two directors of a public company — must ordinarily reside in Australia. Citizenship isn't required for this; permanent residents and holders of an appropriate visa can generally satisfy it, and what counts as "ordinarily resident" is assessed case by case rather than defined by a fixed test in the Act itself. The company also needs a registered office and a principal place of business, both physically located in Australia.</p>

<h3>The Director ID Requirement</h3>
<p>Since April 2022, every person appointed as a company director in Australia — regardless of residency — must hold a <strong>Director Identification Number (Director ID)</strong>, issued by the Australian Business Registry Services (ABRS), <em>before</em> they're appointed. The transitional period that let existing directors apply retroactively has closed; anyone becoming a new director today needs their Director ID first. Applying is free, must be done by the director personally (no one else can apply on their behalf), and can be done well ahead of the appointment — most guidance recommends allowing at least a couple of weeks. Skipping this step, or appointing a director who hasn't yet obtained one, risks real penalties, and it's one of the most common process mistakes first-time founders make when they're used to older registration procedures that didn't require it.</p>

<h2>Fees</h2>
<p>ASIC's fees are indexed annually every 1 July, so treat any dollar figure — including the ones below — as a snapshot to confirm against the current ASIC fee schedule before you rely on it. For the 2026-27 financial year (from 1 July 2026), the standard registration fee for a proprietary company limited by shares is commonly cited at <strong>$636</strong>, with an ongoing <strong>annual review fee of $342</strong> due each year after registration, and a separate <strong>$65</strong> fee if you want to reserve a company name in advance. Late payment of the annual review fee attracts an additional penalty that increases the longer the payment is overdue. Because these figures move every year without exception, check asic.gov.au directly at the time you're actually budgeting or filing.</p>

<h2>ACN and ABN: Two Numbers, Two Different Bodies</h2>
<p>A frequent point of confusion for new founders is treating the ACN and ABN as the same thing. They're not. The <strong>Australian Company Number (ACN)</strong> is a unique 9-digit identifier issued by ASIC the moment your company is registered — it's your company's legal identifier under the Corporations Act. The <strong>Australian Business Number (ABN)</strong> is a separate, 11-digit number issued by the Australian Taxation Office through the Australian Business Register, and it isn't automatic — you have to apply for it separately, using your newly issued ACN as part of that application (an ABN is typically the ACN with two additional check digits added to the front). The Business Registration Service lets you request both in one sitting, but they remain two distinct numbers from two distinct government bodies, and you'll use both — the ACN in your company's legal dealings, the ABN for tax, invoicing, and dealing with other businesses.</p>

<h2>Ongoing Obligations After Registration</h2>
<p>Registering the company starts a compliance calendar, not a one-off task:</p>
<ul>
<li><strong>Annual review:</strong> each year, on the anniversary of your company's registration, ASIC issues an annual statement. The annual review fee becomes payable, and directors generally need to pass a solvency resolution confirming the company can pay its debts as they fall due — both generally expected within two months of the review date.</li>
<li><strong>Keeping details current:</strong> changes to your registered office, or to who your directors and secretary are, generally need to be notified to ASIC within 28 days.</li>
<li><strong>Directors' duties:</strong> the Corporations Act imposes a standing duty of care and diligence, a duty to act in good faith and for a proper purpose, a duty not to misuse your position or company information, and — critically — a duty to prevent the company from trading while insolvent, which carries both civil and criminal exposure if breached.</li>
<li><strong>Maintaining a physical presence:</strong> the registered office and principal place of business must continue to be maintained in Australia for as long as the company exists, not just at the point of registration.</li>
</ul>

<h2>A Merger That Didn't Happen</h2>
<p>For several years, the government planned to merge ASIC's collection of registers with the Australian Business Register into a single system under the Australian Business Registry Services — the "Modernising Business Registers" program. That plan was formally discontinued in 2023 after an independent review found its costs had ballooned far beyond the original estimate. The Australian Business Register remains with the Australian Taxation Office, not folded into ASIC, and ABRS's main ongoing role today is administering Director IDs rather than running a unified company-and-business register. ASIC has since pursued its own, more modest modernization of its existing registers rather than a full merger — worth knowing mainly so you don't go looking for a single combined ASIC/ABR system that, as of today, doesn't exist.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I need an ABN and an ACN, or just one of them?</h3>
<p>Generally both, for different purposes. The ACN is your company's core legal identifier from ASIC; the ABN, issued separately by the Australian Taxation Office, is what you'll use for tax registration, invoicing, and most day-to-day dealings with other businesses. Most founders apply for both together through the Business Registration Service.</p>
<h3>Can I be a company director in Australia if I don't live there?</h3>
<p>You can be a director, but a proprietary company needs at least one director who ordinarily resides in Australia — so a company with an entirely overseas board generally can't register unless at least one Australian-resident director is appointed. Every director, regardless of residency, also needs a Director ID before appointment.</p>
<h3>Why do ASIC's fees keep changing?</h3>
<p>ASIC indexes many of its fees, including company registration and the annual review fee, every 1 July. There's no way to lock in a fee for future years — always check the current figure on asic.gov.au close to the date you're actually filing or budgeting.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Corporations Act 2001 (Cth), s201A (director residency) and Part 2D.1 (directors' duties)</li>
<li>ASIC — Register a company, company annual review, and current fee schedule (asic.gov.au)</li>
<li>Australian Business Registry Services (ABRS) — Director Identification Number guidance</li>
<li>Business Registration Service (register.business.gov.au)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before you apply, confirm that at least one proposed director meets the Australian residency requirement and that every director has applied for their Director ID — both are common early stumbling blocks. Budget for the current registration fee and the recurring annual review fee using the figures published on asic.gov.au at the time you file, not a number from an older guide. Once registered, calendar your annual review date immediately, since the solvency resolution and fee both run on a clock that starts the moment ASIC approves your company. For the general, worldwide picture of how company formation works, see <a href="/business/company-formation-overview">How to Form a Company: A Practical Overview</a>.</p>

<p><em>This article is general legal information, not legal advice. Australian company registration fees and requirements are updated periodically — confirm the current position on asic.gov.au and consult an Australian lawyer or accountant before registering.</em></p>`,
  },
];
