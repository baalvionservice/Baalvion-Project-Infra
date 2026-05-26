
import api from './axios';
import { TeamMember, TeamRole, PermissionMatrix } from '@/types/team';
import { ApiResponse } from '@/types/crm';

export const teamApi = {
  getTeam: async (): Promise<ApiResponse<TeamMember[]>> => {
    const { data } = await api.get('/team');
    return data;
  },

  inviteUser: async (email: string, role: TeamRole): Promise<ApiResponse<TeamMember>> => {
    const { data } = await api.post('/team/invite', { email, role });
    return data;
  },

  updateUserRole: async (id: string, role: TeamRole): Promise<ApiResponse<TeamMember>> => {
    const { data } = await api.patch(`/team/${id}/role`, { role });
    return data;
  },

  removeUser: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete(`/team/${id}`);
    return data;
  },

  getPermissions: async (): Promise<ApiResponse<PermissionMatrix>> => {
    const { data } = await api.get('/team/permissions');
    return data;
  }
};
