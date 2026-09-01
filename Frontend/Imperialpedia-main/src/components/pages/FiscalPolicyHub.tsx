import Link from "next/link";
import Image from "next/image";
import {
  PiggyBank,
  Wallet,
  CreditCard,
  HandCoins,
  Home,
  Car,
  GraduationCap,
  Landmark,
  Star,
  Calculator,
  BookOpen,
  Newspaper,
  ArrowRight,
} from "lucide-react";

const FISCALPOLICY_FAQS: FaqItem[] = [
  { question: "What is FiscalPolicy?", answer: "FiscalPolicy is a financial product/service that helps you manage your money effectively.", link: { label: "Learn more about FiscalPolicy", href: "/fiscalpolicy" } },
  { question: "How does FiscalPolicy work?", answer: "FiscalPolicy works by providing features such as ... (brief description).", link: { label: "Learn more about FiscalPolicy", href: "/fiscalpolicy" } },
  { question: "Who should consider FiscalPolicy?", answer: "Anyone looking to improve their fiscalpolicy situation can benefit.", link: { label: "Learn more about FiscalPolicy", href: "/fiscalpolicy" } },
  { question: "What are common fees for FiscalPolicy?", answer: "Typical fees include ... and can often be avoided with ...", link: { label: "Learn more about FiscalPolicy", href: "/fiscalpolicy" } },
  { question: "How to compare FiscalPolicy options?", answer: "Look at interest rates, fees, features, and user reviews to decide.", link: { label: "Learn more about FiscalPolicy", href: "/fiscalpolicy" } },
];

const FISCALPOLICY_PRODUCT_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "fiscalpolicy", label: "FiscalPolicy Overview", icon: Star },
  { slug: "fiscalpolicy-tips", label: "FiscalPolicy Tips", icon: Star },
  { slug: "fiscalpolicy-reviews", label: "FiscalPolicy Reviews", icon: Star },
];

const FISCALPOLICY_KEY_TERMS: KeyTermItem[] = [
  { term: "FiscalPolicy Basics", definition: "An overview of fiscalpolicy fundamentals, covering core concepts and why they matter.", href: "/fiscalpolicy" },
  { term: "Advanced FiscalPolicy", definition: "Deep dive into advanced aspects of fiscalpolicy, including strategies and best practices.", href: "/fiscalpolicy" },
  { term: "FiscalPolicy Fees", definition: "Explanation of typical fees associated with fiscalpolicy and how to minimize them.", href: "/fiscalpolicy" },
  { term: "FiscalPolicy Benefits", definition: "Key advantages of using fiscalpolicy for personal finance management.", href: "/fiscalpolicy" },
  { term: "FiscalPolicy Risks", definition: "Potential risks and pitfalls to watch out for when dealing with fiscalpolicy.", href: "/fiscalpolicy" },
];

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { TrustBar } from "@/components/pages/TrustBar";
import { TopicCard } from "@/components/pages/TopicCard";
import { ProductSection } from "@/components/pages/ProductSection";
import { ComparisonsSection, findComparisons } from "@/components/pages/ComparisonsSection";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import EditorialHeader from "@/components/pages/EditorialHeader";
import { EditorialSpotlight } from "@/components/pages/EditorialSpotlight";
import { InvestopediaKeyTerms, type KeyTermItem } from "@/components/pages/InvestopediaKeyTerms";
import { InvestopediaFaqBox, type FaqItem } from "@/components/pages/InvestopediaFaqBox";
import { EditorialArticleGuide } from "@/components/pages/EditorialArticleGuide";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQAccordionSection from "@/components/faq/FAQAccordionSection";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "banking";
const TOPIC_FETCH_LIMIT = 12;

/** The 9 real product-topic slugs behind the dashboard + product sections. */
const PRODUCT_TOPICS: Array<{
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "savings", label: "Savings Accounts", icon: PiggyBank },
  { slug: "checking", label: "Checking Accounts", icon: Wallet },
  { slug: "credit-cards", label: "Credit Cards", icon: CreditCard },
  { slug: "loans", label: "Personal Loans", icon: HandCoins },
  { slug: "mortgages", label: "Mortgages", icon: Home },
  { slug: "auto-loans", label: "Auto Loans", icon: Car },
  { slug: "student-loans", label: "Student Loans", icon: GraduationCap },
  { slug: "cd-rates", label: "CD Rates", icon: Landmark },
  { slug: "money-market", label: "Money Market Accounts", icon: Landmark },
];

