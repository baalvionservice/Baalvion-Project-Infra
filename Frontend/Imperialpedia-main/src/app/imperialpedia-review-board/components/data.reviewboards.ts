// ─── Review Board list card (used on /review-board index page) ───────────────

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
//  'board-member'  — Financial Review Board experts (e.g. Anthony Battle)
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

// ─── Index page list ──────────────────────────────────────────────────────────

export const reviewBoardMembers: ReviewBoardMember[] = [
  {
    name: "Anthony Battle",
    role: "CERTIFIED FINANCIAL PLANNER™",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    slug: "anthony-battle",
    shortBio:
      "Anthony Battle is a CERTIFIED FINANCIAL PLANNER™ professional with 15+ years in financial markets and a fierce advocate for financial literacy.",
  },
  {
    name: "Allen Krewzz",
    role: "Senior Editor, Financial Products and Services",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    slug: "allen-krewzz",
    shortBio:
      "Allen Krewzz is a senior editor at Imperialpedia with over a decade of experience editing content for financial and business publications.",
  },
  {
    name: "Sarah Mitchell",
    role: "Senior Investment Analyst & CFA Charterholder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    slug: "sarah-mitchell",
    shortBio:
      "Sarah Mitchell is a CFA Charterholder with 12+ years in equity research and portfolio management across global markets.",
  },
  {
    name: "David Kim",
    role: "Fact Checker & Research Analyst",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    slug: "david-kim",
    shortBio:
      "David Kim is a research analyst and fact checker at Imperialpedia specializing in macroeconomics, interest rates, and fixed income markets.",
  },
];

// ─── Full profile data ────────────────────────────────────────────────────────

export const reviewBoardProfiles: ReviewBoardProfile[] = [

  // ── BOARD MEMBER: Anthony Battle ─────────────────────────────────────────
  {
    profileType: "board-member",
    slug: "anthony-battle",
    name: "Anthony Battle",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    linkedInUrl: "https://www.linkedin.com/",
    credentials: "CFP®, ChFC®, CLU®, RICP®, AFC®, CRC®",
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
      "Anthony Battle has spent his entire career in the financial services industry covering institutional and individual clients. Anthony currently presents various seminars on financial planning topics for a range of municipal employees, develops comprehensive financial plans and counsels individuals on retirement decisions.",
      "Previously, Anthony worked for 7 years in asset management covering private equity and hedge funds as a Fund Controller providing oversight of financial reporting, investment valuations, and risk management. He has worked at various financial service firms, which included Bank of Bermuda, HSBC Corporate & Investment Bank, Tishman Speyer, McGladrey, and First Eagle Investment Management.",
    ],
    educationDetail:
      "Anthony obtained his Bachelor of Business Administration in Accounting from Baruch College, CUNY. Additionally, Anthony is a CERTIFIED FINANCIAL PLANNER™ professional. He has also earned the Chartered Financial Consultant® designation for advanced financial planning, the Chartered Life Underwriter® designation for advanced insurance specialization, the Accredited Financial Counselor® for Financial Counseling and both the Retirement Income Certified Professional®, and Certified Retirement Counselor designations for advance retirement planning.",
    quote: {
      text: "Obtaining a wealthy mindset requires learning from the past and applying it in the present. Dwight D. Eisenhower once said, \"Accomplishments will prove to be a journey, not a destination.\" In finance, these accomplishments can only be sustained by those that take on \"good risk\" and learn to be comfortable in uncomfortable situations.",
    },
  },

  // ── STAFF: Allen Krewzz ───────────────────────────────────────────────
  {
    profileType: "staff",
    slug: "allen-krewzz",
    name: "Allen Krewzz",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
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
      "Brendan is currently a full-time senior editor of financial products and services at Imperialpedia.",
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
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
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
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
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