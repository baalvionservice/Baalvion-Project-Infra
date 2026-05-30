'use client';

import { Vote, VoteChoice, VoteStatus } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { permissionService } from "./permission.service";
import { votingApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/votes. Business rules (eligibility, dedup, result tally)
// run client-side, then the new state is persisted to the backend. No in-memory mock.
export const votingService = {
  getVotes: async (): Promise<Vote[]> => {
    return (await votingApi.list()) as Vote[];
  },

  getVoteById: async (id: string): Promise<Vote | null> => {
    return (await votingApi.get(id)) as Vote | null;
  },

  createVote: async (vote: Omit<Vote, 'id' | 'votes' | 'versionHistory' | 'results'>): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const canCreate = await permissionService.hasPermission(role, 'Voting', 'create');
    if (!canCreate) throw new Error("Insufficient permissions to create votes.");

    const created: any = await votingApi.create({
      ...vote,
      votes: [],
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString(), changesSummary: 'Initial creation' }],
    });
    await auditService.log({ userRole: role, module: 'Voting', action: 'create', entityId: String(created.id), newState: created });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('voting-updated'));
  },

  castVote: async (voteId: string, choice: VoteChoice): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const vote = await votingApi.get(voteId);
    if (!vote) throw new Error("Vote not found");
    if (vote.status !== 'Open') throw new Error("This resolution is not open for voting.");
    if (!vote.eligibleRoles.includes(role)) throw new Error("You are not eligible to vote on this resolution.");
    if (vote.votes.some((v: any) => v.voterRole === role)) throw new Error("You have already cast a vote for this resolution.");

    const votes = [...vote.votes, { voterId: 'self', voterRole: role, choice, timestamp: new Date().toISOString() }];
    await votingApi.update(voteId, { votes });
    await auditService.log({ userRole: role, module: 'Voting', action: 'vote', entityId: voteId, newState: { choice } });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('voting-updated'));
  },

  updateStatus: async (voteId: string, status: VoteStatus): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const vote = await votingApi.get(voteId);
    if (!vote) return;

    // status drives the tally; `results` is derived from `votes` on read (see ir-engagement mapVote).
    await votingApi.update(voteId, { status });
    await auditService.log({ userRole: role, module: 'Voting', action: 'edit', entityId: voteId, previousState: { status: vote.status }, newState: { status } });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('voting-updated'));
  },
};
