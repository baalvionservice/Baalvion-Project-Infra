/**
 * @fileOverview LEN People — bundled seed profiles for the reusable Person
 * entity (see @/types/person.ts). One real, well-documented figure per
 * category to prove the schema end-to-end, not a bulk directory yet (that's
 * later ingestion work, same "start small, scale later" approach used for
 * the network's other reference layers).
 *
 * Content-integrity rule for this file: every biographical claim below is
 * long-settled public record (birth dates/places, career milestones, known
 * works) — nothing invented, no numeric claims (award counts, follower
 * counts, box-office figures) that drift over time or could be wrong.
 * `avatarUrl` is intentionally omitted for all of them: no photo with
 * verified usage rights has been sourced yet, so every profile falls back to
 * the deterministic silhouette (@/lib/article-art.ts's resolvePersonImage)
 * rather than hotlinking an image with unknown licensing. `videos`,
 * `interviews`, and `photos` are left empty for the same reason — real data
 * or nothing, not a placeholder embed.
 */

import type { Person, PersonCategorySlug } from '@/types/person';

export const PEOPLE: Person[] = [
  {
    slug: 'tom-hanks',
    fullName: 'Thomas Jeffrey Hanks',
    displayName: 'Tom Hanks',
    category: 'actors',
    countryCode: 'US',
    biography:
      'Tom Hanks is an American actor and filmmaker known for roles spanning comedy and drama across five decades. ' +
      'He built his career-defining run in the 1990s with a string of critically and commercially successful films, and has remained one of the most recognizable leading actors in American cinema since.',
    career: [
      { title: 'Film actor', organization: 'Various studios', startYear: 1980, description: 'Leading and supporting roles in film, beginning with early comedies and expanding into dramatic work through the 1990s and 2000s.' },
      { title: 'Producer', organization: 'Playtone', startYear: 1998, description: 'Co-founded the production company Playtone, producing film and television projects.' },
    ],
    birthDate: '1956-07-09',
    birthPlace: 'Concord, California, United States',
    officialWebsite: undefined,
    social: { instagram: 'https://www.instagram.com/tomhanks' },
    relatedWorks: [
      { title: 'Forrest Gump', type: 'movie', role: 'Actor', year: 1994, entitySlug: 'forrest-gump' },
      { title: 'Saving Private Ryan', type: 'movie', role: 'Actor', year: 1998, entitySlug: 'saving-private-ryan' },
      { title: 'Cast Away', type: 'movie', role: 'Actor', year: 2000 },
      { title: 'Toy Story', type: 'movie', role: 'Voice actor', year: 1995 },
    ],
    relatedOrganizations: [{ name: 'Playtone', role: 'Co-founder' }],
    timeline: [
      { date: '1956', title: 'Born in Concord, California' },
      { date: '1994', title: 'Won the Academy Award for Best Actor for Philadelphia' },
      { date: '1995', title: 'Won a second consecutive Academy Award for Best Actor for Forrest Gump' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Tom Hanks — Biography, Career & Filmography', metaDescription: 'Profile of actor and filmmaker Tom Hanks: biography, career milestones, and notable films.' },
  },
  {
    slug: 'beyonce',
    fullName: 'Beyoncé Giselle Knowles-Carter',
    displayName: 'Beyoncé',
    category: 'musicians',
    countryCode: 'US',
    biography:
      'Beyoncé is an American singer, songwriter, and performer who rose to fame as a member of Destiny’s Child before establishing one of the most successful solo careers in popular music. ' +
      'Her work spans R&B, pop, and hip-hop, and she is widely recognized as one of the most decorated artists in Grammy Award history.',
    career: [
      { title: 'Member', organization: "Destiny's Child", startYear: 1997, endYear: 2006 },
      { title: 'Solo recording artist', startYear: 2003 },
    ],
    birthDate: '1981-09-04',
    birthPlace: 'Houston, Texas, United States',
    social: { instagram: 'https://www.instagram.com/beyonce' },
    relatedWorks: [
      { title: 'Dangerously in Love', type: 'album', year: 2003 },
      { title: 'Lemonade', type: 'album', year: 2016, entitySlug: 'lemonade' },
      { title: 'Renaissance', type: 'album', year: 2022, entitySlug: 'renaissance' },
    ],
    relatedPeople: [{ slug: 'jay-z', relationship: 'Spouse' }],
    timeline: [
      { date: '1981', title: 'Born in Houston, Texas' },
      { date: '2003', title: 'Released debut solo album Dangerously in Love' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Beyoncé — Biography, Career & Discography', metaDescription: 'Profile of singer and songwriter Beyoncé: biography, career milestones, and notable albums.' },
  },
  {
    slug: 'steven-spielberg',
    fullName: 'Steven Allan Spielberg',
    category: 'directors',
    countryCode: 'US',
    biography:
      'Steven Spielberg is an American filmmaker whose career spans blockbuster entertainment and serious historical drama. ' +
      'He is among the most commercially successful and widely studied directors in film history, and a co-founder of the studio DreamWorks.',
    career: [
      { title: 'Film director', startYear: 1971 },
      { title: 'Co-founder', organization: 'Amblin Entertainment', startYear: 1981 },
      { title: 'Co-founder', organization: 'DreamWorks Pictures', startYear: 1994 },
    ],
    birthDate: '1946-12-18',
    birthPlace: 'Cincinnati, Ohio, United States',
    relatedWorks: [
      { title: 'Jaws', type: 'movie', role: 'Director', year: 1975, entitySlug: 'jaws' },
      { title: 'E.T. the Extra-Terrestrial', type: 'movie', role: 'Director', year: 1982, entitySlug: 'et-the-extra-terrestrial' },
      { title: 'Schindler’s List', type: 'movie', role: 'Director', year: 1993, entitySlug: 'schindlers-list' },
      { title: 'Jurassic Park', type: 'movie', role: 'Director', year: 1993, entitySlug: 'jurassic-park' },
    ],
    relatedOrganizations: [
      { name: 'Amblin Entertainment', role: 'Co-founder' },
      { name: 'DreamWorks Pictures', role: 'Co-founder' },
    ],
    relatedPeople: [{ slug: 'kathleen-kennedy', relationship: 'Co-founded Amblin Entertainment' }],
    timeline: [
      { date: '1946', title: 'Born in Cincinnati, Ohio' },
      { date: '1993', title: 'Won the Academy Award for Best Director for Schindler’s List' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Steven Spielberg — Biography, Career & Filmography', metaDescription: 'Profile of filmmaker Steven Spielberg: biography, career milestones, and notable films.' },
  },
  {
    slug: 'kathleen-kennedy',
    fullName: 'Kathleen Kennedy',
    category: 'producers',
    countryCode: 'US',
    biography:
      'Kathleen Kennedy is an American film producer and studio executive, co-founder of Amblin Entertainment, and president of Lucasfilm. ' +
      'Over a decades-long career she has produced or executive-produced a wide range of major studio films.',
    career: [
      { title: 'Co-founder', organization: 'Amblin Entertainment', startYear: 1981 },
      { title: 'President', organization: 'Lucasfilm', startYear: 2012 },
    ],
    birthDate: '1953-06-05',
    birthPlace: 'Berkeley, California, United States',
    relatedWorks: [
      { title: 'E.T. the Extra-Terrestrial', type: 'movie', role: 'Producer', year: 1982, entitySlug: 'et-the-extra-terrestrial' },
      { title: 'Jurassic Park', type: 'movie', role: 'Producer', year: 1993, entitySlug: 'jurassic-park' },
    ],
    relatedOrganizations: [
      { name: 'Amblin Entertainment', role: 'Co-founder' },
      { name: 'Lucasfilm', role: 'President' },
    ],
    relatedPeople: [{ slug: 'steven-spielberg', relationship: 'Co-founded Amblin Entertainment' }],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Kathleen Kennedy — Biography & Career', metaDescription: 'Profile of film producer and Lucasfilm president Kathleen Kennedy.' },
  },
  {
    slug: 'oprah-winfrey',
    fullName: 'Oprah Gail Winfrey',
    displayName: 'Oprah Winfrey',
    category: 'tv-personalities',
    countryCode: 'US',
    biography:
      'Oprah Winfrey is an American media executive and talk show host best known for hosting The Oprah Winfrey Show for a quarter-century, one of the highest-rated television programs of its kind in American broadcast history. ' +
      'She later founded her own television network, OWN.',
    career: [
      { title: 'Host', organization: 'The Oprah Winfrey Show', startYear: 1986, endYear: 2011 },
      { title: 'Founder', organization: 'Harpo Productions', startYear: 1986 },
      { title: 'Co-founder', organization: 'OWN: Oprah Winfrey Network', startYear: 2011 },
    ],
    birthDate: '1954-01-29',
    birthPlace: 'Kosciusko, Mississippi, United States',
    social: { instagram: 'https://www.instagram.com/oprah' },
    relatedWorks: [
      { title: 'The Oprah Winfrey Show', type: 'show', role: 'Host', year: 1986, entitySlug: 'the-oprah-winfrey-show' },
    ],
    relatedOrganizations: [
      { name: 'Harpo Productions', role: 'Founder' },
      { name: 'OWN: Oprah Winfrey Network', role: 'Co-founder' },
    ],
    timeline: [
      { date: '1954', title: 'Born in Kosciusko, Mississippi' },
      { date: '1986', title: 'The Oprah Winfrey Show began national syndication' },
      { date: '2011', title: 'The Oprah Winfrey Show concluded after 25 seasons' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Oprah Winfrey — Biography & Career', metaDescription: 'Profile of media executive and talk show host Oprah Winfrey.' },
  },
  {
    slug: 'khaby-lame',
    fullName: 'Khabane Lame',
    displayName: 'Khaby Lame',
    category: 'influencers',
    countryCode: 'IT',
    biography:
      'Khaby Lame is a Senegalese-born Italian social media personality known for wordless comedic videos reacting to overly complicated "life hack" content, which built one of the largest followings on TikTok.',
    career: [
      { title: 'Content creator', organization: 'TikTok', startYear: 2020 },
    ],
    birthDate: '2000-03-09',
    birthPlace: 'Chivasso, Italy',
    social: { tiktok: 'https://www.tiktok.com/@khaby.lame', instagram: 'https://www.instagram.com/khaby00' },
    timeline: [
      { date: '2000', title: 'Born in Senegal; family relocated to Chivasso, Italy in childhood' },
      { date: '2020', title: 'Began posting reaction videos on TikTok during the COVID-19 lockdown' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'Khaby Lame — Biography & Career', metaDescription: 'Profile of social media personality Khaby Lame.' },
  },
  {
    slug: 'mrbeast',
    fullName: 'James Stephen Donaldson',
    displayName: 'MrBeast',
    category: 'creators',
    countryCode: 'US',
    biography:
      'Jimmy Donaldson, known online as MrBeast, is an American content creator known for elaborate, high-production stunt and philanthropy videos, and for building one of the largest independent channels on YouTube.',
    career: [
      { title: 'Content creator', organization: 'YouTube', startYear: 2012 },
      { title: 'Founder', organization: 'Beast Philanthropy', startYear: 2020 },
      { title: 'Founder', organization: 'Feastables', startYear: 2022 },
    ],
    birthDate: '1998-05-07',
    birthPlace: 'Wichita, Kansas, United States',
    social: { youtube: 'https://www.youtube.com/@MrBeast', x: 'https://x.com/MrBeast' },
    relatedOrganizations: [
      { name: 'Beast Philanthropy', role: 'Founder' },
      { name: 'Feastables', role: 'Founder' },
    ],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'MrBeast (Jimmy Donaldson) — Biography & Career', metaDescription: 'Profile of content creator MrBeast (Jimmy Donaldson).' },
  },
  {
    slug: 'lebron-james',
    fullName: 'LeBron Raymone James',
    displayName: 'LeBron James',
    category: 'athletes',
    countryCode: 'US',
    biography:
      'LeBron James is an American professional basketball player widely regarded as one of the greatest players in the history of the sport, with a career spanning more than two decades in the NBA.',
    career: [
      { title: 'Player', organization: 'Cleveland Cavaliers', startYear: 2003, endYear: 2010 },
      { title: 'Player', organization: 'Miami Heat', startYear: 2010, endYear: 2014 },
      { title: 'Player', organization: 'Cleveland Cavaliers', startYear: 2014, endYear: 2018 },
      { title: 'Player', organization: 'Los Angeles Lakers', startYear: 2018 },
    ],
    birthDate: '1984-12-30',
    birthPlace: 'Akron, Ohio, United States',
    relatedWorks: [
      { title: 'Cleveland Cavaliers', type: 'team', entitySlug: 'cleveland-cavaliers' },
      { title: 'Los Angeles Lakers', type: 'team', entitySlug: 'los-angeles-lakers' },
    ],
    timeline: [
      { date: '1984', title: 'Born in Akron, Ohio' },
      { date: '2003', title: 'Drafted first overall by the Cleveland Cavaliers' },
      { date: '2016', title: 'Won an NBA championship with the Cleveland Cavaliers' },
      { date: '2023-02', title: 'Became the NBA’s all-time leading regular-season scorer', description: 'Surpassed Kareem Abdul-Jabbar’s career scoring record.' },
    ],
    status: 'active',
    sportsInfo: {
      sport: 'Basketball',
      position: 'Forward',
      team: 'Los Angeles Lakers',
      teamSlug: 'los-angeles-lakers',
      achievements: [
        { title: 'NBA Most Valuable Player', year: 2009 },
        { title: 'NBA Most Valuable Player', year: 2010 },
        { title: 'NBA Most Valuable Player', year: 2012 },
        { title: 'NBA Most Valuable Player', year: 2013 },
        { title: 'NBA champion', year: 2012 },
        { title: 'NBA champion', year: 2013 },
        { title: 'NBA champion', year: 2016, competitionSlug: '2016-nba-finals' },
        { title: 'NBA champion', year: 2020 },
      ],
      majorCompetitions: [
        { title: 'Olympic gold medal, Team USA', year: 2008, competitionSlug: '2008-beijing-olympics-mens-basketball' },
        { title: 'Olympic gold medal, Team USA', year: 2012, competitionSlug: '2012-london-olympics-mens-basketball' },
      ],
      statistics: {
        'NBA career scoring record': 'Became the NBA’s all-time leading regular-season scorer in February 2023',
      },
    },
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'LeBron James — Biography & Career', metaDescription: 'Profile of professional basketball player LeBron James.' },
  },
  {
    slug: 'amal-clooney',
    fullName: 'Amal Clooney',
    category: 'lawyers',
    countryCode: 'GB',
    biography:
      'Amal Clooney is a British-Lebanese barrister specializing in international law and human rights, known for work on cases before international courts and tribunals.',
    career: [
      { title: 'Barrister', organization: 'Doughty Street Chambers', startYear: 2010 },
    ],
    education: [
      { institution: 'St Hugh’s College, Oxford', degree: 'Law' },
      { institution: 'New York University School of Law', degree: 'LL.M.' },
    ],
    birthDate: '1978-01-03',
    birthPlace: 'Beirut, Lebanon',
    relatedOrganizations: [{ name: 'Doughty Street Chambers', role: 'Barrister' }],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject. Not a directory listing and not a solicitation of legal services.' },
    seo: { metaTitle: 'Amal Clooney — Biography & Career', metaDescription: 'Profile of international law and human rights barrister Amal Clooney.' },
  },
  {
    slug: 'ruth-bader-ginsburg',
    fullName: 'Ruth Bader Ginsburg',
    category: 'judges',
    countryCode: 'US',
    biography:
      'Ruth Bader Ginsburg was an American jurist who served as an Associate Justice of the Supreme Court of the United States. ' +
      'Before joining the Court, she was a leading litigator on gender-equality law and a judge on the U.S. Court of Appeals for the D.C. Circuit.',
    career: [
      { title: 'Judge', organization: 'U.S. Court of Appeals for the D.C. Circuit', startYear: 1980, endYear: 1993 },
      { title: 'Associate Justice', organization: 'Supreme Court of the United States', startYear: 1993, endYear: 2020 },
    ],
    education: [
      { institution: 'Cornell University' },
      { institution: 'Columbia Law School', degree: 'LL.B.' },
    ],
    birthDate: '1933-03-15',
    birthPlace: 'Brooklyn, New York, United States',
    deathDate: '2020-09-18',
    timeline: [
      { date: '1933', title: 'Born in Brooklyn, New York' },
      { date: '1993', title: 'Appointed Associate Justice of the U.S. Supreme Court' },
      { date: '2020', title: 'Died in office' },
    ],
    status: 'deceased',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with the subject or their estate.' },
    seo: { metaTitle: 'Ruth Bader Ginsburg — Biography & Judicial Career', metaDescription: 'Profile of former U.S. Supreme Court Justice Ruth Bader Ginsburg.' },
  },
  {
    slug: 'david-attenborough',
    fullName: 'David Frederick Attenborough',
    category: 'other',
    countryCode: 'GB',
    biography:
      'David Attenborough is an English broadcaster and natural historian, known for writing and presenting nature documentary series over a career spanning more than seven decades.',
    career: [
      { title: 'Broadcaster & naturalist', organization: 'BBC', startYear: 1952 },
      { title: 'Controller', organization: 'BBC Two', startYear: 1965, endYear: 1969 },
    ],
    education: [{ institution: 'Clare College, Cambridge', degree: 'Natural Sciences' }],
    birthDate: '1926-05-08',
    birthPlace: 'London, England, United Kingdom',
    relatedWorks: [
      { title: 'Life on Earth', type: 'show', role: 'Presenter', year: 1979, entitySlug: 'life-on-earth' },
      { title: 'Planet Earth', type: 'show', role: 'Narrator', year: 2006 },
      { title: 'Blue Planet II', type: 'show', role: 'Narrator', year: 2017 },
      { title: 'Our Planet', type: 'show', role: 'Narrator', year: 2019, entitySlug: 'our-planet' },
    ],
    relatedOrganizations: [{ name: 'BBC', role: 'Broadcaster' }],
    status: 'active',
    verification: { verified: true, sourceNote: 'Long-settled public biographical record — independent reference profile, not affiliated with or endorsed by the subject.' },
    seo: { metaTitle: 'David Attenborough — Biography & Career', metaDescription: 'Profile of broadcaster and natural historian David Attenborough.' },
  },
];

/** Normalize a free-text name ("Tom Hanks") to a profile slug ("tom-hanks") — mirrors @/data/authors.ts's authorNameToSlug. */
export function personNameToSlug(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getAllPeople(): Person[] {
  return PEOPLE;
}

export function getPersonBySlug(slug: string): Person | null {
  const target = slug.toLowerCase();
  return PEOPLE.find((p) => p.slug === target) ?? null;
}

export function getPeopleByCategory(category: PersonCategorySlug): Person[] {
  return PEOPLE.filter((p) => p.category === category);
}

export function getRelatedPeople(person: Person): Person[] {
  if (!person.relatedPeople?.length) return [];
  return person.relatedPeople
    .map((rel) => getPersonBySlug(rel.slug))
    .filter((p): p is Person => p !== null);
}
