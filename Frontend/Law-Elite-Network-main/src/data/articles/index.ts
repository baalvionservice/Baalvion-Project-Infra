/**
 * @fileOverview Aggregated bundled article library.
 * Each category file is authored independently; this index concatenates them
 * into the single LAW_ARTICLES list consumed via `@/data/law-content`.
 */
import type { LawArticle } from '../law-content';

import { businessCorporateArticles } from './business-corporate';
import { businessCorporateExtraArticles } from './business-corporate-extra';
import { businessCorporateExtra2Articles } from './business-corporate-extra2';
import { criminalLawArticles } from './criminal-law';
import { criminalLawExtraArticles } from './criminal-law-extra';
import { criminalLawExtra2Articles } from './criminal-law-extra2';
import { familyPersonalArticles } from './family-personal';
import { familyPersonalExtraArticles } from './family-personal-extra';
import { familyPersonalExtra2Articles } from './family-personal-extra2';
import { propertyRealEstateArticles } from './property-real-estate';
import { propertyRealEstateExtraArticles } from './property-real-estate-extra';
import { propertyRealEstateExtra2Articles } from './property-real-estate-extra2';
import { taxFinanceArticles } from './tax-finance';
import { taxFinanceExtraArticles } from './tax-finance-extra';
import { taxFinanceExtra2Articles } from './tax-finance-extra2';
import { employmentLaborArticles } from './employment-labor';
import { employmentLaborExtraArticles } from './employment-labor-extra';
import { employmentLaborExtra2Articles } from './employment-labor-extra2';
import { technologyIpArticles } from './technology-ip';
import { technologyIpExtra2Articles } from './technology-ip-extra2';
import { disputeResolutionArticles } from './dispute-resolution';
import { disputeResolutionExtra2Articles } from './dispute-resolution-extra2';

export const LAW_ARTICLES: LawArticle[] = [
  ...businessCorporateArticles,
  ...businessCorporateExtraArticles,
  ...businessCorporateExtra2Articles,
  ...criminalLawArticles,
  ...criminalLawExtraArticles,
  ...criminalLawExtra2Articles,
  ...familyPersonalArticles,
  ...familyPersonalExtraArticles,
  ...familyPersonalExtra2Articles,
  ...propertyRealEstateArticles,
  ...propertyRealEstateExtraArticles,
  ...propertyRealEstateExtra2Articles,
  ...taxFinanceArticles,
  ...taxFinanceExtraArticles,
  ...taxFinanceExtra2Articles,
  ...employmentLaborArticles,
  ...employmentLaborExtraArticles,
  ...employmentLaborExtra2Articles,
  ...technologyIpArticles,
  ...technologyIpExtra2Articles,
  ...disputeResolutionArticles,
  ...disputeResolutionExtra2Articles,
];
