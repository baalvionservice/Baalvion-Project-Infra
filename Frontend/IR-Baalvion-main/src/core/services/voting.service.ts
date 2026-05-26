'use client';

import { Vote, VoteChoice, VoteStatus, UserRole, VersionInfo } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { permissionService } from "./permission.service";

let votesState: Vote[] = [
  {
    id: 'vote-001',
    title: 'Election of Gregg Lemkau to Board',
    description: 'Annual Board election for the 2026 fiscal year.',
    resolutionText: 'Be it resolved that Gregg Lemkau is hereby elected as a Director of the Company...',
    createdByRole: 'IRManager',
    eligibleRoles: ['BoardMember', 'P1Investor', 'P2Investor'],
    status: 'Closed',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-15T00:00:00Z',
    votes: [
      { voterId: 'user-1', voterRole: 'BoardMember', choice: 'Approve', timestamp: '2026-01-05T10:00:00Z' },
      { voterId: 'user-2', voterRole: 'P1Investor', choice: 'Approve', timestamp: '2026-01-06T11:00:00Z' }
    ],
    results: {
      approve: 100,
      reject: 0,
      abstain: 0,
      participationRate: 85,
      isQuorumMet: true
    },
    versionHistory: []
  }
];

export const votingService = {
  getVotes: async (): Promise<Vote[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...votesState];
  },

  getVoteById: async (id: string): Promise<Vote | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return votesState.find(v => v.id === id) || null;
  },

  createVote: async (vote: Omit<Vote, 'id' | 'votes' | 'versionHistory' | 'results'>): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const canCreate = await permissionService.hasPermission(role, 'Voting', 'create');
    if (!canCreate) throw new Error("Insufficient permissions to create votes.");

    await new Promise(resolve => setTimeout(resolve, 300));
    const newVote: Vote = {
      ...vote,
      id: `vote-${Math.random().toString(36).substr(2, 9)}`,
      votes: [],
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString(), changesSummary: 'Initial creation' }]
    };

    votesState.push(newVote);
    await auditService.log({
      userRole: role,
      module: 'Voting',
      action: 'create',
      entityId: newVote.id,
      newState: newVote
    });
    window.dispatchEvent(new Event('voting-updated'));
  },

  castVote: async (voteId: string, choice: VoteChoice): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const vote = votesState.find(v => v.id === voteId);
    if (!vote) throw new Error("Vote not found");

    if (vote.status !== 'Open') throw new Error("This resolution is not open for voting.");
    if (!vote.eligibleRoles.includes(role)) throw new Error("You are not eligible to vote on this resolution.");

    // Check if already voted (mock)
    const alreadyVoted = vote.votes.some(v => v.voterRole === role); // Simple mock check
    if (alreadyVoted) throw new Error("You have already cast a vote for this resolution.");

    await new Promise(resolve => setTimeout(resolve, 400));
    
    vote.votes.push({
      voterId: 'mock-id',
      voterRole: role,
      choice,
      timestamp: new Date().toISOString()
    });

    await auditService.log({
      userRole: role,
      module: 'Voting',
      action: 'vote',
      entityId: voteId,
      newState: { choice }
    });

    window.dispatchEvent(new Event('voting-updated'));
  },

  updateStatus: async (voteId: string, status: VoteStatus): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const vote = votesState.find(v => v.id === voteId);
    if (!vote) return;

    await new Promise(resolve => setTimeout(resolve, 200));
    const previousState = { ...vote };
    vote.status = status;

    if (status === 'Closed') {
      // Calculate mock results
      const total = vote.votes.length;
      if (total > 0) {
        const approve = (vote.votes.filter(v => v.choice === 'Approve').length / total) * 100;
        const reject = (vote.votes.filter(v => v.choice === 'Reject').length / total) * 100;
        const abstain = (vote.votes.filter(v => v.choice === 'Abstain').length / total) * 100;
        
        vote.results = {
          approve,
          reject,
          abstain,
          participationRate: 75, // Mock value
          isQuorumMet: true
        };
      }
    }

    await auditService.log({
      userRole: role,
      module: 'Voting',
      action: 'edit',
      entityId: voteId,
      previousState,
      newState: { status }
    });

    window.dispatchEvent(new Event('voting-updated'));
  }
};
