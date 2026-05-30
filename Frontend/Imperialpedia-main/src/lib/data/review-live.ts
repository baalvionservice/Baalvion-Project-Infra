/**
 * Live review guides from imperialpedia-service (`/entities?type=review`), where each row's
 * flattened `attributes` is the full `ReviewArticle`. Static registry fallback. Note: several
 * source data files have a copy-paste `slug` bug, so the canonical slug is the REGISTRY KEY.
 */
import { ReviewArticle } from '@/types/Review';
import { bestCdRatesReview } from '@/data/reviews/data.reviews.cd.rates';
import { bestCryptoExchangesReview } from '@/data/reviews/data.reviews.crypto.exchange';
import { bestOnlineBrokersReview } from '@/data/reviews/data.reviews.online.brokers';
import { bestPersonalLoans } from '@/data/reviews/data.personals.loans';
import { bestRoboAdvisers } from '@/data/reviews/data.best.robo.advisers';
import { bestMortgageRates } from '@/data/reviews/data.best.mortgage.rates';
import { bestLifeInsurance } from '@/data/reviews/data.best.live.insurance';
import { bestSavingsRates } from '@/data/reviews/data.best.savings.rate';
import { bestReliefCompanies } from '@/data/reviews/data.best.relief.companies';

const REGISTRY: Record<string, ReviewArticle> = {
  'best-cd-rates': bestCdRatesReview,
  'best-crypto-exchanges': bestCryptoExchangesReview,
  'best-online-brokers': bestOnlineBrokersReview,
  'best-personal-loans': bestPersonalLoans,
  'best-robo-advisers': bestRoboAdvisers,
  'best-mortgage-rates': bestMortgageRates,
  'best-life-insurance': bestLifeInsurance,
  'best-savings-rates': bestSavingsRates,
  'best-debt-relief-companies': bestReliefCompanies,
};

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || 'http://localhost:3004/api/v1';

export const reviewSlugs = Object.keys(REGISTRY);

export async function fetchReviewBySlug(slug: string): Promise<ReviewArticle | undefined> {
  try {
    const res = await fetch(`${IMP_API}/entities/review/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const d = (await res.json())?.data;
      if (d?.slug && d?.picks) return d as ReviewArticle;
    }
  } catch {
    /* fall through to static */
  }
  return REGISTRY[slug];
}
