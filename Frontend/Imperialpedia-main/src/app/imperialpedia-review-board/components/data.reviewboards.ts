// ─── Review Board list card (used on /review-board index page) ───────────────

import { personSilhouetteDataUri } from "@baalvion/illustrations";

export type ReviewBoardMember = {
  name: string;
  role: string;
  image: string;
  slug: string;
  shortBio: string;
};

// ─── Full profile types ───────────────────────────────────────────────────────
//
// Two profile types exist:
//
//  'board-member'  — Financial Review Board experts (e.g. Marcus Whitfield)
//                    Extra fields: credentials line, quote section
//
//  'staff'         — Editors / fact-checkers / writers (e.g. Allen Krewzz)
//                    Simpler — no credentials, no quote
//
// Both share the same base fields and render with the same two-column layout.
// The page component branches on profileType to show/hide the extras.

interface ReviewBoardProfileBase {
  slug: string;
  name: string;
  imageUrl: string;
  linkedInUrl?: string;

  // 4 labeled facts shown top-right beside the photo
  currently: string;
  residesIn: string;
  education: string;    // short institution name for the fact row
  expertise: string;

  // Content sections
  summary: string[];      // bullet list — first item may contain a link
  experience: string[];   // paragraphs
  educationDetail: string; // full paragraph under "Education" heading
}

export interface BoardMemberProfile extends ReviewBoardProfileBase {
  profileType: "board-member";
  /** Designation line shown directly under the H1 — e.g. "CFP®, ChFC®, CLU®" */
  credentials: string;
  /** "Quote from [name]" section shown at the very bottom */
  quote: {
    text: string;        // the pull-quote paragraph
    context?: string;    // optional second paragraph giving context
  };
}

export interface StaffProfile extends ReviewBoardProfileBase {
  profileType: "staff";
}

export type ReviewBoardProfile = BoardMemberProfile | StaffProfile;

// Plain `Omit<Union, K>` doesn't distribute per-member (keyof a union is the
// intersection of member keys), which loses the discriminated fields unique to
// BoardMemberProfile. This conditional forces per-member distribution instead.
type OmitImageUrl<T> = T extends unknown ? Omit<T, "imageUrl"> : never;

// ─── Index page list ──────────────────────────────────────────────────────────

const rawReviewBoardMembers: Omit<ReviewBoardMember, "image">[] = [
  {
    name: "Marcus Whitfield",
    role: "CERTIFIED FINANCIAL PLANNER™",
    slug: "marcus-whitfield",
    shortBio:
      "Marcus Whitfield is a CERTIFIED FINANCIAL PLANNER™ professional with 15+ years in financial markets and a fierce advocate for financial literacy.",
  },
  {
    name: "Allen Krewzz",
    role: "Senior Editor, Financial Products and Services",
    slug: "allen-krewzz",
    shortBio:
      "Allen Krewzz is a senior editor at Imperialpedia with over a decade of experience editing content for financial and business publications.",
  },
  {
    name: "Sarah Mitchell",
    role: "Senior Investment Analyst & CFA Charterholder",
    slug: "sarah-mitchell",
    shortBio:
      "Sarah Mitchell is a CFA Charterholder with 12+ years in equity research and portfolio management across global markets.",
  },
  {
    name: "David Kim",
    role: "Fact Checker & Research Analyst",
    slug: "david-kim",
    shortBio:
      "David Kim is a research analyst and fact checker at Imperialpedia specializing in macroeconomics, interest rates, and fixed income markets.",
  },
];

// Abstract silhouette avatars (no stock headshot photos) — per the style guide's
// "no people unless represented as abstract silhouettes" rule.
export const reviewBoardMembers: ReviewBoardMember[] = rawReviewBoardMembers.map((member) => ({
  ...member,
  image: personSilhouetteDataUri({ name: member.name, seed: member.slug }),
}));

// ─── Full profile data ────────────────────────────────────────────────────────

