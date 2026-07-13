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

];

export const reviewBoardProfiles: ReviewBoardProfile[] = rawReviewBoardProfiles.map((profile) => ({
  ...profile,
  imageUrl: personSilhouetteDataUri({ name: profile.name, seed: profile.slug }),
})) as ReviewBoardProfile[];