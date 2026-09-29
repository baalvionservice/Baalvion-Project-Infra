# Author ↔ article matrix — Law Elite Network

Generated 2026-09-21 from the production build served locally (105 article URLs: 104 bundled + 1 extra CMS-list slug; 10 more CMS records share slugs with bundled ones) and the bundled/CMS author rosters. "Articles" = articles whose visible byline is this author. "Listed on profile" = articles the author page actually lists; the profile deliberately lists only live-category articles (approved SEO policy), and no individual-author article is currently in a live category, so every individual profile shows the accurate empty state.

Precedence used (per prompt): article authorSlug (CMS `customFields.authorSlug`, equal to the slug of the CMS author name in every CMS record checked) > article author record > CMS author relationship > bundled author relationship > house byline. Slugs are derived from the byline (`authorNameToSlug`) everywhere (byline, profile, feed, sitemap, JSON-LD), so all layers agree. No name was mapped to a similar name.

Note: the request listed "Priya Almeida"; the CMS/bundled author is **Sofia Almeida** (Priya Nair and Priya Menon are different bundled authors). Nothing was renamed or merged.

## Individual authors with profiles

| Author | Slug | Profile | Credentials | Schema | Articles | Listed on profile |
|---|---|---|---|---|---|---|
| Aisha Rahman | aisha-rahman | 200 noindex, follow | no credential block (affiliation only) | Person | 7 | 0 (empty state; all in retired categories) |
| Aman Thakur | aman-thakur | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 1 | 0 (empty state; all in retired categories) |
| Claire Hannon | claire-hannon | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 1 | 0 (empty state; all in retired categories) |
| Daniel Okafor | daniel-okafor | 200 noindex, follow | no credential block (affiliation only) | Person | 9 | 0 (empty state; all in retired categories) |
| Daniel Okoro | daniel-okoro | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 10 | 0 (empty state; all in retired categories) |
| Eleanor Whitfield | eleanor-whitfield | 200 noindex, follow | no credential block (affiliation only) | Person | 2 | 0 (empty state; all in retired categories) |
| Elena Rossi | elena-rossi | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 7 | 0 (empty state; all in retired categories) |
| Marcus Hale | marcus-hale | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 6 | 0 (empty state; all in retired categories) |
| Marcus Whitfield | marcus-whitfield | 200 noindex, follow | no credential block (affiliation only) | Person | 10 | 0 (empty state; all in retired categories) |
| Maria Harizanova | maria-harizanova | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 1 | 0 (empty state; all in retired categories) |
| Priya Menon | priya-menon | 200 noindex, follow | no credential block (affiliation only) | Person | 1 | 0 (empty state; all in retired categories) |
| Priya Nair | priya-nair | 200 noindex, follow | no credential block (affiliation only) | Person | 12 | 0 (empty state; all in retired categories) |
| Rajesh Iyer | rajesh-iyer | 200 noindex, follow | no credential block (affiliation only) | Person | 2 | 0 (empty state; all in retired categories) |
| Sofia Almeida | sofia-almeida | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 5 | 0 (empty state; all in retired categories) |
| Waki Malik | waki-malik | 200 noindex, follow | AS SUPPLIED, NOT VERIFIED | Person | 2 | 0 (empty state; all in retired categories) |

Profiles with zero articles (kept, accurate empty state): abinesh-raj, aishwarya-gorak, anna-solovieva, deepak-kumar-kuldeep, diksha-singhal, yessica-ruiz

## House bylines (Organization, no profile)

| Byline | Articles | Schema |
|---|---|---|
| DRAFT — pending editor review | 1 | Organization (name: Law Elite Network) |
| Law Elite Editorial Team | 10 | Organization (name: Law Elite Network) |
| Law Elite Network Editorial Board | 5 | Organization (name: Law Elite Network) |

## UNRESOLVED AUTHOR ATTRIBUTIONS

