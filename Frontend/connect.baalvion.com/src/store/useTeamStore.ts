
import { create } from 'zustand';
import { TeamMember, TeamRole } from '@/types/team';
import { teamApi } from '@/lib/api/team';

interface TeamState {
  members: TeamMember[];
  loading: boolean;
  currentUserRole: TeamRole;
  
  // Actions
  fetchTeam: () => Promise<void>;
  inviteMember: (email: string, role: TeamRole) => Promise<void>;
  updateRole: (id: string, role: TeamRole) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  setCurrentRole: (role: TeamRole) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  loading: false,
  currentUserRole: 'admin', // Mocked default

  fetchTeam: async () => {
    set({ loading: true });
    try {
      const res = await teamApi.getTeam();
      if (res.success) set({ members: res.data });
    } finally {
      set({ loading: false });
    }
  },

  inviteMember: async (email, role) => {
    const res = await teamApi.inviteUser(email, role);
    if (res.success) {
      set(state => ({ members: [...state.members, res.data] }));
    }
  },

  updateRole: async (id, role) => {
    const res = await teamApi.updateUserRole(id, role);
    if (res.success) {
      set(state => ({
        members: state.members.map(m => m.id === id ? res.data : m)
      }));
    }
  },

  removeMember: async (id) => {
    const res = await teamApi.removeUser(id);
    if (res.success) {
      set(state => ({
        members: state.members.filter(m => m.id !== id)
      }));
    }
  },

  setCurrentRole: (role) => set({ currentUserRole: role })
}));
