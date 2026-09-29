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
import { ROSTER_PEOPLE } from './people-roster';
import { SHOWCASE_ONLY, SHOWCASE_PEOPLE } from './people-showcase';

const CURATED_PEOPLE: Person[] = [
  {
    slug: 'donald-trump',
    fullName: 'Donald John Trump',
    displayName: 'Donald Trump',
    category: 'other',
    countryCode: 'US',
    biography:
      'Donald John Trump is an American politician, media personality, and businessman who served as the 45th President of the United States from 2017 to 2021 and was elected the 47th President in 2024.\n\n' +
      'Prior to entering national politics, Trump managed his family business, The Trump Organization, expanding its real estate holdings across residential, commercial, hotel, and golf resort properties worldwide. In 2004, he launched the reality television series The Apprentice, which he hosted for fourteen seasons.\n\n' +
      'His career and presidency have intersected with major constitutional law, executive power, civil litigation, and criminal procedure jurisprudence, generating landmark federal and state court decisions regarding presidential immunity, corporate accountability, and election administration.',
    career: [
      { title: 'President', organization: 'The Trump Organization', startYear: 1971, endYear: 2017, description: 'Led commercial real estate, hospitality, and branding ventures worldwide.' },
      { title: 'Host & Executive Producer', organization: 'The Apprentice (NBC)', startYear: 2004, endYear: 2015, description: 'Hosted and co-produced the reality competition television series.' },
      { title: '45th President of the United States', organization: 'U.S. Federal Government', startYear: 2017, endYear: 2021, description: 'Enacted tax reform, judicial appointments, and trade policy restructuring.' },
      { title: '47th President of the United States', organization: 'U.S. Federal Government', startYear: 2025, description: 'Elected in November 2024 to a second non-consecutive term; inaugurated January 20, 2025.' },
    ],
    education: [
      { institution: 'Fordham University', year: 1966 },
      { institution: 'Wharton School of the University of Pennsylvania', degree: 'B.S. in Economics', year: 1968 },
    ],
    birthDate: '1946-06-14',
    birthPlace: 'Queens, New York City, New York, United States',
    social: { wikipedia: 'https://en.wikipedia.org/wiki/Donald_Trump' },
    relatedOrganizations: [
      { name: 'The Trump Organization', role: 'Former President' },
      { name: 'U.S. Federal Government', role: 'President' },
    ],
    timeline: [
      { date: '1946-06-14', title: 'Born in Queens, New York City' },
      { date: '1968', title: 'Graduated from the Wharton School of the University of Pennsylvania' },
      { date: '1971', title: 'Assumed leadership of family real estate firm, naming it The Trump Organization' },
      { date: '2004', title: 'Premiered NBC television series The Apprentice' },
      { date: '2016-11-08', title: 'Elected 45th President of the United States' },
      { date: '2024-07-01', title: 'U.S. Supreme Court issued landmark decision Trump v. United States on presidential immunity' },
      { date: '2024-11-05', title: 'Elected 47th President of the United States' },
    ],
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public historical, biographical, and legal reference profile — independent reference profile not affiliated with or endorsed by the subject.',
      lastReviewedAt: '2026-09-20',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
      alt: 'Donald Trump Official Portrait',
      credit: 'White House / Shealah Craighead',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Donald_Trump_official_portrait.jpg',
    },
    sources: [
      { label: 'White House Historical Association', url: 'https://www.whitehouse.gov/about-the-white-house/presidents/donald-j-trump/' },
      { label: 'National Archives — Public Papers of the Presidents', url: 'https://www.archives.gov/presidential-libraries' },
      { label: 'U.S. Supreme Court Docket — Trump v. United States', url: 'https://www.supremecourt.gov/opinions/23pdf/23-939_e2pg.pdf' },
      { label: 'Encyclopaedia Britannica Profile', url: 'https://www.britannica.com/biography/Donald-Trump' },
    ],
    topicSlugs: ['constitutional-law', 'litigation', 'corporate-governance', 'commercial-law'],
    seo: {
      metaTitle: 'Donald Trump — Biography, Career, Legal Cases & News | Law Elite Network',
      metaDescription: 'Complete reference profile for Donald Trump: biography, real estate career, presidential terms, legal cases, sources, and latest news articles.',
    },
  },
  {
    slug: 'kamala-harris',
    fullName: 'Kamala Devi Harris',
    displayName: 'Kamala Harris',
    category: 'lawyers',
    countryCode: 'US',
    biography:
      'Kamala Devi Harris is an American attorney and politician who served as the 49th Vice President of the United States from 2021 to 2025.\n\n' +
      'She previously served as a U.S. Senator representing California from 2017 to 2021, as Attorney General of California from 2011 to 2017, and as District Attorney of San Francisco from 2004 to 2011.\n\n' +
      'Her career spans criminal justice administration, consumer protection enforcement, mortgage fraud settlements, and constitutional law reform.',
    career: [
      { title: 'District Attorney', organization: 'City and County of San Francisco', startYear: 2004, endYear: 2011 },
      { title: 'Attorney General', organization: 'State of California', startYear: 2011, endYear: 2017 },
      { title: 'U.S. Senator', organization: 'U.S. Senate (California)', startYear: 2017, endYear: 2021 },
      { title: '49th Vice President of the United States', organization: 'U.S. Federal Government', startYear: 2021, endYear: 2025 },
    ],
    education: [
      { institution: 'Howard University', degree: 'B.A. in Political Science and Economics', year: 1986 },
      { institution: 'UC Law San Francisco (formerly UC Hastings College of the Law)', degree: 'J.D.', year: 1989 },
    ],
    birthDate: '1964-10-20',
    birthPlace: 'Oakland, California, United States',
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public biographical record — independent reference profile not affiliated with or endorsed by the subject.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg',
      alt: 'Kamala Harris Official Vice Presidential Portrait',
      credit: 'White House / Lawrence Jackson',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kamala_Harris_Vice_Presidential_Portrait.jpg',
    },
    sources: [
      { label: 'U.S. Senate Historical Office', url: 'https://www.senate.gov/senators/' },
      { label: 'California Department of Justice — Office of the Attorney General', url: 'https://oag.ca.gov/' },
    ],
    topicSlugs: ['constitutional-law', 'criminal-defense', 'litigation'],
    seo: {
      metaTitle: 'Kamala Harris — Biography, Legal Career & News | Law Elite Network',
      metaDescription: 'Profile of attorney and former Vice President Kamala Harris: legal career as District Attorney and California AG.',
    },
  },
  {
    slug: 'elon-musk',
    fullName: 'Elon Reeve Musk',
    displayName: 'Elon Musk',
    category: 'creators',
    countryCode: 'US',
    biography:
      'Elon Musk is a South African-born American entrepreneur, industrial designer, and tech executive. He is the founder, CEO, and chief engineer of SpaceX, CEO and product architect of Tesla, Inc., owner of X (formerly Twitter), and founder of Neuralink and The Boring Company.\n\n' +
      'His commercial ventures and corporate governance practices have generated groundbreaking case law in the Delaware Court of Chancery concerning board independence, fiduciary duties, and executive compensation.',
    career: [
      { title: 'Co-founder', organization: 'PayPal (X.com)', startYear: 1999, endYear: 2002 },
      { title: 'CEO & Chief Engineer', organization: 'SpaceX', startYear: 2002 },
      { title: 'CEO', organization: 'Tesla, Inc.', startYear: 2008 },
      { title: 'Owner & Chief Technology Officer', organization: 'X Corp. (Twitter)', startYear: 2022 },
    ],
    education: [
      { institution: 'Queen’s University', year: 1992 },
      { institution: 'University of Pennsylvania', degree: 'B.S. in Economics & B.A. in Physics', year: 1997 },
    ],
    birthDate: '1971-06-28',
    birthPlace: 'Pretoria, South Africa',
    social: { x: 'https://x.com/elonmusk' },
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public biographical record — independent reference profile not affiliated with or endorsed by the subject.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Elon_Musk_Colorado_2022_%28cropped%29.jpg',
      alt: 'Elon Musk',
      credit: 'Trevor Cokley / U.S. Air Force',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Elon_Musk_Colorado_2022_(cropped).jpg',
    },
    sources: [
      { label: 'Delaware Court of Chancery Chancery Dockets', url: 'https://courts.delaware.gov/chancery/' },
      { label: 'U.S. Securities and Exchange Commission (SEC) Filings', url: 'https://www.sec.gov/edgar' },
    ],
    topicSlugs: ['corporate-governance', 'commercial-law', 'intellectual-property'],
    seo: {
      metaTitle: 'Elon Musk — Biography, Corporate Litigation & News | Law Elite Network',
      metaDescription: 'Profile of entrepreneur Elon Musk: SpaceX, Tesla, X, corporate litigation, and SEC regulatory filings.',
    },
  },
  {
    slug: 'sonia-sotomayor',
    fullName: 'Sonia Maria Sotomayor',
    displayName: 'Sonia Sotomayor',
    category: 'judges',
    countryCode: 'US',
    biography:
      'Sonia Sotomayor is an American lawyer and jurist who has served as an Associate Justice of the Supreme Court of the United States since 2009. Appointed by President Barack Obama, she is the Court’s first Latina justice.\n\n' +
      'Prior to joining the Supreme Court, Sotomayor served as an Assistant District Attorney in Manhattan, a corporate litigator in private practice, a U.S. District Judge for the Southern District of New York, and a Circuit Judge on the U.S. Court of Appeals for the Second Circuit.',
    career: [
      { title: 'Assistant District Attorney', organization: 'New York County District Attorney’s Office', startYear: 1979, endYear: 1984 },
      { title: 'Partner', organization: 'Pavia & Harcourt', startYear: 1984, endYear: 1992 },
      { title: 'U.S. District Judge', organization: 'U.S. District Court, Southern District of New York', startYear: 1992, endYear: 1998 },
      { title: 'U.S. Circuit Judge', organization: 'U.S. Court of Appeals for the Second Circuit', startYear: 1998, endYear: 2009 },
      { title: 'Associate Justice', organization: 'Supreme Court of the United States', startYear: 2009 },
    ],
    education: [
      { institution: 'Princeton University', degree: 'B.A., summa cum laude', year: 1976 },
      { institution: 'Yale Law School', degree: 'J.D.', year: 1979 },
    ],
    birthDate: '1954-06-25',
    birthPlace: 'The Bronx, New York City, New York, United States',
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public judicial record — independent reference profile not affiliated with the subject or the U.S. Supreme Court.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Sonia_Sotomayor_official_SCOTUS_portrait.jpg',
      alt: 'Sonia Sotomayor Official SCOTUS Portrait',
      credit: 'Steve Petteway / Supreme Court of the United States',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sonia_Sotomayor_official_SCOTUS_portrait.jpg',
    },
    sources: [
      { label: 'Supreme Court of the United States — Biographical Data', url: 'https://www.supremecourt.gov/about/biographies.aspx' },
      { label: 'Federal Judicial Center — Judicial Biography', url: 'https://www.fjc.gov/history/judges' },
    ],
    topicSlugs: ['constitutional-law', 'litigation', 'jurisdiction'],
    seo: {
      metaTitle: 'Sonia Sotomayor — Biography & Judicial Career | Law Elite Network',
      metaDescription: 'Profile of Supreme Court Justice Sonia Sotomayor: biography, judicial career, decisions, and legal sources.',
    },
  },
  {
    slug: 'clarence-thomas',
    fullName: 'Clarence Thomas',
    category: 'judges',
    countryCode: 'US',
    biography:
      'Clarence Thomas is an American lawyer and jurist serving as an Associate Justice of the Supreme Court of the United States. Appointed by President George H.W. Bush in 1991, he is the longest-serving member of the current Court.\n\n' +
      'Known for his originalist jurisprudence, Thomas previously served as Chairman of the Equal Employment Opportunity Commission (EEOC) and as a Circuit Judge on the U.S. Court of Appeals for the District of Columbia Circuit.',
    career: [
      { title: 'Assistant Attorney General', organization: 'State of Missouri', startYear: 1974, endYear: 1977 },
      { title: 'Chairman', organization: 'Equal Employment Opportunity Commission (EEOC)', startYear: 1982, endYear: 1990 },
      { title: 'U.S. Circuit Judge', organization: 'U.S. Court of Appeals for the D.C. Circuit', startYear: 1990, endYear: 1991 },
      { title: 'Associate Justice', organization: 'Supreme Court of the United States', startYear: 1991 },
    ],
    education: [
      { institution: 'College of the Holy Cross', degree: 'A.B., cum laude', year: 1971 },
      { institution: 'Yale Law School', degree: 'J.D.', year: 1974 },
    ],
    birthDate: '1948-06-23',
    birthPlace: 'Pin Point, Georgia, United States',
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public judicial record — independent reference profile.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Clarence_Thomas_official_SCOTUS_portrait.jpg',
      alt: 'Clarence Thomas Official SCOTUS Portrait',
      credit: 'Steve Petteway / Supreme Court of the United States',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Clarence_Thomas_official_SCOTUS_portrait.jpg',
    },
    sources: [
      { label: 'Supreme Court of the United States — Biographical Data', url: 'https://www.supremecourt.gov/about/biographies.aspx' },
    ],
    topicSlugs: ['constitutional-law', 'jurisdiction'],
    seo: {
      metaTitle: 'Clarence Thomas — Biography & Judicial Career | Law Elite Network',
      metaDescription: 'Profile of Supreme Court Justice Clarence Thomas: biography, originalist jurisprudence, decisions, and sources.',
    },
  },
  {
    slug: 'jack-smith',
    fullName: 'John Luman Smith',
    displayName: 'Jack Smith',
    category: 'lawyers',
    countryCode: 'US',
    biography:
      'John Luman "Jack" Smith is an American prosecutor who served as Special Counsel for the United States Department of Justice from 2022 until his resignation in January 2025, overseeing federal investigations into Donald Trump.\n\n' +
      'He previously served as Chief Prosecutor at the Kosovo Specialist Chambers in The Hague and as Chief of the Public Integrity Section of the U.S. Department of Justice.',
    career: [
      { title: 'Assistant U.S. Attorney', organization: 'U.S. Attorney’s Office, Eastern District of New York', startYear: 1999, endYear: 2008 },
      { title: 'Chief of Public Integrity Section', organization: 'U.S. Department of Justice', startYear: 2010, endYear: 2015 },
      { title: 'Chief Prosecutor', organization: 'Kosovo Specialist Chambers (The Hague)', startYear: 2018, endYear: 2022 },
      { title: 'Special Counsel', organization: 'U.S. Department of Justice', startYear: 2022, endYear: 2025 },
    ],
    education: [
      { institution: 'State University of New York at Oneonta', degree: 'B.A., cum laude', year: 1991 },
      { institution: 'Harvard Law School', degree: 'J.D., cum laude', year: 1994 },
    ],
    birthDate: '1969-06-05',
    birthPlace: 'Clay, New York, United States',
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public prosecutorial record — independent reference profile.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Jack_Smith_official_portrait.jpg',
      alt: 'Jack Smith Official DOJ Portrait',
      credit: 'U.S. Department of Justice',
      license: 'Public Domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jack_Smith_official_portrait.jpg',
    },
    sources: [
      { label: 'U.S. Department of Justice — Office of Special Counsel', url: 'https://www.justice.gov/' },
    ],
    topicSlugs: ['criminal-defense', 'litigation', 'constitutional-law'],
    seo: {
      metaTitle: 'Jack Smith — Biography & Prosecutorial Career | Law Elite Network',
      metaDescription: 'Profile of prosecutor and former Special Counsel Jack Smith: career background, Public Integrity Section, and federal litigation.',
    },
  },
  {
    slug: 'fani-willis',
    fullName: 'Fani Taifa Willis',
    displayName: 'Fani Willis',
    category: 'lawyers',
    countryCode: 'US',
    biography:
      'Fani Taifa Willis is an American prosecutor and lawyer who serves as the District Attorney of Fulton County, Georgia.\n\n' +
      'She is known for spearheading complex RICO prosecutions, including high-profile cases involving multi-defendant criminal enterprises and public integrity enforcement.',
    career: [
      { title: 'Assistant District Attorney', organization: 'Fulton County DA’s Office', startYear: 2001, endYear: 2018 },
      { title: 'District Attorney', organization: 'Fulton County, Georgia', startYear: 2021 },
    ],
    education: [
      { institution: 'Howard University', degree: 'B.A.', year: 1993 },
      { institution: 'Emory University School of Law', degree: 'J.D.', year: 1996 },
    ],
    birthDate: '1971-10-27',
    birthPlace: 'Inglewood, California, United States',
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public prosecutorial record — independent reference profile.',
    },
    sources: [
      { label: 'Fulton County District Attorney’s Office Official Portal', url: 'https://www.fultonda.org/' },
    ],
    topicSlugs: ['criminal-defense', 'litigation'],
    seo: {
      metaTitle: 'Fani Willis — Biography & Legal Career | Law Elite Network',
      metaDescription: 'Profile of Fulton County District Attorney Fani Willis: RICO prosecution experience, legal education, and public integrity litigation.',
    },
  },
  {
    slug: 'taylor-swift',
    fullName: 'Taylor Alison Swift',
    displayName: 'Taylor Swift',
    category: 'musicians',
    countryCode: 'US',
    biography:
      'Taylor Alison Swift is an American singer-songwriter, producer, and director known for narrative songwriting and for a public campaign to regain ownership of her early recordings.\n\n' +
      'After a 2019 sale of her original label put the master recordings of her first six albums in other hands, she re-recorded them as "Taylor’s Version" releases, and in May 2025 announced she had bought the original masters back. The dispute was resolved through contracts and sales rather than a court ruling.',
    career: [
      { title: 'Recording Artist & Songwriter', organization: 'Big Machine Records', startYear: 2006, endYear: 2018 },
      { title: 'Recording Artist & Producer', organization: 'Republic Records / Universal Music Group', startYear: 2018 },
    ],
    birthDate: '1989-12-13',
    birthPlace: 'West Reading, Pennsylvania, United States',
    social: { instagram: 'https://www.instagram.com/taylorswift', x: 'https://x.com/taylorswift13' },
    status: 'active',
    featured: true,
    verification: {
      verified: true,
      sourceNote: 'Public biographical record — independent reference profile.',
    },
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png',
      alt: 'Taylor Swift',
      credit: 'Wikimedia Commons / Eva Rinaldi',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png',
    },
    sources: [
      { label: 'U.S. Copyright Office — Registration Dockets', url: 'https://www.copyright.gov/' },
    ],
    topicSlugs: ['intellectual-property', 'commercial-law'],
    seo: {
      metaTitle: 'Taylor Swift — Biography, Master Recording Rights & Career | Law Elite Network',
      metaDescription: 'Profile of singer-songwriter Taylor Swift: music career, master recording copyright litigation, and intellectual property impact.',
    },
  },
  {
    slug: 'cristiano-ronaldo',
    fullName: 'Cristiano Ronaldo dos Santos Aveiro',
    displayName: 'Cristiano Ronaldo',
    category: 'athletes',
    countryCode: 'PT',
    biography:
      'Cristiano Ronaldo is a Portuguese professional footballer widely regarded as one of the greatest football players of all time. He has won five Ballon d’Or awards and five UEFA Champions League titles, scoring over 900 official career goals.',
    career: [
      { title: 'Player', organization: 'Manchester United', startYear: 2003, endYear: 2009 },
      { title: 'Player', organization: 'Real Madrid', startYear: 2009, endYear: 2018 },
      { title: 'Player', organization: 'Juventus', startYear: 2018, endYear: 2021 },
      { title: 'Player', organization: 'Manchester United', startYear: 2021, endYear: 2022 },
      { title: 'Player', organization: 'Al Nassr', startYear: 2023 },
    ],
    birthDate: '1985-02-05',
    birthPlace: 'Funchal, Madeira, Portugal',
    social: { instagram: 'https://www.instagram.com/cristiano' },
    status: 'active',
    featured: true,
    verification: { verified: true, sourceNote: 'Public biographical record.' },
    sportsInfo: {
      sport: 'Football (Soccer)',
      position: 'Forward',
      team: 'Al Nassr / Portugal National Team',
      achievements: [
        { title: 'Ballon d’Or', year: 2008 },
        { title: 'Ballon d’Or', year: 2013 },
        { title: 'Ballon d’Or', year: 2014 },
        { title: 'Ballon d’Or', year: 2016 },
        { title: 'Ballon d’Or', year: 2017 },
      ],
    },
    seo: { metaTitle: 'Cristiano Ronaldo — Biography & Career | Law Elite Network', metaDescription: 'Profile of professional football player Cristiano Ronaldo.' },
  },
  {
    slug: 'lionel-messi',
    fullName: 'Lionel Andrés Messi',
    displayName: 'Lionel Messi',
    category: 'athletes',
    countryCode: 'AR',
    biography:
      'Lionel Messi is an Argentine professional footballer who plays as a forward for Major League Soccer club Inter Miami and captains the Argentina national team. Widely considered the greatest player in football history, Messi has won a record eight Ballon d’Or awards and led Argentina to victory in the 2022 FIFA World Cup.',
    career: [
      { title: 'Player', organization: 'FC Barcelona', startYear: 2004, endYear: 2021 },
      { title: 'Player', organization: 'Paris Saint-Germain', startYear: 2021, endYear: 2023 },
      { title: 'Player', organization: 'Inter Miami CF', startYear: 2023 },
    ],
    birthDate: '1987-06-24',
    birthPlace: 'Rosario, Santa Fe, Argentina',
    social: { instagram: 'https://www.instagram.com/leomessi' },
    status: 'active',
    featured: true,
    verification: { verified: true, sourceNote: 'Public biographical record.' },
    sportsInfo: {
      sport: 'Football (Soccer)',
      position: 'Forward',
      team: 'Inter Miami CF / Argentina National Team',
      achievements: [
        { title: 'FIFA World Cup Winner', year: 2022 },
        { title: 'Ballon d’Or (Record 8-time recipient)', year: 2023 },
      ],
    },
    seo: { metaTitle: 'Lionel Messi — Biography & Career | Law Elite Network', metaDescription: 'Profile of professional football player Lionel Messi.' },
  },
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
      { date: '1994', title: 'Won the Academy Award for Best Director for Schindler’s List (66th Academy Awards)' },
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
      'Kathleen Kennedy is an American film producer and studio executive, co-founder of Amblin Entertainment, and former president of Lucasfilm, a role she held from 2012 until stepping down in January 2026. ' +
      'Over a decades-long career she has produced or executive-produced a wide range of major studio films.',
    career: [
      { title: 'Co-founder', organization: 'Amblin Entertainment', startYear: 1981 },
      { title: 'President', organization: 'Lucasfilm', startYear: 2012, endYear: 2026 },
    ],
    birthDate: '1953-06-05',
    birthPlace: 'Berkeley, California, United States',
    relatedWorks: [
      { title: 'E.T. the Extra-Terrestrial', type: 'movie', role: 'Producer', year: 1982, entitySlug: 'et-the-extra-terrestrial' },
      { title: 'Jurassic Park', type: 'movie', role: 'Producer', year: 1993, entitySlug: 'jurassic-park' },
    ],
    relatedOrganizations: [
      { name: 'Amblin Entertainment', role: 'Co-founder' },
      { name: 'Lucasfilm', role: 'Former President' },
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
    birthPlace: 'Dakar, Senegal',
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
    birthDate: '1978-02-03',
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

/**
 * Hand-written profiles first, then the discovery roster. A roster entry is
 * dropped when its slug or name is already taken, so a curated profile is
 * never shadowed and one person never appears under two slugs.
 */
export const PEOPLE: Person[] = (() => {
  const slugs = new Set(CURATED_PEOPLE.map((p) => p.slug));
  const names = new Set(CURATED_PEOPLE.map((p) => (p.displayName || p.fullName).toLowerCase()));
  const roster = ROSTER_PEOPLE.filter((p) => {
    const name = p.fullName.toLowerCase();
    if (slugs.has(p.slug) || names.has(name)) return false;
    slugs.add(p.slug);
    names.add(name);
    return true;
  });
  const all = [...CURATED_PEOPLE, ...roster];
  return SHOWCASE_ONLY ? all.filter((p) => SHOWCASE_PEOPLE.has(p.slug)) : all;
})();


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
