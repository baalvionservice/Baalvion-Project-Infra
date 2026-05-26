import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { Department, Team, Employee, StaffInvitation, OnboardingChecklist } from '@/lib/types/staff.types';

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
  listEmployees: (params?: PaginationParams & { departmentId?: string; teamId?: string; status?: string; search?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<Employee>>>('/staff/employees', { params }),

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
