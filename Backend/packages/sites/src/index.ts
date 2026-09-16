export { SITES, INFRASTRUCTURE_HOSTS, UNCLASSIFIED_HOSTS } from './registry';
export { PAYMENT_RAILS } from './types';
export type { Site, SiteStatus, PaymentRail, RailsBasis } from './types';
export {
  SiteRegistryError,
  normalizeHost,
  classifyHost,
  siteForHost,
  siteIdForHost,
  assertSiteForHost,
  siteById,
  assertSiteById,
  allSites,
  sitesWithRails,
  railsFor,
  isRailAllowed,
  isRailConfirmed,
  assertRailAllowed,
} from './resolve';
export type { HostClass } from './resolve';

// Which company's books a site's money belongs in — resolved at runtime, so assigning
// entities is configuration rather than a code deploy.
export {
  legalEntityFor,
  legalEntityAssignments,
  sitesWithoutLegalEntity,
  assertLegalEntityFor,
  checkLegalEntityConfig,
  assertLegalEntityConfig,
} from './entities';
export type { LegalEntityAssignment, LegalEntityConfigReport } from './entities';

// Which companies exist at all — declared at deploy time, never invented in source.
export { declaredLegalEntities, legalEntityById, isDeclaredLegalEntity, LegalEntityError } from './legalEntities';
export type { LegalEntity } from './legalEntities';
