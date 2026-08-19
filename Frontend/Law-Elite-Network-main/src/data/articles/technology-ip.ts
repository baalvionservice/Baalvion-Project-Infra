import type { LawArticle } from '../law-content';

const technologyIpCategory = {
  id: 'cat_technology_ip',
  name: 'Technology & IP',
  slug: 'tech-ip',
} as const;

export const technologyIpArticles: LawArticle[] = [
  {
    id: 'ti-001',
    title: "Trademark vs Copyright: What's the Difference?",
    slug: 'trademark-vs-copyright-difference',
    alphabet: 'T',
    categoryId: 'cat_technology_ip',
    subcategoryId: 'sub_ti_trademark',
    category: technologyIpCategory,
    subcategory: { id: 'sub_ti_trademark', name: 'Trademarks', slug: 'trademarks' },
    summary:
      'Trademarks protect brand identifiers like names and logos, while copyright protects original creative works — and the two rights serve very different purposes.',
    author: 'Priya Nair',
    updatedAt: 'March 14, 2026',
    readingTime: 9,
    views: 7240,
    featured: true,
    imageSeed: 'trademark-versus-copyright',
    content: `<p>Trademarks and copyrights are two of the most widely confused forms of intellectual property. People often assume that registering a business name protects its logo design, or that copyrighting a song also locks down the band&apos;s name. In reality, these rights protect different things, arise in different ways, and last for different periods. Understanding the distinction helps creators, founders, and businesses protect the right asset in the right way.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A trademark protects brand identifiers — names, logos, slogans, and other signs that tell consumers who made a product or service.</li><li>Copyright protects original creative expression, such as text, music, art, software, and film, the moment it is fixed in a tangible form.</li><li>Trademarks can last indefinitely if used and renewed; copyright lasts for a long but finite term, often the author&apos;s life plus 50 to 70 years.</li><li>Registration is generally optional for copyright but strongly advisable for trademarks, and is handled by different offices in each country.</li></ul></div>

<h2>What a Trademark Protects</h2>
<p>A trademark is a sign that distinguishes the goods or services of one trader from those of another. The classic examples are brand names and logos, but trademarks can also cover slogans, distinctive packaging, and in some jurisdictions sounds or colors. The legal purpose is to prevent consumer confusion and to protect the goodwill a business builds in its brand.</p>
<h3>How Trademark Rights Arise</h3>
<p>In many countries, limited rights can arise from simply using a mark in commerce, but formal registration provides far stronger and clearer protection. Registration is national or regional: the USPTO in the United States, the EUIPO for the European Union, and national offices such as the Indian Trade Marks Registry. The WIPO-administered Madrid System lets an applicant seek protection in many member countries through a single international application.</p>

<h2>What Copyright Protects</h2>
<p>Copyright protects original works of authorship that are fixed in a tangible medium. This includes books, articles, photographs, paintings, songs, sound recordings, films, and computer code. Crucially, copyright protects the expression of an idea, not the idea itself — two authors can write about the same topic, but neither may copy the other&apos;s actual words.</p>
<ul><li>Literary and written works, including software source code</li><li>Musical compositions and sound recordings</li><li>Artistic works, photographs, and audiovisual content</li></ul>

<h2>How the Two Rights Differ</h2>
<p>The core difference is what each right covers. A clothing company might hold a trademark on its brand name and logo, and separately hold copyright in the photographs used in its advertising campaign. Each right does a distinct job.</p>
<ul><li><strong>Subject matter:</strong> trademarks cover brand identifiers; copyright covers creative expression.</li><li><strong>Origin:</strong> copyright generally arises automatically on creation, while trademark protection is strongest through registration.</li><li><strong>Duration:</strong> trademarks can be renewed indefinitely; copyright expires after a fixed term.</li></ul>

<h2>Duration and Renewal</h2>
<p>Copyright has a long but limited life. Under the Berne Convention minimum, protection lasts at least the author&apos;s life plus 50 years, and many countries extend this to life plus 70 years. Once the term ends, the work enters the public domain and may be freely used. Trademarks work differently: a registration typically lasts ten years and can be renewed repeatedly, so a well-maintained mark can endure for as long as the brand is in genuine use.</p>

<h2>Enforcement Basics</h2>
<p>Both rights are enforced primarily by the owner, usually starting with a cease-and-desist letter and escalating to civil litigation if needed. Trademark disputes turn on the likelihood of consumer confusion, while copyright disputes turn on whether protected expression was actually copied. Remedies can include injunctions, damages, and orders to destroy infringing goods, though the specifics vary widely by jurisdiction.</p>

<h2>Where Patents and Trade Secrets Fit In</h2>
<p>Trademarks and copyright are only two of the four main pillars of intellectual property, and confusing them with the other two is just as common. A patent protects a new, useful, and non-obvious invention or process — not a brand or a creative work — and requires a formal application demonstrating novelty over prior art, generally lasting around 20 years from filing rather than indefinitely. A trade secret, by contrast, protects confidential business information (a formula, a customer list, a manufacturing process) for as long as it remains genuinely secret and reasonable steps are taken to protect it — there is no registration and no fixed term, but the protection evaporates the moment the information becomes public through legitimate means. A single product can involve all four types of protection simultaneously: a patent on the underlying technology, a trademark on the brand name, copyright on the marketing materials and software, and trade secret protection over the exact manufacturing process.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Can I trademark a name that's already copyrighted by someone else?</strong> Potentially yes — the two rights protect different things, so a company name that happens to match a copyrighted book title, for instance, may still be registrable as a trademark if it isn't already used as a trademark by someone else in a way that would cause confusion.</p>
<p><strong>Do I need to register copyright for it to exist?</strong> No — in most countries copyright exists automatically the moment an original work is fixed in a tangible form, but formal registration (where available) is still valuable because it typically creates a public record of ownership and is often a prerequisite for filing an infringement lawsuit.</p>
<p><strong>What happens if I use a trademark without registering it?</strong> Depending on the jurisdiction, you may still acquire limited "common law" rights through actual use in commerce, but these rights are typically narrower in geographic scope and harder to enforce than a registered trademark, which is why registration is strongly recommended once a brand has real commercial value.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>World Intellectual Property Organization (WIPO), Madrid System guidance</li>
<li>U.S. Patent and Trademark Office, trademark basics</li>
<li>Berne Convention for the Protection of Literary and Artistic Works</li>
<li>India, Trade Marks Act 1999 and Copyright Act 1957</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Identify which asset you are trying to protect: if it is a brand name or logo, focus on trademark registration in the markets where you operate; if it is creative content, document authorship and consider voluntary copyright registration where it strengthens enforcement. For cross-border protection, explore the Madrid System for trademarks and rely on the Berne framework for copyright, and seek tailored advice before filing.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'WIPO, Madrid System for the International Registration of Marks', url: 'https://www.wipo.int/en/web/madrid-system' },
      { label: 'USPTO, Trademark basics', url: 'https://www.uspto.gov/trademarks/basics' },
      { label: 'Berne Convention for the Protection of Literary and Artistic Works', url: 'https://www.wipo.int/en/web/treaties/ip/berne/index' },
      { label: 'India, Trade Marks Act 1999 and Copyright Act 1957' },
    ],
  },
  {
    id: 'ti-002',
    title: 'Data Privacy Law Basics: How Personal Data Is Protected',
    slug: 'data-privacy-law-basics',
    alphabet: 'D',
    categoryId: 'cat_technology_ip',
    subcategoryId: 'sub_ti_privacy',
    category: technologyIpCategory,
    subcategory: { id: 'sub_ti_privacy', name: 'Data Privacy', slug: 'data-privacy' },
    summary:
      'Modern data privacy laws give individuals rights over their personal information and impose duties on the organizations that collect and use it.',
    author: 'Marcus Hale',
    updatedAt: 'January 28, 2026',
    readingTime: 10,
    views: 5310,
    featured: false,
    imageSeed: 'data-privacy-basics',
    content: `<p>Almost every digital interaction generates personal data — names, email addresses, location history, browsing behavior, and more. Over the past decade, a wave of data privacy laws has reshaped how organizations may collect and use that information. While the details differ by country, most modern frameworks share a common set of principles built around transparency, consent, and individual control.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Data privacy laws regulate how organizations collect, store, use, and share personal data about identifiable individuals.</li><li>Common principles include lawful basis for processing, purpose limitation, data minimization, accuracy, and security.</li><li>Many laws give individuals rights to access, correct, delete, and port their data, and to object to certain uses.</li><li>Frameworks such as the EU&apos;s GDPR have influenced privacy laws worldwide, including in India, Brazil, and many other jurisdictions.</li></ul></div>

<h2>What Counts as Personal Data</h2>
<p>Personal data is generally any information relating to an identified or identifiable person. That covers obvious identifiers like a name or national ID number, but also things such as IP addresses, device identifiers, and location data when they can be linked back to an individual. Many laws give extra protection to sensitive categories — health, biometric, religious, or financial data — which require stronger justification to process.</p>

<h2>Core Principles of Modern Privacy Law</h2>
<p>GDPR-style frameworks are built on a recognizable set of principles that recur across jurisdictions. Organizations are expected to apply all of them together, not pick and choose.</p>
<ul><li><strong>Lawfulness and transparency:</strong> there must be a valid legal basis, such as consent or legitimate interest, and people must be told how their data is used.</li><li><strong>Purpose limitation:</strong> data collected for one purpose should not be quietly repurposed for an unrelated one.</li><li><strong>Data minimization:</strong> collect only what is genuinely needed for the stated purpose.</li><li><strong>Accuracy and storage limits:</strong> keep data correct and do not retain it longer than necessary.</li><li><strong>Security:</strong> protect data with appropriate technical and organizational safeguards.</li></ul>

<h2>Individual Rights</h2>
<p>A defining feature of contemporary privacy law is the package of rights it grants to individuals, often called data subjects. These rights shift some control back to the people the data describes.</p>
<h3>Common Data Subject Rights</h3>
<ul><li>The right to access a copy of the data held about them</li><li>The right to correct inaccurate information</li><li>The right to erasure, sometimes called the right to be forgotten</li><li>The right to data portability and to object to certain processing</li></ul>

<h2>Obligations on Organizations</h2>
<p>Businesses that handle personal data carry corresponding duties. They typically must maintain clear privacy notices, honor data subject requests within set timeframes, and keep records of their processing activities. Many frameworks require reporting serious data breaches to a regulator, and sometimes to affected individuals, within a short window. Transfers of data across borders may also be restricted unless adequate safeguards are in place.</p>

<h2>Jurisdictional Variation</h2>
<p>The EU&apos;s General Data Protection Regulation set a widely copied template, but it is not universal. India&apos;s framework, Brazil&apos;s LGPD, and various other national and state laws each have their own definitions, thresholds, and enforcement bodies. Some laws apply extraterritorially, reaching organizations abroad that target or monitor people within the jurisdiction. Penalties range from corrective orders to substantial fines, so the same data practice can carry very different legal risk depending on where the affected people are.</p>

<h2>Data Breach Notification Duties</h2>
<p>A significant portion of modern privacy law is dedicated specifically to what happens after something goes wrong. Most frameworks impose a strict, short deadline — commonly 72 hours under GDPR-style rules — for notifying a data protection regulator once an organization becomes aware of a breach likely to risk individuals' rights, and separately require notifying the affected individuals themselves where the risk is high. Failing to detect or report a breach promptly is frequently treated as seriously as the breach itself, since regulators view timely notification as essential to letting affected people take protective steps (changing passwords, watching for fraud) quickly. Organizations are increasingly expected to have an incident-response plan ready before a breach happens, not improvised during one, since the notification clock typically starts running immediately upon discovery.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Does data privacy law apply to a small business, or only large companies?</strong> Most frameworks apply regardless of size, though some include reduced obligations or exemptions for very small organizations processing limited data — assuming privacy law "doesn't apply to us" because a business is small is a common and risky misconception.</p>
<p><strong>Can I be forced to delete data if a customer asks?</strong> Generally yes, under a "right to erasure," but this right is not absolute — an organization can often retain data where there's a legal obligation to keep it (tax records, for instance) or another overriding legitimate interest, so the request must be assessed rather than automatically granted or refused.</p>
<p><strong>Do cookies and website tracking count as personal data?</strong> Frequently yes — many privacy frameworks treat persistent identifiers like cookies and device fingerprints as personal data when they can be linked to an individual's behavior, which is why cookie-consent banners have become near-universal on websites serving regulated jurisdictions.</p>
<p><strong>Can I be held personally liable as a business owner for a privacy violation?</strong> In cases of serious, knowing non-compliance, some frameworks do allow regulators to pursue individual officers or directors in addition to the organization itself, particularly where governance failures were deliberate or grossly negligent rather than an isolated honest mistake.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>EU General Data Protection Regulation (GDPR), full text and guidance</li>
<li>India, Digital Personal Data Protection Act 2023</li>
<li>Brazil, Lei Geral de Proteção de Dados (LGPD)</li>
<li>U.S. state privacy laws (e.g., California Consumer Privacy Act) comparative guidance</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If your organization handles personal data, start by mapping what you collect, why, and where it flows. Identify a lawful basis for each use, publish a clear privacy notice, build a process for handling individual rights requests, and confirm your security and breach-response measures. Because obligations vary by jurisdiction and evolve quickly, treat privacy compliance as an ongoing program and seek qualified advice for cross-border operations.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Regulation (EU) 2016/679 (General Data Protection Regulation)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' },
      { label: 'India, Digital Personal Data Protection Act 2023', url: 'https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf' },
      { label: 'Brazil, Lei Geral de Proteção de Dados (Law No. 13,709/2018)', url: 'https://www.gov.br/anpd/pt-br/centrais-de-conteudo/outros-documentos-e-publicacoes-institucionais/lgpd-en-lei-no-13-709-capa.pdf' },
      { label: 'California Attorney General, California Consumer Privacy Act', url: 'https://oag.ca.gov/privacy/ccpa' },
    ],
  },
];
