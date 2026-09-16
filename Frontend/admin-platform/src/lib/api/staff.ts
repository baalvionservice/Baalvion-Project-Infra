import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { Department, Team, Employee, StaffInvitation, OnboardingChecklist } from '@/lib/types/staff.types';

/** What admin-service actually returns for a staff page — items, not data. */
interface RawEmployeePage {
  items?: Employee[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export const staffApi = {
  // Departments
  listDepartments: () =>
    adminApiClient.get<ApiResponse<Department[]>>('/staff/departments'),

  createDepartment: (data: Partial<Department>) =>
    adminApiClient.post<ApiResponse<Department>>('/staff/departments', data),

  updateDepartment: (id: string, data: Partial<Department>) =>
    adminApiClient.patch<ApiResponse<Department>>(`/staff/departments/${id}`, data),

  deleteDepartment: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/staff/departments/${id}`),

  // Teams
  listTeams: (params?: { departmentId?: string }) =>
    adminApiClient.get<ApiResponse<Team[]>>('/staff/teams', { params }),

  createTeam: (data: Partial<Team>) =>
    adminApiClient.post<ApiResponse<Team>>('/staff/teams', data),

  updateTeam: (id: string, data: Partial<Team>) =>
    adminApiClient.patch<ApiResponse<Team>>(`/staff/teams/${id}`, data),

  // Employees
  //
  // admin-service answers with { items, total, page, limit, hasMore } — NOT the
  // PaginatedResponse { data, pagination } this was typed as. The cast made TypeScript accept
  // it, so every caller read `.data` and silently got undefined: the Staff console's Employees
  // tab has been rendering an empty list. Normalised here so the declared type is true and all
  // call sites work.
  listEmployees: async (params?: PaginationParams & { departmentId?: string; teamId?: string; status?: string; search?: string }) => {
    const res = await adminApiClient.get<ApiResponse<RawEmployeePage>>('/staff/employees', { params });
    const d = res.data.data ?? ({} as RawEmployeePage);
    const items = d.items ?? [];
    const limit = d.limit ?? params?.limit ?? items.length;
    const page = d.page ?? params?.page ?? 1;
    const total = d.total ?? items.length;
    const body: PaginatedResponse<Employee> = {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
        hasNext: !!d.hasMore,
        hasPrev: page > 1,
      },
    };
    return { ...res, data: body };
  },

  getEmployee: (id: string) =>
    adminApiClient.get<ApiResponse<Employee>>(`/staff/employees/${id}`),

  updateEmployee: (id: string, data: Partial<Employee>) =>
    adminApiClient.patch<ApiResponse<Employee>>(`/staff/employees/${id}`, data),

  deactivateEmployee: (id: string, reason: string) =>
    adminApiClient.post<ApiResponse<Employee>>(`/staff/employees/${id}/deactivate`, { reason }),

  // Invitations
  listInvitations: (params?: PaginationParams & { status?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<StaffInvitation>>>('/staff/invitations', { params }),

  sendInvitation: (data: { email: string; role: string; departmentId: string; teamId?: string }) =>
    adminApiClient.post<ApiResponse<StaffInvitation>>('/staff/invitations', data),

  revokeInvitation: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/staff/invitations/${id}`),

  // Onboarding
  getOnboarding: (employeeId: string) =>
    adminApiClient.get<ApiResponse<OnboardingChecklist>>(`/staff/employees/${employeeId}/onboarding`),

  updateOnboardingStep: (employeeId: string, stepId: string, completed: boolean) =>
    adminApiClient.patch<ApiResponse<OnboardingChecklist>>(`/staff/employees/${employeeId}/onboarding/${stepId}`, { completed }),

  // Identity
  getIdentityPermissions: (employeeId: string) =>
    adminApiClient.get<ApiResponse<{ roles: string[]; permissions: string[] }>>(`/staff/employees/${employeeId}/permissions`),

  updateIdentityPermissions: (employeeId: string, data: { roles: string[]; permissions: string[] }) =>
    adminApiClient.put<ApiResponse<void>>(`/staff/employees/${employeeId}/permissions`, data),
};
