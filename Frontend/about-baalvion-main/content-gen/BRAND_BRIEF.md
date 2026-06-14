# Baalvion — Brand Brief & Content Contract (READ FULLY BEFORE WRITING)

You are writing authoritative content for **about.baalvion.com**, the corporate site of
**Baalvion Industries** (the Baalvion Group). Every piece must be factually consistent with
the brand facts below, written for a senior enterprise audience, and **free of generic AI fluff**.

## Who Baalvion is (ground truth — do not contradict)
- Baalvion Industries builds and operates the **Baalvion Operating System (BOS)** — a unified
  global trade infrastructure connecting **commerce, finance, compliance, logistics, and
  intelligence** into one multi-tenant platform.
- Scale claims you may use: operating across **198 markets / 180+ jurisdictions**, **125+ active
  partners**, **500K+ transactions**. Founded/headquartered in **New Delhi, NCR, India**.
- BOS is organised into five layers: **Infrastructure, Intelligence, Governance, Commerce, Finance**.
- Properties in the ecosystem include: the Baalvion Trade Platform, AI Market Intelligence,
  a Governance & Compliance Suite, Mining Operations, and a Luxury Commerce Network (Amarisé).
- Engineering culture: **infrastructure-grade, compliance-first, multi-tenant, transparent,
  auditable**. AES-256 encryption, SOC 2 Type II, ISO 27001, GDPR, KYC/AML.
- Contact: **intel@baalvion.nexus**, New Delhi, NCR, IN.

## Voice
- Confident, precise, technical-but-readable. Senior-engineer / CTO register.
- Concrete: name real technologies, patterns, trade-offs, and metrics. No empty superlatives.
- Position generic topics **through Baalvion's lens** as a company that builds large-scale
  enterprise software and the BOS platform — not a generic outsourcing agency.
- British/American mix is fine; be consistent within a piece. No emoji. No "In today's fast-paced world".

## Hard requirements per piece
- Word count as specified (articles 1100–1800 words; services/industries 800–1200; case studies 900–1400; company 600–1000).
- Structured headings (H2/H3). Real substance under each heading.
- An **FAQ** section: 4–6 genuine question/answer pairs.
- 3–6 **internal links** pointing ONLY to real targets from the SLUG CATALOG below. Use natural anchor text.
- SEO title (≤60 chars ideally), meta description (140–160 chars), 5–10 keywords.
- No lorem ipsum, no placeholders, no "[insert]", no TODO.

## SLUG CATALOG — the ONLY valid internal-link targets
Use these exact hrefs for internal links:

Company / core:
- `/` (home), `/company` (What We Do), `/platform`, `/ecosystem`, `/projects`,
  `/leadership`, `/careers`, `/contact`, `/trust`, `/investors`, `/news`
- `/about/mission`, `/about/vision`, `/about/story`, `/about/why-baalvion`

Services (`/services` and `/services/<slug>`):
- custom-software-development, web-development, mobile-development, ai-solutions, ai-agents,
  automation, cloud-solutions, devops, enterprise-software, technology-consulting

Industries (`/industries` and `/industries/<slug>`):
- healthcare, finance, manufacturing, retail, logistics, education, real-estate, saas

Case studies (`/case-studies` and `/case-studies/<slug>`):
- unifying-global-trade-operations, real-time-cross-border-settlement, ai-compliance-scoring-platform,
  mining-operations-command-center, luxury-commerce-marketplace, multi-tenant-identity-platform,
  automated-customs-clearance, enterprise-data-lakehouse, fraud-detection-engine, logistics-control-tower

Articles (`/news/<category>/<slug>`) — categories are `tech`, `insights`, or `finance`:
(see the article list in the workflow prompt; link to articles as `/news/<category>/<slug>`)

## JSON OUTPUT CONTRACT (write exactly this shape to the file path given to you)
```json
{
  "slug": "kebab-slug",
  "title": "Human title",
  "kind": "article|service|industry|case_study|company",
  "category": "tech|insights|finance (articles only; else omit)",
  "seo": { "title": "...", "description": "...", "keywords": ["..."] },
  "author": "Name (articles only)",
  "readTime": "N min read (articles only)",
  "heroImageSeed": "short-seed-for-picsum",
  "excerpt": "1-2 sentence summary (≤200 chars)",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Section title" },
    { "type": "paragraph", "text": "..." },
    { "type": "list", "ordered": false, "items": ["...", "..."] }
  ],
  "faqs": [ { "q": "Question?", "a": "Answer." } ],
  "internalLinks": [ { "anchor": "text", "href": "/services/ai-solutions" } ],
  "customFields": { }   // service: {benefits:[],process:[{step,desc}],techStack:[]} ; industry: {challenges:[],solutions:[]} ; case_study: {client, sector, challenge, solution, architecture, techStack:[], results:[{metric,value}], lessons:[]}
}
```
Write valid JSON only. The `blocks` array IS the page body (1100+ words of real prose for articles).
Do NOT include the FAQ inside blocks — put it in `faqs`. Internal links should ALSO appear naturally
inside paragraph text (as markdown `[anchor](/href)`), and be listed in `internalLinks`.
