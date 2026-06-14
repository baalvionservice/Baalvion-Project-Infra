# Phase 6 — Schema Markup (JSON-LD)

All examples use `https://jobs.baalvion.com`. Render JSON-LD server-side in a `<script type="application/ld+json">` tag. Validate every type with Google's **Rich Results Test** and **Schema Markup Validator** before shipping. Replace placeholder values from your DB.

> Implementation helper (Next.js):
> ```tsx
> // src/components/seo/JsonLd.tsx
> export function JsonLd({ data }: { data: object }) {
>   return <script type="application/ld+json"
>     dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
> }
> ```
> Multiple schemas on one page: emit multiple `<script>` tags, or one `@graph` array.

---

## 1. Organization (site-wide — render in root layout)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://jobs.baalvion.com/#organization",
  "name": "Baalvion Jobs",
  "alternateName": "Baalvion",
  "url": "https://jobs.baalvion.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://jobs.baalvion.com/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "Baalvion is an online job portal connecting employers and job seekers in India, focused on technology, software, remote, startup, and professional jobs.",
  "foundingDate": "2025",
  "sameAs": [
    "https://www.linkedin.com/company/baalvion",
    "https://twitter.com/baalvion",
    "https://www.facebook.com/baalvion",
    "https://www.instagram.com/baalvion"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@baalvion.com",
    "url": "https://jobs.baalvion.com/contact",
    "areaServed": "IN",
    "availableLanguage": ["en", "hi"]
  }
}
```
**Why:** Establishes the brand entity for knowledge-panel eligibility and EEAT; `sameAs` ties social profiles to the entity. Keep `name`, `logo`, and `sameAs` consistent everywhere.

---

## 2. WebSite + SearchAction (Home)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://jobs.baalvion.com/#website",
  "url": "https://jobs.baalvion.com",
  "name": "Baalvion Jobs",
  "publisher": { "@id": "https://jobs.baalvion.com/#organization" },
  "inLanguage": "en-IN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://jobs.baalvion.com/jobs?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```
**Why:** Enables a sitelinks search box in Google and reinforces the site entity. The `target` must be a real, working search URL.

---

## 3. BreadcrumbList (every page with breadcrumbs)

Example for `/jobs/devops-engineer/51002-aws-devops-engineer-acme`:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jobs.baalvion.com/" },
    { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://jobs.baalvion.com/jobs" },
    { "@type": "ListItem", "position": 3, "name": "DevOps Engineer Jobs", "item": "https://jobs.baalvion.com/jobs/devops-engineer" },
    { "@type": "ListItem", "position": 4, "name": "AWS DevOps Engineer at Acme" }
  ]
}
```
**Why:** Produces breadcrumb rich results (better SERP appearance + CTR) and reinforces site hierarchy. The last item omits `item` (it's the current page).

---

## 4. JobPosting (every job page — THE critical one)

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "AWS DevOps Engineer",
  "description": "<p>Acme is hiring an AWS DevOps Engineer to own our CI/CD pipelines and Kubernetes platform...</p><h3>Responsibilities</h3><ul><li>...</li></ul><h3>Requirements</h3><ul><li>5+ years...</li></ul>",
  "identifier": {
    "@type": "PropertyValue",
    "name": "Baalvion Jobs",
    "value": "51002"
  },
  "datePosted": "2026-06-09",
  "validThrough": "2026-07-09T23:59:59+05:30",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Acme Technologies",
    "sameAs": "https://www.acme.com",
    "logo": "https://jobs.baalvion.com/companies/acme/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kharadi",
      "addressLocality": "Pune",
      "addressRegion": "MH",
      "postalCode": "411014",
      "addressCountry": "IN"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "INR",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 1800000,
      "maxValue": 2800000,
      "unitText": "YEAR"
    }
  },
  "experienceRequirements": {
    "@type": "OccupationalExperienceRequirements",
    "monthsOfExperience": 60
  },
  "directApply": true,
  "url": "https://jobs.baalvion.com/jobs/devops-engineer/51002-aws-devops-engineer-acme"
}
```

### Remote variant (replace `jobLocation` block)
```json
{
  "jobLocationType": "TELECOMMUTE",
  "applicantLocationRequirements": {
    "@type": "Country",
    "name": "India"
  }
}
```
For **hybrid**, keep `jobLocation` (the office) AND you may omit `jobLocationType`. For **fully remote**, use `jobLocationType: TELECOMMUTE` + `applicantLocationRequirements` and you may omit `jobLocation`.

