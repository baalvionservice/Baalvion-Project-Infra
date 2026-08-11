/**
 * Written jurisdiction-overview content for the /countries/[country] hubs.
 *
 * Only covers countries this task actually researched and wrote real content
 * for (see PR description) -- NOT every entry in COUNTRIES (@/data/countries).
 * A country with no profile here just renders the plain article grid /
 * empty state in src/app/countries/[country]/page.tsx, same as before.
 *
 * Every legal claim below is either a well-established, verifiable structural
 * fact about the jurisdiction (constitution date, court names, code names) or
 * phrased as general orientation rather than a definitive statement of current
 * law -- see CLAUDE.md's "Source Accuracy" rule for this content pass.
 */
export interface CountryProfile {
  /** Rendered as HTML above the article grid, matching the prose-legal styling used for practice-area hubs. */
  introHtml: string;
}

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  canada: {
    introHtml: `
<p>Canada is a federal parliamentary democracy with a legal system that is mostly common law, inherited from England, except in Quebec, where private law (contracts, property, family law) follows a civil-law tradition set out in the Civil Code of Québec. Criminal law, by contrast, is a matter of exclusive federal jurisdiction and applies uniformly across every province and territory under the Criminal Code. This overview explains how the Canadian legal system is organized; it is general information, not legal advice about any specific situation.</p>

<h2>Constitutional Framework</h2>
<p>Canada's constitution is not a single document. The Constitution Act, 1867 (originally the British North America Act) created the federation and divided law-making powers between the federal Parliament and the provincial legislatures. The Constitution Act, 1982 patriated the constitution from the UK and added the Canadian Charter of Rights and Freedoms, which guarantees fundamental rights — including, as our guide on <a href="/criminal-law/charter-rights-on-arrest-canada">Charter rights on arrest</a> explains, the right to know why you're being detained and to retain counsel without delay — subject to "reasonable limits... demonstrably justified in a free and democratic society" under section 1, and to Parliament or a legislature's power to override certain rights for a renewable five-year term under the notwithstanding clause (section 33).</p>

<h2>Courts and the Legal Hierarchy</h2>
<p>Canada has a single, integrated court system rather than separate federal and state hierarchies. Provincial and territorial courts handle most criminal and civil matters at first instance; provincial superior courts hear more serious matters and appeals from lower courts; provincial courts of appeal sit above them; and the Supreme Court of Canada, in Ottawa, is the final court of appeal for every legal question in the country, including constitutional and Charter questions. Federal matters such as immigration, tax, and intellectual property also have their own Federal Court and Federal Court of Appeal.</p>

<h2>Federal vs. Provincial Law</h2>
<p>Because Canada divides authority between the federal government and ten provinces (plus three territories), the same general legal topic can be governed differently depending on where you are. Employment standards, non-compete enforceability, and incorporation rules, for example, all vary by province — see our guides on <a href="/employment-law/ontario-non-compete-ban-vs-rest-of-canada">Ontario's non-compete ban versus the rest of Canada</a> and <a href="/business/federal-vs-provincial-incorporation-canada">federal vs. provincial incorporation</a> for concrete examples of how that split plays out in practice.</p>

<h2>Key Legal Terminology</h2>
<p><strong>Common law</strong> — judge-made law built from prior court decisions, the basis for most Canadian law outside Quebec. <strong>Civil law (Quebec)</strong> — a codified system based on the Civil Code of Québec, distinct from the rest of Canada. <strong>The Crown</strong> — the formal legal personification of the state in criminal prosecutions and government action. <strong>Charter rights</strong> — the constitutional rights and freedoms set out in the Canadian Charter of Rights and Freedoms.</p>

<h2>Explore Related Legal Guides</h2>
<p>The guides below are LawEliteNetwork's current Canada-specific coverage, spanning business formation, employment, tax, and criminal procedure.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://laws-lois.justice.gc.ca/eng/" target="_blank" rel="noopener noreferrer">Justice Laws Website (Department of Justice Canada)</a> — the official consolidated text of federal statutes and regulations.</li>
<li><a href="https://www.scc-csc.ca/" target="_blank" rel="noopener noreferrer">Supreme Court of Canada</a> — judgments and information on Canada's final court of appeal.</li>
<li><a href="https://www.canlii.org/" target="_blank" rel="noopener noreferrer">CanLII</a> — free public access to Canadian court and tribunal decisions from every jurisdiction.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general information about the Canadian legal system and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },

  india: {
    introHtml: `
<p>India has a common-law legal system, shaped by more than a century of British colonial administration and substantially developed since independence in 1947 through its own Constitution, courts, and legislation. It combines a written constitution and an independent judiciary with, for personal matters like marriage, divorce, and inheritance, a set of personal laws that can differ by religious community. This overview explains the framework in general terms; it is not legal advice.</p>

<h2>Constitutional and Judicial Framework</h2>
<p>The Constitution of India, adopted in 1950, is the longest written constitution of any country and establishes India as a sovereign, socialist, secular, democratic republic with a parliamentary system of government. The Supreme Court of India, seated in New Delhi, is the final court of appeal and has original jurisdiction over constitutional disputes between the central government and the states. Below it sit 25 High Courts, one or more per state, and a hierarchy of district and subordinate courts that handle most civil and criminal matters at first instance.</p>

<h2>Federal Structure and Areas of Law</h2>
<p>India is a union of states and territories, and the Constitution's Seventh Schedule divides legislative authority between the central Parliament (the Union List), state legislatures (the State List), and areas both can legislate on (the Concurrent List). Major codified statutes apply nationally — including the Bharatiya Nyaya Sanhita, which replaced the colonial-era Indian Penal Code on 1 July 2024 as part of a broader overhaul of India's criminal statutes, and the Indian Contract Act, 1872 — while states retain authority over subjects like land, police, and aspects of civil procedure.</p>

<h2>Personal Law</h2>
<p>Family matters — marriage, divorce, adoption, and inheritance — are governed in part by separate personal-law systems tied to religious community (Hindu, Muslim, Christian, and Parsi personal laws each have their own statutory basis), alongside the secular Special Marriage Act, 1954 for couples who choose it. This is one of the more distinctive features of the Indian legal system compared to most other common-law jurisdictions.</p>

<h2>Guides for This Jurisdiction</h2>
<p>LawEliteNetwork does not yet have India-specific legal guides published. We're building out jurisdiction-specific coverage over time; check back, or explore our general <a href="/business">Business &amp; Corporate</a>, <a href="/tax-finance">Tax &amp; Finance</a>, and <a href="/tech-ip">Technology &amp; IP</a> hubs, which cover concepts that apply broadly but are not India-specific.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.indiacode.nic.in/" target="_blank" rel="noopener noreferrer">India Code (Ministry of Law and Justice)</a> — the official digital repository of central and state legislation.</li>
<li><a href="https://www.sci.gov.in/" target="_blank" rel="noopener noreferrer">Supreme Court of India</a> — official case information and judgments.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general information about India's legal system and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },

  singapore: {
    introHtml: `
<p>Singapore is a city-state with a legal system built on English common law, adapted and developed independently since it became a sovereign republic on 9 August 1965. Its Constitution — made up of the Constitution of the State of Singapore 1963, the Republic of Singapore Independence Act 1965, and provisions carried over from the Malaysian Federal Constitution — is the supreme law of the land and establishes a unitary, Westminster-style parliamentary government. This overview is general information about how Singapore's legal system is organized; it is not legal advice.</p>

<h2>Courts and Legal Institutions</h2>
<p>The Singapore judiciary is headed by the Chief Justice and consists of the Supreme Court (comprising the Court of Appeal and the High Court) and the State Courts, which handle the large majority of civil and criminal cases filed each year. The Attorney-General's Chambers both prosecutes criminal matters on behalf of the state and, through its Legislation Division, maintains Singapore Statutes Online, the free public database of Singapore's laws. The Ministry of Law oversees the broader legal sector, including legal-profession regulation and law reform.</p>

<h2>Common Law With Local Codification</h2>
<p>Like other common-law jurisdictions, Singapore relies heavily on judicial precedent, but Parliament has also codified large areas of law by statute — including company law and criminal law under the Penal Code — and the courts have developed a body of case law that is distinctly Singaporean rather than simply following English precedent, particularly since the Application of English Law Act 1993 clarified which English law still applies locally.</p>

<h2>Notable Areas of Law</h2>
<p>Singapore is widely used as a regional hub for international arbitration and cross-border commercial disputes, supported by institutions like the Singapore International Arbitration Centre, and its intellectual property and data protection frameworks — including the Personal Data Protection Act — are frequently referenced by businesses operating across Southeast Asia.</p>

<h2>Guides for This Jurisdiction</h2>
<p>LawEliteNetwork does not yet have Singapore-specific legal guides published. We're building out jurisdiction-specific coverage over time; check back, or explore our general <a href="/business">Business &amp; Corporate</a>, <a href="/tech-ip">Technology &amp; IP</a>, and <a href="/disputes">Dispute Resolution</a> hubs for concepts that apply broadly but are not Singapore-specific.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://sso.agc.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Statutes Online (Attorney-General's Chambers)</a> — free public access to Singapore legislation.</li>
<li><a href="https://www.judiciary.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Courts (Judiciary)</a> — official information on the Supreme Court and State Courts.</li>
<li><a href="https://www.mlaw.gov.sg/" target="_blank" rel="noopener noreferrer">Ministry of Law, Singapore</a> — legal-sector policy and regulation.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general information about Singapore's legal system and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },

  germany: {
    introHtml: `
<p>Germany has a civil-law legal system, meaning its law is primarily based on comprehensively written codes rather than judicial precedent, though decisions from its highest federal courts carry substantial practical authority. The core of German private law is the Bürgerliches Gesetzbuch (BGB), the Civil Code that took effect in 1900, while the Grundgesetz (Basic Law), adopted in 1949 and extended nationwide after reunification in 1990, functions as Germany's constitution. This overview is general information about how the German legal system is organized; it is not legal advice.</p>

<h2>Constitutional Framework</h2>
<p>The Grundgesetz establishes Germany as a federal, democratic, and social state, guarantees fundamental rights in its first nineteen articles, and creates an "eternity clause" (Article 79(3)) placing human dignity and the basic democratic order beyond the reach of constitutional amendment. The Bundesverfassungsgericht (Federal Constitutional Court), based in Karlsruhe, is the guardian of the Basic Law — it rules on the constitutionality of laws and hears individual constitutional complaints, and its decisions bind every other branch of government.</p>

<h2>Court Structure</h2>
<p>Germany's court system is organized into five separate branches, each with its own supreme federal court: ordinary courts (civil and criminal law), topped by the Bundesgerichtshof (Federal Court of Justice); administrative courts; tax courts; labor courts; and social courts. The Federal Constitutional Court sits outside this structure — it is not an appellate court for the other five and generally only hears a case once a party has shown a specific fundamental right was violated.</p>

<h2>The Civil Code (BGB)</h2>
<p>The BGB organizes private law into five books — general provisions, the law of obligations (contracts and torts), property law, family law, and the law of succession — and this codified structure is why German legal analysis tends to start from a statute's text and its systematic place within the code, rather than from a line of prior cases the way common-law analysis typically does.</p>

<h2>Guides for This Jurisdiction</h2>
<p>LawEliteNetwork does not yet have Germany-specific legal guides published. We're building out jurisdiction-specific coverage over time; check back, or explore our general <a href="/tech-ip">Technology &amp; IP</a> hub, which already covers <a href="/tech-ip/uk-gdpr-vs-eu-gdpr">EU data protection law</a> relevant to businesses operating in Germany, though not German law specifically.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.gesetze-im-internet.de/" target="_blank" rel="noopener noreferrer">Gesetze im Internet (Federal Ministry of Justice)</a> — free access to the consolidated text of federal statutes, including English translations of key codes.</li>
<li><a href="https://www.bundesverfassungsgericht.de/" target="_blank" rel="noopener noreferrer">Bundesverfassungsgericht (Federal Constitutional Court)</a> — official decisions and information on constitutional review.</li>
<li><a href="https://www.bmj.de/" target="_blank" rel="noopener noreferrer">Bundesministerium der Justiz (Federal Ministry of Justice)</a>.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general information about Germany's legal system and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },

  uae: {
    introHtml: `
<p>The United Arab Emirates operates a dual legal system that combines civil-law codes — influenced by Egyptian and French legal traditions — with Islamic Sharia principles, applied primarily to personal-status matters. It is a federation of seven emirates, each retaining significant legal autonomy alongside federal law that applies nationwide. This overview is general information about how the UAE legal system is organized; it is not legal advice.</p>

<h2>Federal and Emirate-Level Courts</h2>
<p>The UAE has a dual judicial structure: a Federal Judiciary that applies federal law across most of the country, and separate local court systems in emirates that have opted to retain their own judiciary rather than join the federal system — most notably Dubai and Ras Al Khaimah, which operate independent local courts alongside the federal structure. Federal law and each emirate's local law can therefore differ on matters within local competence.</p>

<h2>Civil Law and Sharia Together</h2>
<p>Civil and commercial transactions — contracts, companies, torts — are governed mainly by codified civil law, drawing on civil-law traditions from Egypt and France as well as regional legal harmonization. Sharia principles apply primarily to personal-status matters for Muslims, including marriage, divorce, inheritance, and child custody, while non-Muslim residents' personal-status matters can, in many cases, be handled under separate frameworks.</p>

<h2>Free Zone Courts: The DIFC</h2>
<p>Since 2004, the Dubai International Financial Centre (DIFC) — a financial free zone — has operated its own common-law courts, the DIFC Courts, which conduct proceedings in English and apply common-law principles largely independent of the UAE's civil-law system for civil and commercial matters within the zone. This makes the DIFC a distinct legal environment from the rest of Dubai and the UAE, and is one of the more commercially significant features of the UAE's legal landscape for international business.</p>

<h2>Guides for This Jurisdiction</h2>
<p>LawEliteNetwork does not yet have UAE-specific legal guides published. We're building out jurisdiction-specific coverage over time; check back, or explore our general <a href="/business">Business &amp; Corporate</a> and <a href="/tax-finance">Tax &amp; Finance</a> hubs for concepts that apply broadly but are not UAE-specific.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://uaelegislation.gov.ae/" target="_blank" rel="noopener noreferrer">UAE Legislation</a> — the official federal platform for UAE laws, regulations, and executive decisions.</li>
<li><a href="https://www.moj.gov.ae/" target="_blank" rel="noopener noreferrer">Ministry of Justice, UAE</a>.</li>
<li><a href="https://u.ae/en/about-the-uae/the-uae-government/the-federal-judiciary" target="_blank" rel="noopener noreferrer">U.ae — The Federal Judiciary</a> — the official UAE government portal's overview of the federal court system.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general information about the UAE legal system and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
};

export function getCountryProfile(slug: string): CountryProfile | null {
  return COUNTRY_PROFILES[slug] ?? null;
}
