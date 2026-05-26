import { ApiResponse } from '@/types';
import { CommentIntelligenceData, IntelligenceCommentNode } from '@/types/community';

/**
 * @fileOverview Mock service for the Advanced Comment Intelligence system.
 */

const mockComments: IntelligenceCommentNode[] = [
  {
    id: 'ci-1',
    comment_id: 1,
    username: 'Daniel Foster',
    avatar: 'https://picsum.photos/seed/daniel/100/100',
    reputation: 8500,
    reputationScore: 8500,
    badge: 'Expert Contributor',
    timestamp: '2h ago',
    content: 'The AI sector rally looks similar to the early cloud computing boom. Valuations might remain elevated for years as institutional capital rebalances toward GPU infrastructure.',
    text: 'The AI sector rally looks similar to the early cloud computing boom. Valuations might remain elevated for years as institutional capital rebalances toward GPU infrastructure.',
    upvotes: 320,
    downvotes: 12,
    bullBearVote: 'Bull',
    bull_bear: 'Bull',
    label: 'Top Insight',
    isEditorPick: true,
    replies: [
      {
        id: 'ci-1-1',
        comment_id: 2,
        username: 'Julian Wealth',
        avatar: 'https://picsum.photos/seed/wealth/100/100',
        reputation: 9200,
        reputationScore: 9200,
        badge: 'Verified Expert',
        timestamp: '1h ago',
        content: 'Agreed, but we must watch the P/S multiples on the secondary chip cluster. NVDA is the clear leader, but the laggers are pricing in perfection.',
        text: 'Agreed, but we must watch the P/S multiples on the secondary chip cluster. NVDA is the clear leader, but the laggers are pricing in perfection.',
        upvotes: 45,
        downvotes: 2,
        bullBearVote: 'Neutral',
        bull_bear: 'Neutral'
      }
    ]
  },
  {
    id: 'ci-2',
    comment_id: 3,
    username: 'Emily Chen',
    avatar: 'https://picsum.photos/seed/emily/100/100',
    reputation: 4200,
    reputationScore: 4200,
    badge: 'Trusted Member',
    timestamp: '4h ago',
    content: 'Interest rate expectations will be the main driver for equities over the next 12 months. If the Fed maintains "Higher for Longer," we could see a multiple contraction in growth stocks.',
    text: 'Interest rate expectations will be the main driver for equities over the next 12 months. If the Fed maintains "Higher for Longer," we could see a multiple contraction in growth stocks.',
    upvotes: 210,
    downvotes: 8,
    bullBearVote: 'Bear',
    bull_bear: 'Bear',
    label: 'Most Helpful'
  },
  {
    id: 'ci-3',
    comment_id: 4,
    username: 'Sarah Crypto',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    reputation: 6800,
    reputationScore: 6800,
    badge: 'Expert Contributor',
    timestamp: '5h ago',
    content: 'The decentralization of liquidity is the real story here. Traditional P/E ratios don\'t apply to algorithmic fiscal policies.',
    text: 'The decentralization of liquidity is the real story here. Traditional P/E ratios don\'t apply to algorithmic fiscal policies.',
    upvotes: 185,
    downvotes: 42,
    bullBearVote: 'Bull',
    bull_bear: 'Bull',
    label: 'Expert Opinion'
  }
];

export const getCommentIntelligence = async (articleId: string): Promise<ApiResponse<CommentIntelligenceData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: {
      comments: mockComments,
      analytics: {
        total_comments: 482,
        top_commenter: "Daniel Foster",
        top_liked_comment: 320,
        avg_engagement: "14.2%",
        sentiment_bias: 'Bullish'
      },
      highlights: {
        editors_pick: [mockComments[0]],
        top_community: [mockComments[1], mockComments[2]]
      }
    },
    status: 200,
  };
};