**Critical rules (Google for Jobs eligibility):**
- `title`, `description` (HTML allowed), `datePosted`, `hiringOrganization`, and a valid location (or TELECOMMUTE) are **required**.
- `validThrough` must be present and accurate; when the job expires, it must be a past date AND the page must be `noindex`/removed (Phase 5 §6).
- `description` must match the visible job description (no cloaking).
- `baseSalary` strongly recommended — improves CTR and is increasingly expected.
- Place this JSON-LD on the job's own page only; never put `JobPosting` on aggregation/hub pages.
- One `JobPosting` per page.

**Why:** This structured data is what makes a listing eligible for the Google for Jobs widget — the highest-intent placement available to a job board. Errors here = invisibility in the most valuable surface.

---

## 5. FAQPage (hubs, job pages, blog — where real Q&A exists)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How many DevOps engineer jobs are available in Pune?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Baalvion currently lists dozens of live DevOps engineer openings in Pune, updated daily. Browse the latest roles and filter by experience and work mode."
      }
    },
    {
      "@type": "Question",
      "name": "What is the salary of a DevOps engineer in Pune?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DevOps engineers in Pune typically earn ₹8–24 LPA depending on experience, cloud expertise, and company. See our DevOps salary guide for detail."
      }
    }
  ]
}
```
**Rules:** only mark up FAQs that are **visible on the page**; answers must be genuine. Don't stuff keywords. Note Google has narrowed FAQ rich-result display, but the markup still aids understanding and can show for authoritative sites — keep it where Q&A is real.

**Why:** Can earn expanded SERP real estate and reinforces topical coverage; pairs naturally with the FAQ blocks specified in Phases 2–3.

---

## 6. Article / BlogPosting (every blog post)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://jobs.baalvion.com/blog/software-developer-salary-india"
  },
  "headline": "Software Developer Salary in India 2026 (By Experience & City)",
  "description": "A complete 2026 breakdown of software developer salaries in India by experience level and city, with negotiation tips.",
  "image": [
    "https://jobs.baalvion.com/blog/software-developer-salary-india/cover.jpg"
  ],
  "datePublished": "2026-06-11T09:00:00+05:30",
  "dateModified": "2026-06-11T09:00:00+05:30",
  "author": {
    "@type": "Person",
    "name": "Priya Nair",
    "url": "https://jobs.baalvion.com/blog/author/priya-nair",
    "jobTitle": "Careers Editor, Baalvion"
  },
  "publisher": { "@id": "https://jobs.baalvion.com/#organization" },
  "inLanguage": "en-IN",
  "articleSection": "Salary"
}
```
**Why:** Article rich-result eligibility, and `author` + `publisher` are core EEAT signals for careers/income content. Keep `dateModified` honest and update it when you refresh the post.

---

## 7. ItemList (role / city / role×city hubs — optional but recommended)

Signals that the page is a curated list of jobs (the individual `JobPosting` data lives on each job's own page):

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "DevOps Engineer Jobs in Pune",
  "itemListOrder": "https://schema.org/ItemListOrderDescending",
  "numberOfItems": 24,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://jobs.baalvion.com/jobs/devops-engineer/51002-aws-devops-engineer-acme" },
    { "@type": "ListItem", "position": 2, "url": "https://jobs.baalvion.com/jobs/devops-engineer/51010-kubernetes-engineer-globex" }
  ]
}
```
**Why:** Helps Google understand hub pages as job collections and can support list-style understanding; pairs with `BreadcrumbList` + `FAQPage` on the same hub.

---

## 8. Schema-per-page-type matrix

| Page type | Organization* | WebSite | BreadcrumbList | JobPosting | ItemList | FAQPage | Article |
|---|---|---|---|---|---|---|---|
| Home | ✅ | ✅ | — | — | — | optional | — |
| Role hub | ✅ | — | ✅ | — | ✅ | ✅ | — |
| City hub | ✅ | — | ✅ | — | ✅ | ✅ | — |
| Role×City | ✅ | — | ✅ | — | ✅ | ✅ | — |
| Remote/Fresher role | ✅ | — | ✅ | — | ✅ | ✅ | — |
| Job posting | ✅ | — | ✅ | ✅ | — | optional | — |
| Salary page | ✅ | — | ✅ | — | — | ✅ | optional |
| Blog post | ✅ | — | ✅ | — | — | optional | ✅ |
| Employers | ✅ | — | ✅ | — | — | ✅ | — |
| About | ✅ | — | ✅ | — | — | — | — |

\* Organization is rendered once in the root layout (with `@id`), then referenced by `@id` elsewhere — no need to repeat the full object.

**Validation gate (CI):** add a build/test step that runs each page-type's JSON-LD through schema validation; fail the build on `JobPosting` errors specifically, since those break Google for Jobs.
