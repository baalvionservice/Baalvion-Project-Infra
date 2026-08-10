/**
 * Categories created directly in the CMS (not part of the original 8 bundled
 * practice areas in docs/seed-data.json, and not in law-service's /categories
 * API). Shared by src/app/[categorySlug]/page.tsx (masthead H1/description +
 * JSON-LD) and src/app/[categorySlug]/layout.tsx (generateMetadata fallback
 * when law-service doesn't know the category), so a hub's name/description/
 * SEO title only need to be defined once.
 *
 * `pillarTitle`/`metaTitle`/`metaDescription` are optional overrides for a hub
 * that also serves as a written pillar/"Complete Guide" page at its own URL
 * (currently only maritime-offshore-injury-law) -- everywhere else falls back
 * to `name`/`description`.
 */
export interface CmsOnlyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Rendered as HTML in the masthead when present (pillar hub content). */
  descriptionHtml?: string;
  pillarTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const CMS_ONLY_CATEGORIES: Record<string, CmsOnlyCategory> = {
  'maritime-offshore-injury-law': {
    id: 'cms-cat-maritime-offshore-injury-law',
    name: 'Maritime & Offshore Injury Law',
    slug: 'maritime-offshore-injury-law',
    description: 'Guides covering maritime and offshore injury law, including the Jones Act, LHWCA, OCSLA, and general maritime law claims.',
    pillarTitle: "Maritime & Offshore Injury Law: Complete Guide",
    metaTitle: "Maritime & Offshore Injury Law: Complete Guide",
    metaDescription: 'A complete guide to maritime and offshore injury law -- the Jones Act, general maritime law, LHWCA, and OCSLA -- covering who these laws protect, how claims work, and where to find related guides.',
    descriptionHtml: `
<p>Workers and others injured on navigable waters or in connection with maritime and offshore activity are often governed by a distinct body of federal law rather than the ordinary state workers' compensation or negligence rules that apply to most land-based jobs. This hub is a starting point for understanding that body of law -- who it covers, which statutes and doctrines typically apply, and how a maritime or offshore injury claim generally differs from a standard personal injury case. It is general legal information, not legal advice about any specific injury.</p>

<h2>The Main Sources of Maritime & Offshore Injury Law</h2>
<p>Several distinct federal frameworks can apply to a maritime or offshore injury, often depending on the injured person's job, the location of the accident, and the type of vessel or structure involved:</p>
<ul>
<li><strong>The Jones Act</strong> (46 U.S.C. &sect; 30104) &mdash; gives an injured "seaman" the right to sue their employer for negligence, unlike most land-based employees who are limited to workers' compensation. See our guide to <a href="/jones-act-seamans-injury-rights">Jones Act &amp; seaman's injury rights</a>.</li>
<li><strong>General maritime law</strong> &mdash; a body of federal common law covering doctrines such as unseaworthiness and maintenance and cure, which can apply alongside or instead of the Jones Act. See <a href="/jones-act-vs-general-maritime-law">Jones Act vs. general maritime law</a> and <a href="/maintenance-and-cure-explained">maintenance and cure explained</a>.</li>
<li><strong>The Longshore and Harbor Workers' Compensation Act (LHWCA)</strong> (33 U.S.C. &sect; 901 et seq.) &mdash; a federal workers' compensation system for maritime workers who are not seamen, such as many longshore and harbor workers injured on or near navigable waters.</li>
<li><strong>The Outer Continental Shelf Lands Act (OCSLA)</strong> (43 U.S.C. &sect; 1331 et seq.) &mdash; extends certain federal law, including in many cases the LHWCA, to workers injured on fixed offshore platforms on the Outer Continental Shelf, such as many oil and gas installations.</li>
</ul>
<p>Which of these frameworks applies -- and sometimes more than one can be relevant to the same injury -- depends heavily on facts like the injured person's job duties and connection to a vessel, where the accident happened, and what kind of structure or vessel was involved. That threshold question is often one of the first things an offshore injury lawyer evaluates.</p>

<h2>Who This Area of Law Covers</h2>
<p>Maritime and offshore injury law can potentially apply to commercial vessel crew members, offshore oil and gas workers, dockworkers and longshore workers, harbor workers, and others whose work has a substantial connection to navigable waters or traditional maritime activity. Guides throughout this hub address specific roles and accident types in more depth, including <a href="/oil-rig-injury-lawyer">offshore drilling and oil rig injuries</a> and <a href="/houston-offshore-accident-attorney">region-specific guidance for the Gulf Coast</a>.</p>

<h2>How These Claims Differ From a Typical Injury Case</h2>
<p>Maritime and offshore injury claims often follow different rules than a standard car accident or slip-and-fall case: different deadlines, different available benefits (such as <a href="/maintenance-and-cure-explained">maintenance and cure</a>), different standards of liability, and, in some cases, different courts. Our guides on <a href="/offshore-injury-settlement-value">how offshore settlements are calculated</a>, <a href="/causes-of-offshore-oil-rig-accidents">common causes of offshore accidents</a>, and <a href="/offshore-accident-statute-of-limitations">applicable filing deadlines</a> go into these differences in more detail.</p>

<h2>Explore This Hub</h2>
<p>The guides below cover offshore and maritime injury lawyers, oil rig accidents, Jones Act claims, and the process and deadlines involved in these cases. For related passenger-vessel and cruise ship injury topics, see the <a href="/cruise-ship-passenger-vessel-accidents">Cruise Ship &amp; Passenger Vessel Accidents</a> hub. For general personal injury topics that apply across practice areas -- contingency fees, choosing a lawyer, and the statute of limitations generally -- see <a href="/what-is-a-personal-injury-lawyer">What Is a Personal Injury Lawyer?</a> and the related guides linked from it.</p>

<p><em>This page provides general legal information about maritime and offshore injury law and does not constitute legal advice for any specific situation. Laws and their application vary by jurisdiction and by the specific facts involved.</em></p>
`.trim(),
  },
  'cruise-ship-passenger-vessel-accidents': {
    id: 'cms-cat-cruise-ship-passenger-vessel-accidents',
    name: 'Cruise Ship & Passenger Vessel Accidents',
    slug: 'cruise-ship-passenger-vessel-accidents',
    description: 'Guides covering cruise ship and passenger vessel accident claims, including passenger injuries, cruise ticket contracts, and maritime law issues specific to cruise travel.',
  },
  'personal-injury-lawyer': {
    id: 'cms-cat-personal-injury-lawyer',
    name: 'Personal Injury Lawyer',
    slug: 'personal-injury-lawyer',
    description: 'Educational guides on personal injury law, including what personal injury lawyers do, how contingency fees and legal costs work, how to choose and work with an attorney, statutes of limitations, free legal aid resources, and maritime and accident-law terminology.',
  },
  'boating-accidents': {
    id: 'cms-cat-boating-accidents',
    name: 'Boating Accidents',
    slug: 'boating-accidents',
    description: 'Guides covering boating accident claims, including liability, insurance, statutes of limitations, and what to do after an accident on the water.',
  },
  'car-accidents': {
    id: 'cms-cat-car-accidents',
    name: 'Car Accidents',
    slug: 'car-accidents',
    description: 'Guides covering car accident claims, including how car accident lawyers work and how to choose one.',
  },
  'us-law-and-constitution': {
    id: 'cms-cat-us-law-and-constitution',
    name: 'U.S. Law & Constitution',
    slug: 'us-law-and-constitution',
    description: 'Explainers on how the U.S. Constitution, federal lawmaking, and the broader American legal system work.',
  },
  'religion-law-and-weird-laws': {
    id: 'cms-cat-religion-law-and-weird-laws',
    name: 'Religion, Law & Weird Laws',
    slug: 'religion-law-and-weird-laws',
    description: 'Guides on religious law in the U.S. legal system, plus a look at unusual and rarely enforced state and local laws.',
  },
  'legal-education-and-history': {
    id: 'cms-cat-legal-education-and-history',
    name: 'Legal Education & History',
    slug: 'legal-education-and-history',
    description: 'Guides on U.S. legal education and the history of American law enforcement and legal institutions.',
  },
};
