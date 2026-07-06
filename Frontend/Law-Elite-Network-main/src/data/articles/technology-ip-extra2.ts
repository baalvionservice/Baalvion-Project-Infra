import type { LawArticle } from '../law-content';

const TECHNOLOGY_IP_CATEGORY = {
  id: 'cat_technology_ip',
  name: 'Technology & IP',
  slug: 'technology-ip',
};

export const technologyIpExtra2Articles: LawArticle[] = [
  {
    id: 'ti-201',
    title: 'What Is a Patent and How Do You Get One?',
    slug: 'what-is-a-patent-and-how-to-get-one',
    alphabet: 'W',
    categoryId: 'cat_technology_ip',
    subcategoryId: 'sub_ti_trademark',
    category: TECHNOLOGY_IP_CATEGORY,
    subcategory: { id: 'sub_ti_trademark', name: 'Trademarks', slug: 'trademarks' },
    summary:
      'A patent gives an inventor a time-limited monopoly over a new invention in exchange for publicly disclosing how it works — but only if it is new, useful, and non-obvious.',
    author: 'Aisha Rahman',
    updatedAt: 'June 24, 2026',
    readingTime: 10,
    views: 7910,
    featured: true,
    imageSeed: 'patent-invention-protection',
    content: `<p>A patent is a legal right that gives an inventor exclusive control over a new invention for a limited period — usually around twenty years — in return for publicly disclosing how the invention works. During that time, no one else may make, use, or sell the patented invention without permission. The bargain at the heart of the system is simple: society grants a temporary monopoly to reward and encourage innovation, and in exchange the inventor teaches the public how the invention works, so that knowledge eventually becomes free for everyone to build on.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A patent grants a time-limited monopoly over an invention in exchange for public disclosure.</li><li>To qualify, an invention must generally be new, useful, and non-obvious.</li><li>Patents are territorial — a patent in one country gives no protection in another.</li><li>The process involves filing a detailed application and examination by a patent office.</li><li>Costs, timelines, and what can be patented vary by jurisdiction.</li></ul></div>

<h2>What a Patent Protects</h2>
<p>Patents protect inventions — new products, processes, machines, or improvements to them. They are different from other intellectual property: trademarks protect brand identifiers, and copyright protects creative works, while patents protect functional, technical innovations. Not everything can be patented. Abstract ideas, natural phenomena, and (in many systems) certain software or business methods may be excluded or heavily restricted, and the rules differ from country to country.</p>

<h2>The Three Core Requirements</h2>
<h3>Novelty</h3>
<p>The invention must be new — not already disclosed to the public anywhere in the world before the filing date. Even the inventor's own public demonstration or sale can destroy novelty, which is why secrecy before filing is so important.</p>
<h3>Inventive Step (Non-Obviousness)</h3>
<p>The invention must not be an obvious development to someone skilled in the relevant field. A trivial tweak to an existing product usually will not qualify.</p>
<h3>Industrial Application (Usefulness)</h3>
<p>The invention must be capable of being made or used in some kind of industry — it must actually work and have a practical purpose.</p>

<h2>How to Get a Patent</h2>
<p>Securing a patent is a structured, often lengthy process:</p>
<ol>
<li><strong>Search:</strong> check existing patents and publications ("prior art") to gauge whether your invention is genuinely new.</li>
<li><strong>Prepare the application:</strong> draft a detailed specification describing the invention and "claims" that precisely define the legal boundaries of protection.</li>
<li><strong>File:</strong> submit the application to the relevant patent office, establishing your filing date.</li>
<li><strong>Examination:</strong> an examiner reviews the application against the legal requirements, often raising objections that must be answered.</li>
<li><strong>Grant and maintenance:</strong> if successful, the patent is granted, after which renewal fees must be paid to keep it in force.</li>
</ol>
<p>The claims are the most important part: they define exactly what is protected, and poorly drafted claims can leave an invention easy to copy or vulnerable to challenge.</p>

<h2>Patents Are Territorial</h2>
<p>A crucial and often misunderstood point is that patents only protect you in the countries where they are granted. A patent in one nation gives no rights elsewhere. Inventors seeking international protection must file in each country or region of interest, often using international filing systems that streamline the early stages while still requiring eventual national applications. This makes broad protection expensive, so inventors usually focus on key markets.</p>

<h2>How Patent Systems Differ</h2>
<ul>
<li><strong>United States:</strong> The patent office grants utility, design, and plant patents; the system uses a "first-inventor-to-file" approach with a limited grace period for the inventor's own disclosures.</li>
<li><strong>United Kingdom:</strong> Patents are granted nationally and via the European route, with strict novelty requirements and no general grace period.</li>
<li><strong>European Union:</strong> Protection is available through national offices, the European Patent Office, and the Unitary Patent system covering participating states.</li>
<li><strong>India:</strong> The patent office grants patents under its own act, with specific exclusions and a strong emphasis on examination.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Publicly disclosing or selling the invention before filing, destroying novelty.</li>
<li>Assuming one country's patent protects you worldwide.</li>
<li>Writing weak or narrow claims that are easy to design around.</li>
<li>Underestimating the cost and time of obtaining and maintaining patents in multiple countries.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you have an invention worth protecting, keep it confidential and document its development before doing anything public. Carry out a prior-art search to test whether it is genuinely new, and decide which markets actually matter to you. Because the claims and procedure are technical and the stakes are high, working with a qualified patent attorney or agent — ideally before any public disclosure — is one of the most valuable investments an inventor can make.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