No profile exists in the bundled roster or the CMS for these bylines (/author/{slug} returns 404). The byline is shown as text, is not linked, and JSON-LD carries a Person with the name only (no url, no sameAs). Not mapped to any similar-named author.

| Byline | Articles | Slugs |
|---|---|---|
| David Thorne | 2 | lebron-james-springhill-company-nil-regulations-klutch-sports, streaming-platform-carriage-disputes-global-distribution-licensing |
| Elena Rostova | 4 | hollywood-studio-arbitration-sag-aftra-ai-likeness-rights, lionel-messi-tax-settlement-image-rights-mls-contract, page-six-legal-analysis-defamation-right-of-publicity-paparazzi-litigation, tom-hanks-ai-likeness-copyright-enforcement-sag-aftra |
| Marcus Vance | 3 | cristiano-ronaldo-contract-exclusivity-juventus-arbitration-defamation, master-recording-rights-music-publishing-valuation-disputes, nba-collective-bargaining-agreement-second-apron-luxury-tax-rules |
| Sarah Jenkins | 3 | beyonce-parkwood-entertainment-ip-portfolio-master-trademarks, court-of-arbitration-for-sport-cas-appeals-olympic-eligibility, peak-tv-contract-renegotiations-wga-residual-structures |

Also: 1 CMS-list article (clorox-puerto-rico-recalls-scented-mistolin-and-lestoil-multi-purpose-cleaners-due-to-bacteria-risk) returned HTTP 500 from the local build because the local CMS rate-limited the on-demand render; its byline could not be read. Re-check on production.

## Every article

