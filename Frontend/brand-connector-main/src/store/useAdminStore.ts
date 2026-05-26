
import { create } from 'zustand';
import { PlatformStats, SystemLog } from '@/types/admin';
import { User, Transaction, Campaign } from '@/types';
import { adminApi } from '@/lib/api/admin';

interface AdminState {
  stats: PlatformStats | null;
  users: User[];
  payments: Transaction[];
  campaigns: Campaign[];
  logs: SystemLog[];
  loading: boolean;
  
  // Actions
  fetchDashboard: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  users: [],
  payments: [],
  campaigns: [],
  logs: [],
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const [statsRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLogs()
      ]);
      if (statsRes.success) set({ stats: statsRes.data });
      if (logsRes.success) set({ logs: logsRes.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const res = await adminApi.getUsers();
      if (res.success) set({ users: res.data });
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id, updates) => {
    const res = await adminApi.updateUser(id, updates);
    if (res.success) {
      set(state => ({
        users: state.users.map(u => u.id === id ? res.data : u)
      }));
    }
  },

  deleteUser: async (id) => {
    const res = await adminApi.deleteUser(id);
    if (res.success) {
      set(state => ({
        users: state.users.filter(u => u.id !== id)
      }));
    }
  }
}));
