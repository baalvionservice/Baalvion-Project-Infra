import type { LawArticle } from '../law-content';

const technologyIpCategory = {
  id: 'cat_technology_ip',
  name: 'Technology & IP',
  slug: 'technology-ip',
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

<h2>Practical Next Steps</h2>
<p>Identify which asset you are trying to protect: if it is a brand name or logo, focus on trademark registration in the markets where you operate; if it is creative content, document authorship and consider voluntary copyright registration where it strengthens enforcement. For cross-border protection, explore the Madrid System for trademarks and rely on the Berne framework for copyright, and seek tailored advice before filing.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
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

<h2>Practical Next Steps</h2>
<p>If your organization handles personal data, start by mapping what you collect, why, and where it flows. Identify a lawful basis for each use, publish a clear privacy notice, build a process for handling individual rights requests, and confirm your security and breach-response measures. Because obligations vary by jurisdiction and evolve quickly, treat privacy compliance as an ongoing program and seek qualified advice for cross-border operations.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
