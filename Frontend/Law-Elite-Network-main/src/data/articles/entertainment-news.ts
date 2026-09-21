import type { LawArticle } from '../law-content';

export const entertainmentNewsArticles: LawArticle[] = [
  {
    id: 'ent-movies-001',
    title: 'Hollywood Studio Arbitration & SAG-AFTRA AI Likeness Rights Landmark Deal',
    slug: 'hollywood-studio-arbitration-sag-aftra-ai-likeness-rights',
    alphabet: 'H',
    categoryId: 'movies',
    subcategoryId: 'film-contracts',
    category: { id: 'movies', name: 'Movies', slug: 'movies' },
    subcategory: { id: 'film-contracts', name: 'Film Contracts & Labor', slug: 'film-contracts' },
    summary:
      'What the 2023 SAG-AFTRA TV/Theatrical contracts say about consent and compensation when a performer’s digital replica is created or used.',
    content: `
      <h2>Where the rules come from</h2>
      <p>The AI rules for film and television performers come from the 2023 SAG-AFTRA TV/Theatrical contracts, reached in collective bargaining with the studios and streamers after the 2023 strike and ratified by members in December 2023. They are contract terms, not the result of an arbitration ruling.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Producers must obtain informed consent from a performer, and pay for it, when a digital replica of that performer is created or used.</li>
          <li>Consent for a replica under the Codified Basic Agreement or TV Agreement is given per project, at the time of use.</li>
          <li>For a deceased performer, consent can come from the performer’s authorized representative or from SAG-AFTRA.</li>
          <li>Producers must notify SAG-AFTRA and bargain over compensation before using a “synthetic performer,” meaning a digitally created asset not based on a single identifiable performer.</li>
        </ul>
      </div>

      <p>These terms apply to productions by signatory producers. The union publishes guidance on them, including a “Digital Replicas 101” explainer.</p>
    
    `,
    author: 'Elena Rostova',
    updatedAt: 'September 18, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 6,
    views: 0,
    featured: true,
    imageSeed: 'movies-ai-rights',
    primarySources: [
      { label: 'SAG-AFTRA: 2023 TV/Theatrical Contracts', url: 'https://www.sagaftra.org/contracts-industry-resources/contracts/2023-tvtheatrical-contracts' },
      { label: 'SAG-AFTRA: Artificial Intelligence resources for the 2023 TV/Theatrical contracts', url: 'https://www.sagaftra.org/contracts-industry-resources/contracts/2023-tvtheatrical-contracts/artificial-intelligence-resources' },
      { label: 'SAG-AFTRA: Digital Replicas 101', url: 'https://www.sagaftra.org/sites/default/files/sa_documents/DigitalReplicas.pdf' },
    ],
  },
  {
    id: 'ent-music-001',
    title: 'Master Recording Rights & Music Publishing Valuation Disputes',
    slug: 'master-recording-rights-music-publishing-valuation-disputes',
    alphabet: 'M',
    categoryId: 'music',
    subcategoryId: 'music-catalog-law',
    category: { id: 'music', name: 'Music', slug: 'music' },
    subcategory: { id: 'music-catalog-law', name: 'Music Catalog Law', slug: 'music-catalog-law' },
    summary:
      'How recording artists navigate Section 203 copyright termination rights, master tape ownership, and streaming royalty auditing.',
    content: `
      <h2>Understanding 35-Year Copyright Termination Rights</h2>
      <p>Under Section 203 of the United States Copyright Act, recording artists can exercise statutory termination rights to reclaim ownership of master sound recordings 35 years after initial grant.</p>

      <div className="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Section 203 permits authors and recording artists to terminate catalog assignments after 35 years.</li>
          <li>Proper advance statutory notice must be served between 2 to 10 years prior to the effective termination window.</li>
          <li>Catalog re-recordings (such as Taylor Swift's Taylor's Version projects) bypass master exclusivity restrictions once contractually expired.</li>
        </ul>
      </div>

      <h2>Royalty Audits & Digital Streaming Accounting</h2>
      <p>Independent forensic audits of major record label accounting systems frequently uncover unreported international streaming revenue streams and improper deduction allocations.</p>
    `,
    author: 'Marcus Vance',
    updatedAt: 'September 15, 2026',
    readingTime: 7,
    views: 0,
    featured: true,
    imageSeed: 'music-masters-catalog',
    noindex: true,
    primarySources: [
      { label: '17 U.S. Code § 203 - Termination of Transfers and Licenses', url: 'https://www.law.cornell.edu/uscode/text/17/203' },
    ],
  },
  {
    id: 'ent-tv-001',
    title: 'Peak TV Contract Renegotiations & Writers Guild Residual Structures',
    slug: 'peak-tv-contract-renegotiations-wga-residual-structures',
    alphabet: 'P',
    categoryId: 'television',
    subcategoryId: 'broadcast-contracts',
    category: { id: 'television', name: 'Television', slug: 'television' },
    subcategory: { id: 'broadcast-contracts', name: 'Broadcast Contracts', slug: 'broadcast-contracts' },
    summary:
      'Analyzing how modern television series order formats impact writer-producer compensation, episode order minimums, and domestic syndication rights.',
    content: `
      <h2>Shifting Episode Counts & Showrunner Rights</h2>
      <p>As television orders transition from traditional 22-episode network seasons to 8-episode prestige series, entertainment attorneys negotiate revised weekly rate guarantees and overall studio deal exclusivity windows.</p>

      <h2>Syndication & International Residual Auditing</h2>
      <p>New guild formulas mandate increased transparency for foreign broadcast licensing and secondary market platform distribution fees.</p>
    `,
    author: 'Sarah Jenkins',
    updatedAt: 'September 12, 2026',
    readingTime: 5,
    views: 0,
    featured: false,
    imageSeed: 'tv-contract-residuals',
    noindex: true,
  },
  {
    id: 'ent-streaming-001',
    title: 'Streaming Platform Carriage Disputes & Global Distribution Licensing',
    slug: 'streaming-platform-carriage-disputes-global-distribution-licensing',
    alphabet: 'S',
    categoryId: 'streaming',
    subcategoryId: 'digital-distribution',
    category: { id: 'streaming', name: 'Streaming', slug: 'streaming' },
    subcategory: { id: 'digital-distribution', name: 'Digital Distribution', slug: 'digital-distribution' },
    summary:
      'Inside the complex multi-territory licensing battles between global streaming services and international content owners.',
    content: `
      <h2>Geo-Blocking & Territorial Exclusivity Clauses</h2>
      <p>Global streaming platforms navigate intricate copyright clearance regimes across 190+ jurisdictions, ensuring compliance with local content quota laws and regional distribution windows.</p>

      <h2>Windowing & Direct-to-Consumer Releases</h2>
      <p>The legal friction between theatrical window exclusivity and day-and-date digital streaming debuts continues to reshape executive compensation formulas.</p>
    `,
    author: 'David Thorne',
    updatedAt: 'September 10, 2026',
    readingTime: 6,
    views: 0,
    featured: true,
    imageSeed: 'streaming-licensing-law',
    noindex: true,
  },
  {
    id: 'ent-celeb-001',
    title: 'Page Six Legal Analysis: Defamation, Right of Publicity & Celebrity Paparazzi Litigation',
    slug: 'page-six-legal-analysis-defamation-right-of-publicity-paparazzi-litigation',
    alphabet: 'P',
    categoryId: 'celebrity-news',
    subcategoryId: 'privacy-defamation',
    category: { id: 'celebrity-news', name: 'Celebrity News', slug: 'celebrity-news' },
    subcategory: { id: 'privacy-defamation', name: 'Privacy & Defamation', slug: 'privacy-defamation' },
    summary:
      'High-stakes litigation surrounding public figure actual malice standards, photo copyright infringement claims, and privacy torts.',
    content: `
      <h2>The Public Figure Standard Under New York Times v. Sullivan</h2>
      <p>Celebrities seeking damages for defamatory press reporting must establish 'actual malice'—proving the publication published false statements with knowledge of falsity or reckless disregard for the truth.</p>

      <div className="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Public figures face a heightened burden of proof under First Amendment doctrine.</li>
          <li>Paparazzi agencies frequently file copyright infringement suits against celebrities who re-post unlicensed photos of themselves on social media.</li>
          <li>Right of publicity statutes protect individuals from unauthorized commercial endorsements.</li>
        </ul>
      </div>

      <h2>Celebrity Photo Copyright Battles</h2>
      <p>A growing trend involves photo agencies suing stars for statutory damages after celebrities share agency-owned paparazzi photographs on personal Instagram and X accounts without license clearance.</p>
    `,
    author: 'Elena Rostova',
    updatedAt: 'September 19, 2026',
    readingTime: 8,
    views: 0,
    featured: true,
    imageSeed: 'celebrity-paparazzi-copyright',
    primarySources: [
      { label: 'New York Times Co. v. Sullivan, 376 U.S. 254 (1964)', url: 'https://supreme.justia.com/cases/federal/us/376/254/' },
    ],
  },
];
