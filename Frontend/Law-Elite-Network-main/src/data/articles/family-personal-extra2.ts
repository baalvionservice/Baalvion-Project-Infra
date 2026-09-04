import type { LawArticle } from '../law-content';

const FAMILY_PERSONAL_CATEGORY = {
  id: 'cat_family_personal',
  name: 'Family & Personal',
  slug: 'family-law',
};

export const familyPersonalExtra2Articles: LawArticle[] = [
  {
    id: 'fp-201',
    title: 'Alimony and Spousal Support Explained',
    slug: 'alimony-and-spousal-support-explained',
    alphabet: 'A',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_alimony',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_alimony', name: 'Alimony & Maintenance', slug: 'alimony-maintenance' },
    summary:
      'Alimony, or spousal support, is money one spouse may be ordered to pay the other after separation to limit unfair financial hardship.',
    author: 'Aman Thakur',
    updatedAt: 'June 23, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'alimony-spousal-support',
    content: `<p>Alimony — also called spousal support or maintenance — is financial support that one spouse may be required to pay the other after they separate or divorce. Its purpose is not to reward or punish anyone but to soften the financial impact of ending a marriage, particularly where one spouse earns far less or gave up career opportunities to support the family. Whether it is awarded, how much, and for how long depend on the needs of one spouse, the ability of the other to pay, and the circumstances of the marriage.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Alimony is support paid by one spouse to the other after separation, distinct from child support.</li><li>It aims to limit unfair financial hardship, not to divide guilt for the breakup.</li><li>Courts weigh factors such as income, length of marriage, and each spouse's earning capacity.</li><li>Support can be temporary, for a fixed period, or — less commonly — long-term.</li><li>Rules vary widely by jurisdiction, and many couples now address support in agreements.</li></ul></div>

<h2>What Alimony Is — and Is Not</h2>
<p>It is important to separate alimony from child support. Alimony supports a former spouse; child support is a separate obligation for the benefit of children. The two are calculated differently and serve different purposes, though both may apply at once. Alimony also differs from the division of property: dividing the assets built up during a marriage is about ownership, while alimony is about ongoing income and need after the split.</p>

<h2>How Courts Decide Whether to Award It</h2>
<p>There is rarely a simple formula. Instead, courts typically weigh a range of factors to decide whether support is appropriate and, if so, how much. Common considerations include:</p>
<ul>
<li>The length of the marriage and the standard of living during it.</li>
<li>Each spouse's income, assets, and earning capacity.</li>
<li>The age and health of both spouses.</li>
<li>Contributions to the marriage, including unpaid work such as raising children or supporting the other's career.</li>
<li>The time one spouse may need to gain skills or employment to become self-supporting.</li>
</ul>

<h2>Types of Spousal Support</h2>
<h3>Temporary Support</h3>
<p>Support paid while a divorce is ongoing, to maintain stability until a final settlement is reached.</p>
<h3>Rehabilitative Support</h3>
<p>Time-limited support intended to help a lower-earning spouse retrain, study, or re-enter the workforce and become financially independent.</p>
<h3>Long-Term or Permanent Support</h3>
<p>Less common today, this may apply after long marriages or where a spouse cannot realistically become self-supporting, for example due to age or health. Even "permanent" support often ends on remarriage or significant change in circumstances.</p>

<h2>Changing or Ending Support</h2>
<p>Alimony is not always fixed forever. Many orders can be reviewed if circumstances change substantially — for instance, if the paying spouse loses their job or the receiving spouse's income rises significantly. Support commonly ends automatically on the death of either party or the remarriage of the recipient, though the exact rules depend on the jurisdiction and the terms of the order or agreement.</p>

<h2>How Spousal Support Works Around the World</h2>
<ul>
<li><strong>United States:</strong> Approaches vary by state; some use guidelines, others give judges broad discretion, and long-term awards have become less common. Property division is a separate question decided alongside support — see <a href="/family-law/community-property-vs-equitable-distribution-us">Community Property vs. Equitable Distribution in U.S. Divorce</a>.</li>
<li><strong>United Kingdom:</strong> Courts have wide discretion over "financial provision", aiming at fairness and, where possible, a clean break between the parties — see <a href="/family-law/financial-settlements-divorce-england-wales">Financial Settlements on Divorce in England and Wales</a> for how the wider settlement, not just maintenance, is actually structured.</li>
<li><strong>Australia:</strong> Spousal maintenance is assessed separately from the property settlement itself, which follows its own process — see <a href="/family-law/property-settlement-after-separation-australia">Property Settlement After Separation in Australia</a>.</li>
<li><strong>European Union:</strong> Member states have their own maintenance laws, and cross-border cases are coordinated through EU rules on jurisdiction and enforcement.</li>
<li><strong>India:</strong> Maintenance can be claimed under personal laws and general provisions, with courts considering need, conduct, and the husband's or wife's means.</li>
</ul>

<h2>Agreements and Planning</h2>
<p>Increasingly, couples address spousal support in advance through prenuptial or separation agreements. A well-drafted agreement can set expectations and reduce conflict, though courts may decline to enforce terms that are clearly unfair or leave one spouse in hardship. Where children are involved, agreements about the spouses cannot override the children's separate right to support.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Confusing alimony with child support, which are calculated separately.</li>
<li>Assuming support is automatic — in many cases it is discretionary and far from guaranteed.</li>
<li>Failing to seek a review when circumstances change, and paying or receiving the wrong amount.</li>
<li>Relying on an informal arrangement that cannot be enforced if the other side stops paying.</li>
</ul>

<h2>Tax Treatment of Spousal Support</h2>
<p>How alimony is taxed can materially change its real value, and the rules have shifted in recent years in several major jurisdictions. In the United States, for divorce agreements executed after 2018, alimony is no longer deductible by the payer nor taxable to the recipient at the federal level — a significant reversal from the prior decades-long rule, and agreements signed before that date may still follow the old treatment depending on transitional provisions. Other countries vary widely: some treat maintenance as taxable income to the recipient and deductible for the payer, while others do not tax it at all. Because this can shift the real cost or benefit of a proposed support figure substantially, it is worth confirming current tax treatment before finalizing an amount, rather than assuming the pre-tax number is what either side will actually experience.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Does alimony continue if the paying spouse retires?</strong> Retirement is generally treated as a substantial change in circumstances that can support a modification request, though courts examine whether the retirement is reasonable and in good faith (age-appropriate) rather than an attempt to avoid paying support.</p>
<p><strong>Can alimony be awarded in a short marriage?</strong> It's less common but not impossible — length of marriage is one factor among several, and a short marriage with a significant income disparity or where one spouse gave up a career opportunity can still support an award, particularly rehabilitative support.</p>
<p><strong>Is alimony different for same-sex marriages?</strong> No — where same-sex marriage is legally recognized, spousal support principles generally apply identically regardless of the spouses' genders.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>U.S. Tax Cuts and Jobs Act of 2017, alimony tax treatment provisions</li>
<li>UK Matrimonial Causes Act 1973, financial provision on divorce</li>
<li>EU Council Regulation 4/2009 on maintenance obligations (Brussels regime)</li>
<li>India, Hindu Adoptions and Maintenance Act 1956</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you expect spousal support to be an issue, gather a clear picture of both spouses' income, assets, and needs, since these drive the outcome. Learn how your jurisdiction approaches support — guidelines or discretion — and keep any agreement properly documented. Because awards turn heavily on local law and individual facts, advice from a family lawyer early on usually leads to fairer, more durable arrangements.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Tax Cuts and Jobs Act of 2017, Public Law 115-97 — repeal of the alimony deduction', url: 'https://www.congress.gov/115/plaws/publ97/PLAW-115publ97.pdf' },
      { label: 'Matrimonial Causes Act 1973, section 25 (UK)', url: 'https://www.legislation.gov.uk/ukpga/1973/18/section/25' },
      { label: 'Council Regulation (EC) No 4/2009 on maintenance obligations', url: 'https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32009R0004' },
      { label: 'India, Hindu Adoptions and Maintenance Act 1956' },
    ],
  },
  {
    id: 'fp-202',
    title: 'What Is a Living Trust and Do You Need One?',
    slug: 'what-is-a-living-trust',
    alphabet: 'W',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_wills',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_wills', name: 'Wills & Probate', slug: 'wills-probate' },
    summary:
      "A living trust lets you place assets under a trustee during your lifetime so they pass to beneficiaries without probate — but it's not for everyone.",
    author: 'Eleanor Whitfield',
    updatedAt: 'June 24, 2026',
    readingTime: 9,
    views: 0,
    featured: true,
    imageSeed: 'living-trust-estate-planning',
    content: `<p>A living trust is a legal arrangement you create during your lifetime to hold your assets, managed by a trustee for the benefit of the people you choose. Unlike a will, which only takes effect after death and usually goes through a court process called probate, a properly funded living trust lets assets pass directly to your beneficiaries when you die — often more privately and with less delay. It is a popular estate-planning tool, but it is not the right answer for everyone, and it does not replace every other document.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A living trust holds your assets during life and distributes them after death, typically avoiding probate.</li><li>A revocable living trust can be changed or cancelled while you are alive and mentally capable.</li><li>Trusts can offer privacy and continuity if you become incapacitated, which a will alone cannot.</li><li>You must actually transfer assets into the trust ("funding") for it to work.</li><li>The concept and tax treatment of trusts vary significantly between common-law and civil-law countries.</li></ul></div>

<h2>How a Living Trust Works</h2>
<p>A living trust involves three roles. The person who creates the trust (often called the grantor or settlor) transfers ownership of assets into it. A trustee manages those assets according to the trust's terms — frequently the grantor themselves while they are alive and well. The beneficiaries are the people who ultimately benefit. When the grantor dies or becomes incapacitated, a named successor trustee steps in to manage and distribute the assets without needing a court to intervene.</p>

<h2>Revocable vs Irrevocable Trusts</h2>
<h3>Revocable Living Trust</h3>
<p>This is the most common type for everyday estate planning. You keep full control: you can add or remove assets, change beneficiaries, or cancel it entirely while you are mentally capable. Because you retain control, it usually offers no special tax or asset-protection benefit, but it provides privacy and avoids probate.</p>
<h3>Irrevocable Trust</h3>
<p>Once created, this generally cannot be changed or revoked. Giving up control can bring advantages such as protecting assets from certain claims or achieving specific tax outcomes, but it is a major step that should never be taken without professional advice.</p>

<h2>Living Trust vs Will</h2>
<p>People often ask whether a trust replaces a will. Usually it does not — they work together. A will covers anything not placed in the trust and can name guardians for minor children, something a trust cannot do. Many estate plans pair a living trust with a short "pour-over" will that directs any leftover assets into the trust. The key practical difference is that assets in a funded trust avoid probate, while assets governed only by a will typically go through it.</p>

<h2>The Importance of Funding the Trust</h2>
<p>A common and costly mistake is creating a trust document but never transferring assets into it. An unfunded trust is largely useless: if the property is still legally in your own name when you die, it may still go through probate. Funding means re-titling bank accounts, property, and investments into the trust's name. This administrative step is essential and is where many do-it-yourself plans fail.</p>

<h2>Benefits and Limitations</h2>
<ul>
<li><strong>Avoiding probate:</strong> assets can pass faster and more privately, without a public court process.</li>
<li><strong>Incapacity planning:</strong> a successor trustee can manage your affairs if you become unable to, avoiding a separate guardianship process.</li>
<li><strong>Privacy:</strong> unlike a probated will, a trust is generally not a public record.</li>
</ul>
<p>But trusts also cost more to set up than a simple will, require ongoing attention to keep funded, and — in the case of revocable trusts — usually offer no creditor protection or tax saving. For people with modest, simple estates, a will may be perfectly adequate.</p>

<h2>How Trusts Vary Across Jurisdictions</h2>
<p>Trusts are a creation of common-law systems and are most developed in places like the United States and the United Kingdom, where they are widely used for estate planning. In the United States, living trusts are especially popular because probate can be slow and costly in some states. In the United Kingdom, trusts are used but tax rules are intricate, so advice is essential. Many civil-law countries in the European Union do not have the same concept of a trust, relying instead on forced-heirship rules and other mechanisms, though some recognise foreign trusts. In India, private trusts exist under trust law and are used for succession and tax planning, but personal and inheritance laws also play a major role.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Creating a trust but never funding it, so assets still go through probate.</li>
<li>Assuming a revocable trust protects assets from creditors or cuts taxes — it usually does not.</li>
<li>Believing a trust replaces a will entirely, leaving gaps like guardianship of children.</li>
<li>Using a generic template across borders where trust law differs or does not exist.</li>
</ul>

<h2>Who a Living Trust Actually Makes Sense For</h2>
<p>Living trusts are frequently marketed as something everyone needs, but the cost-benefit calculation differs by situation. They tend to be most valuable for people who own real estate in more than one state or country (each additional property can mean an additional, separate probate process without a trust), those who place a high value on keeping their affairs private, families with a member who has special needs requiring carefully structured long-term distributions, and anyone who wants a clear, court-free mechanism for managing their affairs if they become incapacitated before death. Conversely, a person with a modest, single-property estate in a jurisdiction where probate is inexpensive and fast may find the upfront cost and ongoing funding discipline of a trust outweighs its benefit — a well-drafted will may be all that is needed.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Does a living trust protect my assets from a lawsuit while I'm alive?</strong> Generally no for a revocable trust — because you retain full control and can revoke it at any time, courts generally treat the assets as still yours for creditor and lawsuit purposes; asset protection typically requires an irrevocable structure, with its own significant trade-offs.</p>
<p><strong>Do I still need a power of attorney if I have a living trust?</strong> Yes — a trust only covers assets actually placed into it, while a financial power of attorney and a healthcare directive cover decisions and assets the trust doesn't reach, so the documents are complementary, not substitutes for each other.</p>
<p><strong>Can I be my own trustee?</strong> Yes, for a revocable living trust this is the norm — most people name themselves as the initial trustee and only involve a successor trustee once they die or become incapacitated.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>U.S. Uniform Trust Code (model legislation adopted variably by states)</li>
<li>UK Trustee Act 2000 and HMRC trust taxation guidance</li>
<li>Hague Convention on the Law Applicable to Trusts and on their Recognition (1985)</li>
<li>India, Indian Trusts Act 1882</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by clarifying your goal: avoiding probate, planning for incapacity, privacy, or tax. Take an inventory of your assets and decide which truly need a trust. Then consult an estate-planning lawyer in your jurisdiction, who can advise whether a living trust, a will, or a combination best fits your situation — and, crucially, make sure any trust you create is properly funded.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Uniform Trust Code, Uniform Law Commission', url: 'https://www.uniformlaws.org/committees/community-home?CommunityKey=193ff839-7955-4846-8f3c-ce74ac23938d' },
      { label: 'Trustee Act 2000 (UK)', url: 'https://www.legislation.gov.uk/ukpga/2000/29/contents' },
      { label: 'HMRC, Trusts, Settlements and Estates Manual', url: 'https://www.gov.uk/hmrc-internal-manuals/trusts-settlements-and-estates-manual/tsem1002' },
      { label: 'Hague Convention on the Law Applicable to Trusts and on their Recognition (1985)', url: 'https://www.hcch.net/en/instruments/conventions/full-text/?cid=59' },
      { label: 'India, Indian Trusts Act 1882' },
    ],
  },
];