| Slug | Title | Source | Byline | Author JSON-LD | Robots |
|---|---|---|---|---|---|
| 1l-survival-guide-month-by-month-timeline | 1L Survival Guide: A Month-by-Month First Year Timeline | bundled | Law Elite Editorial Team | Organization | index, follow |
| alimony-and-spousal-support-explained | Alimony and Spousal Support Explained | bundled | Aman Thakur | Person | noindex, follow |
| arbitration-vs-litigation-how-to-choose | Arbitration vs Litigation: How to Choose | bundled | Waki Malik | Person | noindex, follow |
| at-will-employment-exceptions-by-state | At-Will Employment Exceptions in the US by State | bundled | Daniel Okoro | Person | noindex, follow |
| australia-non-compete-ban-sub-threshold-workers | Australia Non-Compete Ban Explained | bundled (CMS record also exists; CMS wins at runtime) | Daniel Okoro | Person | noindex, follow |
| beyonce-parkwood-entertainment-ip-portfolio-master-trademarks | Beyoncé: Parkwood Entertainment IP Portfolio, Master Trademarks & Tour Licensing Law | bundled | Sarah Jenkins | Person | noindex, follow |
| booking-hearing-rooms-london-international-arbitration-centre | Booking Hearing Rooms at London's Arbitration Centres | bundled | Marcus Whitfield | Person | noindex, follow |
| breach-of-contract-remedies | Breach of Contract: Remedies and What You Can Recover | bundled | Elena Rossi | Person | noindex, follow |
| capital-gains-tax-main-residence-exemption-australia | Capital Gains Tax on Your Home in Australia Explained | bundled | Priya Nair | Person | noindex, follow |
| capital-gains-tax-selling-a-home-us | Capital Gains Tax When You Sell Your Home in the US | bundled | Priya Nair | Person | noindex, follow |
| capital-gains-tax-uk-property-private-residence-relief | Capital Gains Tax on UK Property: Private Residence Relief | bundled | Priya Nair | Person | noindex, follow |
| charter-rights-on-arrest-canada | Your Charter Rights When Arrested in Canada | bundled | Aisha Rahman | Person | noindex, follow |
| child-custody-explained | Child Custody Explained: How Courts Decide a Child’s Future | bundled | Rajesh Iyer | Person | noindex, follow |
| clorox-puerto-rico-recalls-scented-mistolin-and-lestoil-multi-purpose-cleaners-due-to-bacteria-risk |  | CMS | None | None | None |
| cold-calling-in-law-school-what-to-say-when-not-ready | Cold Calling in Law School: What to Say When You're Not Ready | bundled | Law Elite Editorial Team | Organization | index, follow |
| common-law-vs-civil-law | Common Law vs. Civil Law: What Actually Separates the Two Systems | bundled | Law Elite Editorial Team | Organization | index, follow |
| community-property-vs-equitable-distribution-us | Community Property vs. Equitable Distribution in the U.S. | bundled (CMS record also exists; CMS wins at runtime) | Sofia Almeida | Person | noindex, follow |
| company-formation-overview | How to Form a Company: A Practical Overview | bundled | Marcus Hale | Person | noindex, follow |
| company-registration-australia-asic | Registering a Company in Australia: The ASIC Process | bundled (CMS record also exists; CMS wins at runtime) | Elena Rossi | Person | noindex, follow |
| court-of-arbitration-for-sport-cas-appeals-olympic-eligibility | Court of Arbitration for Sport (CAS) Appeals & Olympic Eligibility Rulings | bundled | Sarah Jenkins | Person | noindex, follow |
| cristiano-ronaldo-contract-exclusivity-juventus-arbitration-defamation | Cristiano Ronaldo: Contract Exclusivity, Arbitration Award Against Juventus & Defamation Defense | bundled | Marcus Vance | Person | index, follow |
| data-privacy-law-basics | Data Privacy Law Basics: How Personal Data Is Protected | bundled | Marcus Hale | Person | noindex, follow |
| donald-trump-constitutional-immunity-ruling-analysis | U.S. Supreme Court Constitutional Analysis: Presidential Immunity, Executive Authority, and Separation of Powers in Federal Litigation | bundled | Law Elite Network Editorial Board | Organization | noindex, follow |
| dui-dwi-basics | DUI and DWI: The Basics of Drunk-Driving Law | bundled | Daniel Okafor | Person | noindex, follow |
| elon-musk-delaware-corporate-governance-chancery-court | Corporate Governance & Executive Compensation: Delaware Court of Chancery Legal Framework for Board Fiduciary Duties | bundled | Law Elite Network Editorial Board | Organization | noindex, follow |
| employee-vs-independent-contractor | Employee vs Independent Contractor: The Legal Difference | bundled | Daniel Okoro | Person | noindex, follow |
| enforcing-foreign-arbitral-awards-london-new-york-convention | Enforcing Foreign Arbitral Awards in London | bundled | Marcus Whitfield | Person | noindex, follow |
| english-arbitration-act-2025-london-seated-arbitration | How the Arbitration Act 2025 Governs London Arbitration | bundled | Marcus Whitfield | Person | noindex, follow |
| fani-willis-racketeering-statute-jurisprudence-analysis | State RICO Statutes and Public Integrity Litigation: Legal Standards in High-Profile Multi-Defendant Indictments | bundled | Law Elite Network Editorial Board | Organization | noindex, follow |
| federal-vs-provincial-incorporation-canada | Federal vs. Provincial Incorporation in Canada | bundled (CMS record also exists; CMS wins at runtime) | Elena Rossi | Person | noindex, follow |
| financial-settlements-divorce-england-wales | Financial Settlements on Divorce in England and Wales | bundled (CMS record also exists; CMS wins at runtime) | Sofia Almeida | Person | noindex, follow |
| hollywood-studio-arbitration-sag-aftra-ai-likeness-rights | Hollywood Studio Arbitration & SAG-AFTRA AI Likeness Rights Landmark Deal | bundled | Elena Rostova | Person | index, follow |
| how-divorce-works-guide | How Divorce Works: A Plain-Language Guide | bundled | Sofia Almeida | Person | noindex, follow |
| how-does-bail-work | How Does Bail Work? | bundled | Aisha Rahman | Person | noindex, follow |
| how-is-child-support-calculated | How Is Child Support Calculated? | bundled | Rajesh Iyer | Person | noindex, follow |
| how-many-hours-should-you-study-in-law-school | How Many Hours Should You Actually Study in Law School? | bundled | Law Elite Editorial Team | Organization | index, follow |
| how-personal-income-tax-works | How Personal Income Tax Works | bundled | Daniel Okafor | Person | noindex, follow |
| how-to-brief-a-case-annotated-examples | How to Brief a Case: Annotated Examples Across 4 Subjects | bundled | Law Elite Editorial Team | Organization | index, follow |
| how-to-form-an-llc-step-by-step | How to Form an LLC: A Step-by-Step Guide | bundled | Marcus Hale | Person | noindex, follow |
| how-to-outline-for-law-school-exams | How to Outline for Law School Exams: A Working Template | bundled | Law Elite Editorial Team | Organization | index, follow |
| how-to-read-a-law-school-casebook | How to Read a Law School Casebook (Without Drowning) | bundled | Law Elite Editorial Team | Organization | index, follow |
| how-to-think-like-a-lawyer-worked-example | How to Think Like a Lawyer: A Worked Example of Legal Reasoning | bundled | Law Elite Editorial Team | Organization | index, follow |
| how-to-write-a-valid-will-probate | How to Write a Valid Will and Understand Probate | bundled | Eleanor Whitfield | Person | noindex, follow |
| kamala-harris-prosecutorial-discretion-and-criminal-justice | Prosecutorial Discretion and Criminal Justice Reform: The Jurisprudential Legacy of State Attorneys General | bundled | Law Elite Network Editorial Board | Organization | noindex, follow |
| landlord-vs-tenant-who-pays-for-repairs | Landlord vs Tenant: Who Pays for Repairs? | bundled | Daniel Okafor | Person | noindex, follow |
| lcia-arbitration-costs-administrative-fees-calculated | How LCIA Arbitration Costs Are Calculated | bundled | Marcus Whitfield | Person | noindex, follow |
| lcia-expedited-formation-emergency-arbitrator-mechanics | LCIA Expedited Formation and Emergency Arbitrator Rules | bundled | Marcus Whitfield | Person | noindex, follow |
| lcia-international-arbitration-london-practitioner-guide | A Practitioner's Guide to LCIA Arbitration in London | bundled | Marcus Whitfield | Person | noindex, follow |
| lcia-vs-icc-rules-cross-border-arbitration | LCIA vs ICC Rules: Choosing an Arbitration Institution | bundled | Marcus Whitfield | Person | noindex, follow |
| lebron-james-springhill-company-nil-regulations-klutch-sports | LeBron James: SpringHill Company Corporate Structure, NIL Regulations & Klutch Sports Compliance | bundled | David Thorne | Person | noindex, follow |
| legal-research-for-beginners-free-tools | Legal Research for Beginners: Free Tools That Actually Work | bundled | Law Elite Editorial Team | Organization | index, follow |
| legal-writing-basics-before-and-after-creac-examples | Legal Writing Basics: Before-and-After CREAC Examples | bundled | Law Elite Editorial Team | Organization | index, follow |
| lionel-messi-tax-settlement-image-rights-mls-contract | Lionel Messi: Tax Settlement Precedents, Image Rights Litigation & MLS Contract Breakdown | bundled | Elena Rostova | Person | index, follow |
| llc-vs-corporation | LLC vs Corporation: Which Should You Choose? | bundled | Marcus Hale | Person | noindex, follow |
| master-recording-rights-music-publishing-valuation-disputes | Master Recording Rights & Music Publishing Valuation Disputes | bundled | Marcus Vance | Person | noindex, follow |
| mediation-explained-settling-without-trial | Mediation Explained: How Disputes Settle Without a Trial | bundled | Marcus Whitfield | Person | noindex, follow |
| miranda-rights-explained | What Are Your Miranda Rights? A Plain-Language Guide | bundled | Aisha Rahman | Person | noindex, follow |
| misdemeanor-vs-felony | Misdemeanor vs Felony: What Is the Difference? | bundled | Daniel Okafor | Person | noindex, follow |
| nba-collective-bargaining-agreement-second-apron-luxury-tax-rules | NBA Collective Bargaining Agreement: Second Apron Luxury Tax Rules & Free Agency Mechanics | bundled | Marcus Vance | Person | noindex, follow |
| non-compete-enforceability-by-state-us | Non-Compete Enforceability by State in the U.S. | bundled (CMS record also exists; CMS wins at runtime) | Daniel Okoro | Person | noindex, follow |
| ontario-non-compete-ban-vs-rest-of-canada | Ontario's Non-Compete Ban vs. the Rest of Canada | bundled (CMS record also exists; CMS wins at runtime) | Daniel Okoro | Person | noindex, follow |
| page-six-legal-analysis-defamation-right-of-publicity-paparazzi-litigation | Page Six Legal Analysis: Defamation, Right of Publicity & Celebrity Paparazzi Litigation | bundled | Elena Rostova | Person | index, follow |
| peak-tv-contract-renegotiations-wga-residual-structures | Peak TV Contract Renegotiations & Writers Guild Residual Structures | bundled | Sarah Jenkins | Person | noindex, follow |
| power-of-attorney-explained | Power of Attorney Explained: Types and How It Works | bundled | Daniel Okafor | Person | noindex, follow |
| prenuptial-agreements-what-they-can-and-cannot-do | Prenuptial Agreements: What They Can and Cannot Do | bundled | Sofia Almeida | Person | noindex, follow |
| principal-residence-exemption-canada | Canada's Principal Residence Exemption Explained | bundled | Priya Nair | Person | noindex, follow |
| property-settlement-after-separation-australia | Property Settlement After Separation in Australia | bundled (CMS record also exists; CMS wins at runtime) | Sofia Almeida | Person | noindex, follow |
| right-to-silence-australia | The Right to Silence in Australia Explained | bundled | Aisha Rahman | Person | noindex, follow |
| right-to-silence-uk-police-caution | The Right to Silence in the UK: The Police Caution Explained | bundled | Aisha Rahman | Person | noindex, follow |
| shareholder-agreements-explained | What Is a Shareholder Agreement? | bundled | Elena Rossi | Person | noindex, follow |
| small-claims-court-guide | Small Claims Court: A Practical Guide | bundled | Marcus Whitfield | Person | noindex, follow |
| startup-law-basics-for-founders | Startup Law Basics Every Founder Should Know | bundled | Priya Menon | Person | noindex, follow |
| streaming-platform-carriage-disputes-global-distribution-licensing | Streaming Platform Carriage Disputes & Global Distribution Licensing | bundled | David Thorne | Person | noindex, follow |
| taylor-swift-master-recording-ip-rights-analysis | Music Master Recordings, Re-Recording Rights, and Copyright Ownership under U.S. Intellectual Property Law | bundled | Law Elite Network Editorial Board | Organization | noindex, follow |
| taylor-swift-masters-who-owns-a-recording-explained | Who Owns a Song? Taylor Swift, Her Masters, and the Two Copyrights Behind Every Recording | bundled | DRAFT — pending editor review | Organization | noindex, follow |
| tenancy-deposit-protection-uk | Tenancy Deposit Protection in England | bundled | Daniel Okafor | Person | noindex, follow |
| the-eviction-process-explained | The Eviction Process Explained | bundled | Waki Malik | Person | noindex, follow |
| tom-hanks-ai-likeness-copyright-enforcement-sag-aftra | Tom Hanks: AI Likeness Copyright Enforcement & SAG-AFTRA Synthetic Performance Standards | bundled | Elena Rostova | Person | index, follow |
| trademark-vs-copyright-difference | Trademark vs Copyright: What's the Difference? | bundled | Priya Nair | Person | noindex, follow |
| uk-company-formation-companies-house | Forming a UK Private Limited Company | bundled (CMS record also exists; CMS wins at runtime) | Elena Rossi | Person | noindex, follow |
| uk-gdpr-vs-eu-gdpr | UK GDPR vs. EU GDPR: How They Differ Today | bundled (CMS record also exists; CMS wins at runtime) | Marcus Hale | Person | noindex, follow |
| understanding-corporate-tax-basics | Understanding Corporate Tax Basics | bundled | Priya Nair | Person | noindex, follow |
| understanding-your-rights-as-a-tenant | Understanding Your Rights as a Tenant | bundled | Daniel Okafor | Person | noindex, follow |
| unfair-dismissal-australia-fair-work-commission | Unfair Dismissal in Australia: The Fair Work Process | bundled | Daniel Okoro | Person | noindex, follow |
| unfair-dismissal-uk-guide | Unfair Dismissal in the UK: Rights and 2027 Changes | bundled | Daniel Okoro | Person | noindex, follow |
| vat-vs-sales-tax | VAT vs Sales Tax: What Is the Difference? | bundled | Daniel Okafor | Person | noindex, follow |
| what-are-tax-deductions | What Are Tax Deductions and How Do They Work? | bundled | Priya Nair | Person | noindex, follow |
| what-belongs-in-an-employment-contract | What Belongs in an Employment Contract? | bundled | Priya Nair | Person | noindex, follow |
| what-is-a-class-action-lawsuit | What Is a Class Action Lawsuit? | bundled | Marcus Whitfield | Person | noindex, follow |
| what-is-a-living-trust | What Is a Living Trust and Do You Need One? | bundled | Eleanor Whitfield | Person | noindex, follow |
| what-is-a-non-compete-agreement | What Is a Non-Compete Agreement? | bundled | Priya Nair | Person | noindex, follow |
| what-is-a-non-disclosure-agreement-nda | What Is a Non-Disclosure Agreement (NDA)? | bundled | Elena Rossi | Person | noindex, follow |
| what-is-a-patent-and-how-to-get-one | What Is a Patent and How Do You Get One? | bundled | Marcus Hale | Person | noindex, follow |
| what-is-a-severance-agreement | What Is a Severance Agreement? | bundled | Maria Harizanova | Person | noindex, follow |
| what-is-a-tax-audit | What Is a Tax Audit and What Should You Do? | bundled | Claire Hannon | Person | noindex, follow |
| what-is-an-easement-in-property-law | What Is an Easement in Property Law? | bundled | Priya Nair | Person | noindex, follow |
| what-is-an-s-corporation | What Is an S Corporation? The Tax Election Explained | bundled | Elena Rossi | Person | noindex, follow |
| what-is-at-will-employment | What Is At-Will Employment? | bundled | Daniel Okoro | Person | noindex, follow |
| what-is-capital-gains-tax | What Is Capital Gains Tax and How Does It Work? | bundled | Priya Nair | Person | noindex, follow |
| what-is-white-collar-crime | What Is White-Collar Crime? | bundled | Daniel Okafor | Person | noindex, follow |
| what-to-check-before-buying-property | What to Check Before Buying Property | bundled | Priya Nair | Person | noindex, follow |
| when-is-a-dismissal-wrongful-termination | When Is a Dismissal Considered Wrongful Termination? | bundled | Daniel Okoro | Person | noindex, follow |
| wrongful-dismissal-canada-reasonable-notice | Wrongful Dismissal in Canada: Reasonable Notice | bundled | Daniel Okoro | Person | noindex, follow |
| your-rights-during-a-police-search | Your Rights During a Police Search | bundled | Aisha Rahman | Person | noindex, follow |
| your-rights-if-you-are-arrested | What Are Your Rights If You Are Arrested? | bundled | Aisha Rahman | Person | noindex, follow |
