# Empty subcategories — content backlog

Generated 2026-07-30 against the bundled article library (`src/data/articles/*.ts`,
cross-referenced with `docs/seed-data.json` taxonomy). **26 of 80** subcategories
have at least one article; the **54** below have zero and are currently hidden
from navigation and return a 404 (see `fix/law-elite-network-hide-empty-subcategories`).

Once each subcategory below gets at least one published article (bundled or via
CMS — note CMS-authored articles don't currently carry a subcategory field, only
category, so populating these specifically requires either a bundled article or
a CMS schema change to add subcategory assignment), it will automatically
reappear in navigation and stop 404ing — no code change needed, the pages are
gated purely on article count.

Do this pass **after Google AdSense approval**, prioritized by category size
(smallest gaps first = fastest to fully round out a category).

## Business & Corporate (4/10 populated, 6 empty)
- Compliance (`compliance`)
- Mergers & Acquisitions (`mergers-and-acquisitions`)
- Corporate Governance (`corporate-governance`)
- Joint Ventures (`joint-ventures`)
- Business Licensing (`business-licensing`)
- Corporate Litigation (`corporate-litigation`)

## Criminal Law (4/10 populated, 6 empty)
- FIR (`fir`)
- Cyber Crime (`cyber-crime`)
- Criminal Appeals (`criminal-appeals`)
- Fraud Cases (`fraud-cases`)
- Narcotics Law (`narcotics-law`)
- Financial Crimes (`financial-crimes`)

## Family & Personal (5/10 populated, 5 empty)
- Adoption (`adoption`)
- Domestic Violence (`domestic-violence`)
- Succession & Inheritance (`succession-inheritance`)
- Guardianship (`guardianship`)
- Family Disputes (`family-disputes`)

## Property & Real Estate (3/10 populated, 7 empty)
- Property Registration (`property-registration`)
- Land Disputes (`land-disputes`)
- Builder Disputes (`builder-disputes`)
- Land Acquisition (`land-acquisition`)
- Property Documentation (`property-documentation`)
- Housing Laws (`housing-laws`)
- Zoning & Land Use (`zoning-land-use`)

## Tax & Finance (3/10 populated, 7 empty)
- Tax Compliance (`tax-compliance`)
- Bankruptcy & Insolvency (`bankruptcy-insolvency`)
- Debt Recovery (`debt-recovery`)
- Financial Regulations (`financial-regulations`)
- Investment Law (`investment-law`)
- Banking Law (`banking-law`)
- Securities Law (`securities-law`)

## Employment & Labor (3/10 populated, 7 empty)
- Workplace Harassment (`workplace-harassment`)
- Labor Compliance (`labor-compliance`)
- Industrial Disputes (`industrial-disputes`)
- Minimum Wages (`minimum-wages`)
- Social Security Laws (`social-security-laws`)
- HR Policies (`hr-policies`)
- Workplace Safety (`workplace-safety`)

## Technology & IP (2/10 populated, 8 empty)
- Cyber Law (`cyber-law`)
- Copyrights (`copyrights`)
- Patents (`patents`)
- IT Contracts (`it-contracts`)
- E-commerce Law (`e-commerce-law`)
- AI & Technology Law (`ai-technology-law`)
- Software Licensing (`software-licensing`)
- Digital Regulations (`digital-regulations`)

## Dispute Resolution (2/10 populated, 8 empty)
- Litigation (`litigation`)
- Commercial Disputes (`commercial-disputes`)
- Consumer Disputes (`consumer-disputes`)
- International Arbitration (`international-arbitration`)
- Settlement Agreements (`settlement-agreements`)
- Negotiation (`negotiation`)
- Legal Notices (`legal-notices`)
- Conflict Management (`conflict-management`)
