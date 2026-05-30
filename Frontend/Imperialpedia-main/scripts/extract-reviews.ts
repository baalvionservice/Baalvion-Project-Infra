/* Extract the static review guides into entity-row JSON for imperialpedia-service to seed
   (type='review', attributes = full ReviewArticle). Run: npx tsx scripts/extract-reviews.ts */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bestCdRatesReview } from '../src/data/reviews/data.reviews.cd.rates';
import { bestCryptoExchangesReview } from '../src/data/reviews/data.reviews.crypto.exchange';
import { bestOnlineBrokersReview } from '../src/data/reviews/data.reviews.online.brokers';
import { bestPersonalLoans } from '../src/data/reviews/data.personals.loans';
import { bestRoboAdvisers } from '../src/data/reviews/data.best.robo.advisers';
import { bestMortgageRates } from '../src/data/reviews/data.best.mortgage.rates';
import { bestLifeInsurance } from '../src/data/reviews/data.best.live.insurance';
import { bestSavingsRates } from '../src/data/reviews/data.best.savings.rate';
import { bestReliefCompanies } from '../src/data/reviews/data.best.relief.companies';

// Canonical slugs come from the page's reviewRegistry keys (several source data files have a
// copy-paste `slug: "best-crypto-exchanges"` bug, so we must NOT trust r.slug). We also stamp
// the correct slug into the stored copy.
const all: Array<{ slug: string; r: any }> = [
  { slug: 'best-cd-rates', r: bestCdRatesReview },
  { slug: 'best-crypto-exchanges', r: bestCryptoExchangesReview },
  { slug: 'best-online-brokers', r: bestOnlineBrokersReview },
  { slug: 'best-personal-loans', r: bestPersonalLoans },
  { slug: 'best-robo-advisers', r: bestRoboAdvisers },
  { slug: 'best-mortgage-rates', r: bestMortgageRates },
  { slug: 'best-life-insurance', r: bestLifeInsurance },
  { slug: 'best-savings-rates', r: bestSavingsRates },
  { slug: 'best-debt-relief-companies', r: bestReliefCompanies },
];

const rows = all.map(({ slug, r }) => ({
  type: 'review',
  name: r.title,
  slug,
  description: r.metaDescription || r.subhead || '',
  category: r.category || 'Reviews',
  image: null,
  tags: [],
  attributes: { ...r, slug }, // full ReviewArticle, slug corrected
}));

const out = resolve(
  process.cwd(),
  '../../Backend/services/knowledge/imperialpedia-service/scripts/_reviews_entities.json',
);
writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(`wrote ${rows.length} reviews -> ${out}`);