/** Real review-category slugs — a dedicated area, never mixed into the guide sections.
 * "bank-reviews" and "credit-card-reviews" previously listed here don't exist as CMS
 * categories or page routes (verified: 0 published articles under either slug, and
 * neither has a src/app route) — every card rendered from them linked to a permanent
 * 404 with a "0 reviews" count. "banking-reviews" is the real, populated category that
 * covers both banks and cards (same slug used in the Navbar's "Banking Reviews" link). */
const REVIEW_TOPICS: Array<{ slug: string; label: string }> = [
  { slug: "banking-reviews", label: "Banking Reviews" },
  { slug: "loan-reviews", label: "Loan Reviews" },
  { slug: "app-reviews", label: "App Reviews" },
];

/** Real calculator pages that exist today (see src/services/mock-api/calculators.ts). */
const CALCULATORS = [
  { href: "/financial-tools/loan", label: "Loan & Mortgage Calculator" },
  { href: "/financial-tools/compound-interest", label: "Savings & Compound Interest Calculator" },
  { href: "/financial-tools", label: "All Financial Tools" },
];

/** Evergreen explainer pages that exist today, kept out of the news feed entirely. */
const BANKING_GUIDES = [
  { href: "/interest-rates", label: "How Interest Rates Affect Your Money" },
  { href: "/credit", label: "Understanding Your Credit Score" },
  { href: "/debt", label: "Managing and Paying Down Debt" },
];

