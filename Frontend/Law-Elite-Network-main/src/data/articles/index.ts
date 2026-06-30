/**
 * @fileOverview Aggregated bundled article library.
 * Each category file is authored independently; this index concatenates them
 * into the single LAW_ARTICLES list consumed via `@/data/law-content`.
 */
import type { LawArticle } from '../law-content';

import { businessCorporateArticles } from './business-corporate';
import { criminalLawArticles } from './criminal-law';
import { familyPersonalArticles } from './family-personal';
import { propertyRealEstateArticles } from './property-real-estate';
import { taxFinanceArticles } from './tax-finance';
import { employmentLaborArticles } from './employment-labor';
import { technologyIpArticles } from './technology-ip';
import { disputeResolutionArticles } from './dispute-resolution';

export const LAW_ARTICLES: LawArticle[] = [
  ...businessCorporateArticles,
  ...criminalLawArticles,
  ...familyPersonalArticles,
  ...propertyRealEstateArticles,
  ...taxFinanceArticles,
  ...employmentLaborArticles,
  ...technologyIpArticles,
  ...disputeResolutionArticles,
];