const rawReviewBoardProfiles: OmitImageUrl<ReviewBoardProfile>[] = [

  // ── BOARD MEMBER: Marcus Whitfield ───────────────────────────────────────
  {
    profileType: "board-member",
    slug: "marcus-whitfield",
    name: "Marcus Whitfield",
    linkedInUrl: "https://www.linkedin.com/",
    credentials: "CFP®, ChFC®, CLU®, RICP®",
    currently: "Certified Financial Planner",
    residesIn: "New York, NY",
    education: "Bernard M. Baruch College, CUNY",
    expertise:
      "Accounting, Debt, Financial Planning, Life Insurance, Insurance, Investing, Personal Finance, Retirement",
    summary: [
      "Member of Imperialpedia's Financial Review Board",
      "Deep knowledge of financial planning focusing pre-retirement and post-retirement planning issues.",
      "Life Insurance expertise in personal use, business applications, and policy structuring as a risk management and estate enhancement tool.",
      "Experienced in the inner workings of alternative investments (private equity and hedge funds) as an investment vehicle.",
    ],
    experience: [
      "Marcus Whitfield has spent his entire career in the financial services industry covering institutional and individual clients. He currently presents various seminars on financial planning topics for a range of municipal employees, develops comprehensive financial plans, and counsels individuals on retirement decisions.",
      "Previously, Marcus worked for 7 years in asset management covering private equity and hedge funds as a Fund Controller providing oversight of financial reporting, investment valuations, and risk management, holding roles at several mid-sized financial services and asset management firms.",
    ],
    educationDetail:
      "Marcus obtained his Bachelor of Business Administration in Accounting from Baruch College, CUNY. Additionally, Marcus is a CERTIFIED FINANCIAL PLANNER™ professional. He has also earned the Chartered Financial Consultant® designation for advanced financial planning and the Chartered Life Underwriter® designation for advanced insurance specialization, along with the Retirement Income Certified Professional® designation for advanced retirement planning.",
    quote: {
      text: "A wealthy mindset is built the same way a financial plan is: one deliberate decision at a time. The clients who do best aren't the ones chasing the highest returns — they're the ones who take on good, measured risk and stay comfortable making decisions under uncertainty.",
    },
  },

  // ── STAFF: Allen Krewzz ───────────────────────────────────────────────
  {
    profileType: "staff",
    slug: "allen-krewzz",
    name: "Allen Krewzz",
    linkedInUrl: "https://www.linkedin.com/",
    currently: "Senior Editor, Financial Products and Services",
    residesIn: "Syracuse, New York",
    education: "State University of New York Oswego",
    expertise: "Credit cards, loans, credit and debt, banking",
    summary: [
      "Full-time Senior Editor, Financial Products and Services",
      "Over a decade of experience editing content for financial and business publications",
      "He holds a bachelor's degree from the State University of New York, Oswego",
    ],
    experience: [
      "Allen Krewzz has over a decade of experience as a writer and editor, having worked with a wide variety of finance and business content. Currently, he focuses on banking, credit and debt, auto loans, credit cards, and more.",
      "Allen is currently a full-time senior editor of financial products and services at Imperialpedia.",
      "He was an editor at Credit Card Insider before joining Imperialpedia. In that role, he researched, wrote, and managed content about credit cards, credit advice, and related topics.",
    ],
    educationDetail:
      "Allen Krewzz received a bachelor's degree in Cognitive Science from the State University of New York Oswego.",
  },

  // ── STAFF: Sarah Mitchell ─────────────────────────────────────────────────
  {
    profileType: "staff",
    slug: "sarah-mitchell",
    name: "Sarah Mitchell",
    linkedInUrl: "https://www.linkedin.com/",
    currently: "Senior Investment Analyst",
    residesIn: "New York, New York",
    education: "Columbia Business School",
    expertise: "Equity research, portfolio management, global markets, ETFs",
    summary: [
      "CFA Charterholder with 12+ years in equity research and portfolio management",
      "Covers global equity markets including US, European, and emerging market securities",
      "Previously held senior roles at leading asset management firms in New York",
    ],
    experience: [
      "Sarah Mitchell is a Chartered Financial Analyst with over 12 years of experience in equity research and investment strategy. She has covered global markets across a range of sectors including technology, financials, and consumer staples.",
      "Prior to joining Imperialpedia's Financial Review Board, Sarah worked as a senior equity research analyst at a top-tier asset management firm, where she managed a $2 billion global equity portfolio.",
      "Sarah brings deep expertise in fundamental analysis, valuation modeling, and macroeconomic research to her role reviewing investment and market content.",
    ],
    educationDetail:
      "Sarah Mitchell holds an MBA with a concentration in Finance from Columbia Business School and a Bachelor of Science in Economics from the University of Michigan.",
  },

  // ── STAFF: David Kim ──────────────────────────────────────────────────────
  {
    profileType: "staff",
    slug: "david-kim",
    name: "David Kim",
    linkedInUrl: "https://www.linkedin.com/",
    currently: "Fact Checker & Research Analyst",
    residesIn: "Chicago, Illinois",
    education: "University of Chicago",
    expertise: "Macroeconomics, interest rates, fixed income, central bank policy",
    summary: [
      "Fact Checker and Research Analyst at Imperialpedia",
      "Specialized in macroeconomics, fixed income markets, and central bank policy",
      "Holds a Master's degree in Economics from the University of Chicago",
    ],
    experience: [
      "David Kim is a research analyst and fact checker at Imperialpedia, where he verifies financial data, statistics, and claims across the platform's articles and reviews.",
      "Before joining Imperialpedia, David spent four years as a fixed income research associate at a regional investment bank, covering US Treasuries, municipal bonds, and investment-grade corporate debt.",
      "David brings rigorous academic training in macroeconomics to his fact-checking role, with a particular focus on Federal Reserve policy, interest rate dynamics, and inflation measurement.",
    ],
    educationDetail:
      "David Kim holds a Master of Arts in Economics from the University of Chicago and a Bachelor of Science in Mathematics and Economics from Northwestern University.",
  },

];

export const reviewBoardProfiles: ReviewBoardProfile[] = rawReviewBoardProfiles.map((profile) => ({
  ...profile,
  imageUrl: personSilhouetteDataUri({ name: profile.name, seed: profile.slug }),
})) as ReviewBoardProfile[];