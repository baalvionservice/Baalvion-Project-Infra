import type { LawArticle } from '../law-content';

export const sportsNewsArticles: LawArticle[] = [
  {
    id: 'sports-001',
    title: 'NBA Collective Bargaining Agreement: Second Apron Luxury Tax Rules & Free Agency Mechanics',
    slug: 'nba-collective-bargaining-agreement-second-apron-luxury-tax-rules',
    alphabet: 'N',
    categoryId: 'sports',
    subcategoryId: 'league-governance',
    category: { id: 'sports', name: 'Sports', slug: 'sports' },
    subcategory: { id: 'league-governance', name: 'League Governance', slug: 'league-governance' },
    summary:
      'Detailed legal breakdown of the NBA CBA Second Apron roster building restrictions, trade freeze penalties, and player salary cap growth models.',
    content: `
      <h2>The Second Apron Roster Construction Restraints</h2>
      <p>The NBA's latest Collective Bargaining Agreement introduced severe transactional penalties for teams crossing the Second Luxury Tax Apron, including loss of the Mid-Level Exception and restrictions on aggregating salaries in trades.</p>
    `,
    author: 'Marcus Vance',
    updatedAt: 'September 15, 2026',
    readingTime: 6,
    views: 0,
    featured: true,
    imageSeed: 'nba-cba-sports-law',
  },
  {
    id: 'sports-002',
    title: 'Court of Arbitration for Sport (CAS) Appeals & Olympic Eligibility Rulings',
    slug: 'court-of-arbitration-for-sport-cas-appeals-olympic-eligibility',
    alphabet: 'C',
    categoryId: 'sports',
    subcategoryId: 'olympic-arbitration',
    category: { id: 'sports', name: 'Sports', slug: 'sports' },
    subcategory: { id: 'olympic-arbitration', name: 'Olympic Arbitration', slug: 'olympic-arbitration' },
    summary:
      'How the CAS ad hoc Division handles disputes that arise during the Olympic Games, including its 24-hour decision rule.',
    content: `
      <h2>The CAS ad hoc Division</h2>
      <p>For each Olympic Games the Court of Arbitration for Sport (CAS) operates an ad hoc Division. Its Arbitration Rules for the Olympic Games apply to disputes covered by Rule 61 of the Olympic Charter that arise during the Games or in the ten days before the Opening Ceremony.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Article 18 of the rules says the Panel “shall give a decision within 24 hours of the lodging of the application.”</li>
          <li>In exceptional cases the President of the ad hoc Division may extend that time limit if circumstances require.</li>
          <li>The 24-hour rule belongs to the ad hoc Division. Ordinary CAS proceedings outside the Games follow different rules and timelines.</li>
        </ul>
      </div>
    
    `,
    author: 'Sarah Jenkins',
    updatedAt: 'September 14, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 7,
    views: 0,
    featured: true,
    imageSeed: 'cas-olympic-arbitration',
    primarySources: [
      { label: 'CAS: Arbitration Rules for the Olympic Games (Art. 1 and Art. 18)', url: 'https://www.tas-cas.org/generated/assets/pages/ad-hoc-division/CAS_Arbitration_Rules_Olympic_Games.pdf' },
      { label: 'CAS: Ad hoc Division', url: 'https://www.tas-cas.org/en/arbitration/ad-hoc-division' },
    ],
  },
];
