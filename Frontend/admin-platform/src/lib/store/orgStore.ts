'use client';

import { create } from 'zustand';
import type { OrgDetail, OrgMember, Invitation } from '@/lib/types/organization.types';

interface OrgState {
  activeOrg: OrgDetail | null;
  members: OrgMember[];
  pendingInvitations: Invitation[];
  isLoading: boolean;

  setActiveOrg: (org: OrgDetail | null) => void;
  setMembers: (members: OrgMember[]) => void;
  setPendingInvitations: (invitations: Invitation[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useOrgStore = create<OrgState>()((set) => ({
  activeOrg: null,
  members: [],
  pendingInvitations: [],
  isLoading: false,

  setActiveOrg: (org) => set({ activeOrg: org }),
  setMembers: (members) => set({ members }),
  setPendingInvitations: (pendingInvitations) => set({ pendingInvitations }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ activeOrg: null, members: [], pendingInvitations: [], isLoading: false }),
}));
