/**
 * @deprecated Use `adminApi` from `@/lib/api-client` instead.
 * This file is kept for backwards compatibility with existing imports.
 */
import { ApiResponse, ModerationItem, ModerationApproval } from "@/types";
import { AIModerationHubData } from "@/types/moderation";

/**
 * @fileOverview Mock service for content moderation data.
 */

let mockModerationQueue: ModerationItem[] = [
  {
    id: "m-1",
    content: "Understanding Yield Curve Inversion",
    creator: "marketmaven",
    reportType: "Spam",
    status: "Pending",
    date: "2024-03-12T10:30:00Z",
    title: "Understanding Yield Curve Inversion",
    author: "marketmaven",
    type: "Article",
    createdAt: "2024-03-12T10:30:00Z",
  },
  {
    id: "m-2",
    content: "Macro Trends in 2026",
    creator: "econvance",
    reportType: "Fact Check",
    status: "Reviewed",
    date: "2024-03-11T16:45:00Z",
    title: "Macro Trends in 2026",
    author: "econvance",
    type: "Article",
    createdAt: "2024-03-11T16:45:00Z",
  },
  {
    id: "m-3",
    content: "DeFi Liquidity Pools",
    creator: "defianalyst",
    reportType: "Plagiarism",
    status: "Action Taken",
    date: "2024-03-10T09:15:00Z",
    title: "DeFi Liquidity Pools",
    author: "defianalyst",
    type: "Article",
    createdAt: "2024-03-10T09:15:00Z",
  },
  {
    id: "m-4",
    content: "Passive Income with Dividends",
    creator: "dividenddan",
    reportType: "Inaccurate Data",
    status: "Pending",
    date: "2024-03-12T11:00:00Z",
    title: "Passive Income with Dividends",
    author: "dividenddan",
    type: "Article",
    createdAt: "2024-03-12T11:00:00Z",
  },
  {
    id: "m-5",
    content: "Institutional Yield Strategies",
    creator: "wealthbuilder",
    reportType: "Copyright",
    status: "Reviewed",
    date: "2024-03-11T14:20:00Z",
    title: "Institutional Yield Strategies",
    author: "wealthbuilder",
    type: "Article",
    createdAt: "2024-03-11T14:20:00Z",
  },
];

let mockApprovals: ModerationApproval[] = [
  {
    id: "app-1",
    content: "The yield curve is a graphical...",
    fullContent:
      "The yield curve is a graphical representation of interest rates on debt for a range of maturities. It is often used as a benchmark for other debt in the market, such as mortgage rates or bank lending rates. Current reports indicate an inversion that has historically preceded fiscal contraction cycles.",
    creator: "marketmaven",
    reportType: "Fact Check",
    status: "Pending",
    date: "2024-03-12T10:30:00Z",
  },
  {
    id: "app-2",
    content: "DeFi protocols are highly risk...",
    fullContent:
      "DeFi protocols are highly risky and should be avoided by retail investors unless they have significant technical expertise. Many yield farms are thinly veiled schemes designed to extract liquidity from unsuspecting users.",
    creator: "defianalyst",
    reportType: "Spam",
    status: "Pending",
    date: "2024-03-12T09:15:00Z",
  },
  {
    id: "app-3",
    content: "Investment in gold remains the...",
    fullContent:
      "Investment in gold remains the only true hedge against the complete collapse of the fiat currency system which is expected by Q4 this year based on my proprietary model.",
    creator: "goldbug_42",
    reportType: "Misinformation",
    status: "Pending",
    date: "2024-03-11T16:45:00Z",
  },
];

/**
 * Prompt 69: AI Moderation Hub Mock Data
 */
const mockAIModerationData: AIModerationHubData = {
  moderation_metrics: {
    flagged_content: 124,
    articles_under_review: 18,
    flagged_comments: 72,
    user_reports: 35,
    resolved_cases: 209,
  },
  flagged_content: [
    {
      id: "flag-1",
      type: "Comment",
      author: "TraderMike",
      reason: "Possible misinformation",
      risk_score: 84,
      status: "Pending",
      date: "2024-03-15T10:00:00Z",
      content_preview:
        "I have heard from inside sources that XYZ is about to be delisted. Better dump it all now before it hits zero.",
      engagement: { views: 420, likes: 12 },
      risk_analysis: {
        spam: 12,
        misinformation: 84,
        toxicity: 5,
        manipulation: 78,
      },
    },
    {
      id: "flag-2",
      type: "Article",
      author: "FinanceGuru",
      reason: "Spam promotion",
      risk_score: 76,
      status: "Under Review",
      date: "2024-03-15T09:30:00Z",
      content_preview:
        "Click here to join my private signals group where I guarantee 500% returns in under 30 days. No experience required!",
      engagement: { views: 1250, likes: 45 },
      risk_analysis: {
        spam: 92,
        misinformation: 45,
        toxicity: 2,
        manipulation: 65,
      },
    },
    {
      id: "flag-3",
      type: "Discussion",
      author: "MarketAggressor",
      reason: "Toxic language",
      risk_score: 91,
      status: "Pending",
      date: "2024-03-15T11:15:00Z",
      content_preview:
        "Anyone who thinks this stock is a buy is a complete idiot and should leave this platform immediately.",
      engagement: { views: 85, likes: 0 },
      risk_analysis: {
        spam: 5,
        misinformation: 10,
        toxicity: 91,
        manipulation: 15,
      },
    },
  ],
  history: [
    {
      id: "h-1",
      moderator: "Eleanor Vance",
      action: "Removed",
      type: "Comment",
      date: "2024-03-14T16:00:00Z",
    },
    {
      id: "h-2",
      moderator: "Expert Editor",
      action: "Approved",
      type: "Article",
      date: "2024-03-14T14:30:00Z",
    },
    {
      id: "h-3",
      moderator: "Platform Lead",
      action: "User Warned",
      type: "Discussion",
      date: "2024-03-14T11:00:00Z",
    },
  ],
  community_reports: [
    {
      id: "rep-1",
      reporter: "User_42",
      content_title: "XYZ delisting rumor",
      reason: "False claims",
      timestamp: "2024-03-15T10:05:00Z",
      status: "Open",
    },
    {
      id: "rep-2",
      reporter: "JulianWealth",
      content_title: "500% returns ad",
      reason: "Scam content",
      timestamp: "2024-03-15T09:45:00Z",
      status: "Open",
    },
  ],
};

export const getPendingContent = async (): Promise<ApiResponse<any[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockModerationQueue,
    status: 200,
  };
};

export const getModerationQueue = async (): Promise<
  ApiResponse<ModerationItem[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockModerationQueue,
    status: 200,
  };
};

export const getModerationApprovals = async (): Promise<
  ApiResponse<ModerationApproval[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockApprovals,
    status: 200,
  };
};

export const moderateContent = async (
  contentId: string,
  action: "Approve" | "Reject"
): Promise<ApiResponse<ModerationApproval | null>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const index = mockApprovals.findIndex((a) => a.id === contentId);
  if (index !== -1) {
    mockApprovals[index].status =
      action === "Approve" ? "Approved" : "Rejected";
    return {
      data: mockApprovals[index],
      status: 200,
      message: `Content successfully ${
        action === "Approve" ? "cleared" : "rejected"
      }.`,
    };
  }
  return {
    data: null,
    status: 404,
    message: "Content node not found.",
  };
};

export const getAIModerationHubData = async (): Promise<
  ApiResponse<AIModerationHubData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockAIModerationData,
    status: 200,
  };
};