const EXPLORE_MORE = [
  { href: "/investing", label: "Investing" },
  { href: "/market-news", label: "Market News" },
  { href: "/economy", label: "Economy" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/reviews", label: "Reviews" },
];

/** Core financial terms matching Investopedia's taxonomy pattern and screenshots. */
const BANKING_KEY_TERMS: KeyTermItem[] = [
  {
    term: "Deposit",
    definition:
      "A deposit with a bank refers to money held by the financial institution in a customer account. Deposits are held by banks for safekeeping and typically earn interest depending on the type of account.",
    href: "/savings",
  },
  {
    term: "Checking Account",
    definition:
      "A checking account is a type of bank account held at a financial institution that permits withdrawals and deposits on a daily transactional basis. Checking accounts are highly liquid and accessible via debit cards, ATMs, and online transfers.",
    href: "/checking",
  },
  {
    term: "Federal Deposit Insurance Corporation (FDIC)",
    definition:
      "The Federal Deposit Insurance Corporation (FDIC) is an independent federal agency insuring deposits in U.S. banks to protect customers from bank failures, providing up to $250,000 per depositor per institution.",
    href: "/banking",
  },
  {
    term: "Bank Statement",
    definition:
      "A bank statement is an official summary of financial transactions occurring within a given monthly cycle for a bank account, detailing deposits, withdrawals, and ending balance.",
    href: "/banking",
  },
  {
    term: "Underbanked",
    definition:
      "Underbanked refers to individuals or families who have a bank account but often rely on alternative financial services like money orders, check-cashing outlets, and payday lenders.",
    href: "/banking",
  },
];

/** Investopedia curated FAQ items matching screenshot 1. */
const INVESTOPEDIA_FAQS: FaqItem[] = [
  {
    question: "How does banking in the 21st century work?",
    answer:
      "Banking in the 21st century means being able to conduct all transactions digitally without needing to physically visit a branch location. Deposits, withdrawals, payments, and transfers can be conducted online or by phone app as well as applications for credit cards and loans.",
    link: { label: "Learn More: Digital & Mobile Banking Guide", href: "/banking" },
  },
  {
    question: "How does banking work?",
    answer:
      "Banks are a vital part of the economy because they provide secure custody for deposits, issue loans, and facilitate payments. Consumers can deposit funds, earn interest in savings accounts, and conduct everyday transactions using checking accounts and digital apps.",
    link: { label: "Bank Definition: How Does Banking Work?", href: "/banking" },
  },
  {
    question: "What is the history of deposit insurance?",
    answer:
      "The federal government began offering insurance on bank deposits in 1933 through the creation of the FDIC after thousands of banks failed during the Great Depression. The FDIC protects consumers up to $250,000 per account.",
    link: { label: "The History of the FDIC", href: "/banking" },
  },
  {
    question: "Are big banks a safer option for deposits?",
    answer:
      "Larger banks typically provide significant stability and extensive branch/ATM networks. Any FDIC-insured institution—large or community-based—guarantees protection up to $250,000 per depositor.",
    link: { label: "Reasons Why Big Banks May Be a Wise Option", href: "/banking" },
  },
  {
    question: "What is a national bank?",
    answer:
      "A national bank is a commercial bank chartered by the U.S. Comptroller of the Currency that operates as a member of the Federal Reserve System and participates in mandatory FDIC deposit insurance.",
    link: { label: "National Bank Definition", href: "/banking" },
  },
  {
    question: "What are bank fees?",
    answer:
      "Bank fees are charges levied for account maintenance, out-of-network ATM use, overdrafts, wire transfers, and paper statements. Many modern accounts waive these fees with direct deposit.",
    link: { label: "Bank Fees Definition", href: "/banking" },
  },
];

/** Evergreen conceptual FAQs — general finance education, not time-bound facts —
 * used only to top up the CMS-aggregated list below a useful minimum. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "How much money should I keep in a savings account?",
    answer:
      "Most planners suggest keeping 3–6 months of essential expenses in an easily accessible savings account as an emergency fund, with any additional cash allocated toward higher-yield accounts or investments depending on your goals and timeline.",
  },
  {
    question: "Are online banks safe?",
    answer:
      "Yes, as long as the bank is FDIC-insured (or NCUA-insured for credit unions) — your deposits are protected up to the standard limit the same way they would be at a traditional branch bank. Online banks are regulated the same as brick-and-mortar banks.",
  },
  {
    question: "What is the difference between checking and savings?",
    answer:
      "A checking account is built for frequent transactions — paying bills, debit card purchases, and transfers — and typically pays little to no interest. A savings account is meant to hold money you're not spending immediately and usually pays a higher interest rate in exchange for fewer transactions.",
  },
  {
    question: "How do banks calculate interest?",
    answer:
      "Banks calculate interest based on your balance, the account's annual percentage yield (APY), and how often interest compounds (daily, monthly, or quarterly). Compounding more frequently means slightly more interest earned over a year at the same stated rate.",
  },
  {
    question: "Should I pay debt or save first?",
    answer:
      "A common approach is to build a small starter emergency fund first, then prioritize paying off high-interest debt (like credit cards) before aggressively building savings — since high interest rates on debt typically outpace what a savings account can earn.",
  },
  {
    question: "How many bank accounts should I have?",
    answer:
      "There's no fixed rule, but a common setup is one checking account for daily spending, one savings account for your emergency fund, and additional accounts for specific goals — enough to stay organized without adding maintenance you won't keep up with.",
  },
  {
    question: "What credit score do I need?",
    answer:
      "It depends on the product: many rewards credit cards and the best mortgage rates want a score of 690+ (good) or 720+ (very good), while some starter or secured cards accept fair (580+) or even no credit history at all.",
  },
];

/** Claims articles into a section while skipping any slug already used by an
 * earlier section — keeps the same guide from appearing twice across the hub. */
function makeClaimer() {
  const used = new Set<string>();
  return function claimUnique(list: NewsArticle[], n: number): NewsArticle[] {
    const out: NewsArticle[] = [];
    for (const a of list) {
      if (used.has(a.slug)) continue;
      out.push(a);
      used.add(a.slug);
      if (out.length >= n) break;
    }
    return out;
  };
}

/** CMS-first fetch for a single topic slug, same fallback chain used site-wide. */
async function fetchTopicArticles(slug: string, limit: number): Promise<NewsArticle[]> {
  let items = await getCategoryArticles(slug, limit);
  if (items.length) return items;

  items = staticCategoryNews(slug).slice(0, limit);
  if (items.length) return items;

  const cat = staticCategoryFor(slug);
  return (cat ? newsArticles.filter((a) => a.category === cat) : []).slice(0, limit);
}

/**
 * Dedicated Banking hub — Bankrate/NerdWallet-style knowledge center: a topic
 * dashboard, curated "Start Here" picks, eight real per-product sections
 * (pillar + supporting guides), a dedicated reviews area, real "vs." comparison
 * pieces, working calculators, a recency-sorted news strip kept separate from
 * evergreen guides, FAQ, and newsletter — all sourced live from cms-service,
 * falling back to the baked snapshot then bundled demo content exactly like
 * every other topic page. A single shared "claimer" dedupes articles across
 * every section so nothing repeats.
 */
export async function FiscalPolicyHub() {
  const copy = topicCopy(SLUG);

  // 1) Main feed — same CMS-first fallback chain as every other topic page.
  let articles: NewsArticle[] = await getCategoryArticles(SLUG, 40);
  let isLive = articles.length > 0;
  if (!isLive) {
    const baked = staticCategoryNews(SLUG);
    if (baked.length) {
      articles = baked;
      isLive = true;
    }
  }
  if (!isLive) {
    const cat = staticCategoryFor(SLUG);
    articles = cat ? newsArticles.filter((a) => a.category === cat) : [];
  }

  const claim = makeClaimer();

  const featured = articles.find((a) => a.featured) ?? articles[0];
  if (featured) claim([featured], 1); // reserve it so it can't resurface elsewhere
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = claim(rest, 3);

  // 2) Every product + review topic, fetched in parallel.
  const ALL_TOPIC_SLUGS = [...PRODUCT_TOPICS.map((t) => t.slug), ...REVIEW_TOPICS.map((t) => t.slug)];
  const topicEntries = await Promise.all(
    ALL_TOPIC_SLUGS.map(async (slug) => [slug, await fetchTopicArticles(slug, TOPIC_FETCH_LIMIT)] as const)
  );
  const byTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) "Start Here" — a beginner overview pick plus the lead guide from the
  //    three most-searched products, all real, all deduped against everything else.
  const startHere = [
    ...claim(rest, 1),
    ...claim(byTopic.savings ?? [], 1),
    ...claim(byTopic["credit-cards"] ?? [], 1),
    ...claim(byTopic.loans ?? [], 1),
  ];

  // 4) Banking Products — pillar + supporting grid per product, CDs and money
  //    market combined into one "savings alternatives" section per the brief.
  const productSections = PRODUCT_TOPICS.filter((t) => t.slug !== "money-market").map((t) => {
    const pool =
      t.slug === "cd-rates" ? [...(byTopic["cd-rates"] ?? []), ...(byTopic["money-market"] ?? [])] : byTopic[t.slug] ?? [];
    return {
      slug: t.slug,
      label: t.slug === "cd-rates" ? "CDs & Money Market Accounts" : t.label,
      icon: t.icon,
      articles: claim(pool, 5),
    };
  });

  // 5) Banking Reviews — real counts + links, kept entirely separate from the guides above.
  const reviewCards = REVIEW_TOPICS.map((t) => ({ ...t, count: byTopic[t.slug]?.length ?? 0 }));

  // 6) Banking Comparisons — real "vs." pieces found across every fetched pool, deduped.
  const comparisonCandidates = [...rest, ...Object.values(byTopic).flat()];
  const comparisons = claim(findComparisons(comparisonCandidates, 6), 6);

  // 7) Banking News — a small recency-sorted strip, visually and structurally
  //    separate from the evergreen Banking Guides section below.
  const bankingNews = claim(
    [...rest].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    4
  );

  // 8) Dashboard counts — the fetched-array length, honestly labelled "N+" when
  //    it hits the fetch cap (there may be more than we pulled for the count).
  const dashboardCards = [
    ...PRODUCT_TOPICS,
    { slug: "banking-reviews", label: "Banking Reviews", icon: Star },
  ].map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    description: topicCopy(t.slug).description,
    count:
      t.slug === "banking-reviews"
        ? reviewCards.reduce((sum, r) => sum + r.count, 0)
        : byTopic[t.slug]?.length ?? 0,
  }));

  // 9) FAQ — aggregated from the CMS's own per-article FAQ data, topped up with
  //    evergreen conceptual questions (not time-bound facts) when coverage is thin.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: SLUG, contentType: "article", limit: 12 });
    faqSource = items.map((raw) => cmsContentToArticle(raw));
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "PersonalFinance");
  }
  const seenQuestions = new Set<string>();
  const faqs = faqSource
    .flatMap((a) => a.faq ?? [])
    .filter((f) => {
      const key = f.question.trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    });
  for (const f of FALLBACK_FAQS) {
    const key = f.question.trim().toLowerCase();
    if (!seenQuestions.has(key)) {
      seenQuestions.add(key);
      faqs.push(f);
    }
  }

  const totalGuides = articles.length + Object.values(byTopic).reduce((sum, list) => sum + list.length, 0);

  // ── SEO: CollectionPage + ItemList + Breadcrumb structured data ──
  const base = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const pageUrl = `${base}/${SLUG}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: "Imperialpedia", url: base },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 25).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.title,
        url: `${base}${newsArticleHref(a)}`,
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: copy.title, item: pageUrl },
    ],
  };
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Investopedia Editorial Header (Centered) */}
      <EditorialHeader
        eyebrow={{ label: "Personal Finance", href: "/personal-finance" }}
        title={copy.title}
        description="Banking in the 21st century means being able to conduct all transactions digitally without needing to physically visit a branch location. Deposits, withdrawals, payments, and transfers can be conducted online or by phone app as well as applications for credit cards and loans."
      />

      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Investopedia 5-Post Lead Spotlight (Lead on Left - Screenshot 4) */}
        <EditorialSpotlight
          badgeLabel="ALL ABOUT BANKING"
          featured={featured ?? undefined}
          sidebarArticles={sidebarArticles.slice(0, 4)}
          categoryLabel={copy.title}
          layout="left"
        />

        {/* Investopedia Blue-Bordered FAQ Box (Screenshot 1 & 3) */}
        <InvestopediaFaqBox
          title="Frequently Asked Questions"
          faqs={INVESTOPEDIA_FAQS}
        />

        {/* Investopedia Dark Navy Key Terms Widget (Screenshot 2) */}
        <InvestopediaKeyTerms
          title="Key Terms"
          terms={BANKING_KEY_TERMS}
        />

        {/* Investopedia 5-Post Spotlight 2 (Reversed: 4 stories Left, Lead Right - Screenshot 2 & 5) */}
        {startHere.length > 0 && (
          <EditorialSpotlight
            badgeLabel="FEATURED GUIDES"
            featured={startHere[0]}
            sidebarArticles={sidebarArticles.slice(2, 6).concat(startHere.slice(1, 4))}
            categoryLabel={copy.title}
            layout="right"
          />
        )}

        {/* In-Depth Newspaper Editorial Guide & Key Takeaways */}
        <EditorialArticleGuide
          title={`Essential ${copy.title} Guide: Principles & Practical Rules`}
          categoryName={copy.title}
          keyTakeaways={copy.keyTakeaways}
          sections={copy.sections}
        />

        {/* Banking Topics Shelf */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Explore Banking Topics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboardCards.map((card) => (
              <TopicCard
                key={card.slug}
                href={`/${card.slug}`}
                label={card.label}
                description={card.description}
                count={card.count}
                icon={card.icon}
              />
            ))}
          </div>
        </section>

        {startHere.length > 0 && (
          <section>
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />
              Start Here
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {startHere.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Banking Products — pillar + supporting guides, one section per product */}
        {productSections.map((section) => (
          <ProductSection
            key={section.slug}
            slug={section.slug}
            label={section.label}
            icon={section.icon}
            articles={section.articles}
          />
        ))}

        {/* Banking Reviews — a dedicated area, never mixed with the guides above */}
        <section>
          <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6">
            <span className="h-4 w-1 rounded-full bg-yellow-400" />
            Banking Reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reviewCards.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
              >
                <p className="text-sm font-bold text-foreground">{r.label}</p>
                {r.count > 0 ? (
                  <p className="text-xs text-gray-400">
                    {r.count} review{r.count === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60">No reviews yet</p>
                )}
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
                  Compare
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <ComparisonsSection articles={comparisons} heading="Banking Comparisons" />

        {/* Banking Calculators — real, working tools only */}
        <section>
          <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6 border-l-4 border-primary pl-4">
            Banking Calculators
          </h2>
          <div className="flex flex-wrap gap-3">
            {CALCULATORS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {tool.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>

        {/* Banking News — recency-sorted, deliberately separate from the evergreen guides below */}
        {bankingNews.length > 0 && (
          <section>
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6 border-l-4 border-primary pl-4">
              Banking News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bankingNews.map((article) => (
                <Link key={article.id} href={newsArticleHref(article)} className="group flex flex-col rounded-xl border border-border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-primary">{article.category}</p>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-3">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Banking Guides — evergreen education, never mixed with news */}
        <section>
          <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6 border-l-4 border-accent pl-4">
            Banking Guides
          </h2>
          {bankingNews.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {bankingNews.map((article) => (
                <Link key={article.id} href={newsArticleHref(article)} className="group block">
                  <p className="text-xs font-semibold text-primary mb-1">{article.category}</p>
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-3">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <p className="w-full text-xs text-muted-foreground mb-1">Also explore:</p>
            {BANKING_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {guide.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>

        {!featured && (
          <p className="py-16 text-center text-muted-foreground">
            No articles published in this category yet — check back soon.
          </p>
        )}

        {/* FAQ */}
        <FAQAccordionSection faqs={faqs} />

        {/* Newsletter signup */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Smart Money Updates</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Banking tips, rate changes, and financial guidance delivered weekly.
          </p>
          <NewsletterForm />
        </section>

        {/* Explore More — internal cross-links to the other mega-menu categories */}
        <section>
          <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground mb-6 border-l-4 border-muted-foreground pl-4">
            Explore More
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {EXPLORE_MORE.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
