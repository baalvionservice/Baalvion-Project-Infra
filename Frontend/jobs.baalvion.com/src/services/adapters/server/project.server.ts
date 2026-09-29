import { apiClient } from '@/lib/apiClient';
import { ProjectService } from '@/modules/projects/services/project.service';
import {
  Project,
  ProjectStatus,
} from '@/modules/projects/domain/project.entity';
import { PaginatedResponse, TableQuery } from '@/components/system/DataTable';

export const projectServerService: ProjectService = {
  async getProjects(query: TableQuery): Promise<PaginatedResponse<Project>> {
    // URLSearchParams stringifies a nested object to the literal "[object Object]",
    // which the backend then tried to parse as a filter. Flatten the nested `filters`
    // bag into real query params instead.
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'filters' && typeof value === 'object') {
        for (const [fk, fv] of Object.entries(value as Record<string, unknown>)) {
          if (fv !== undefined && fv !== null && fv !== '') flat[fk] = String(fv);
        }
        continue;
      }
      flat[key] = String(value);
    }
    const params = new URLSearchParams(flat).toString();
    const response = await apiClient.get<PaginatedResponse<Project>>(
      `/projects?${params}`,
    );
    if (!response.success)
      throw new Error(response.error || 'Failed to fetch projects');
    return response.data as PaginatedResponse<Project>;
  },
  async getProjectById(id: string): Promise<Project | undefined> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    if (!response.success) return undefined;
    return (response.data as Project) || undefined;
  },
  async updateProjectStatus(
    id: string,
    status: ProjectStatus,
  ): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}/status`, {
      status,
    });
    if (!response.success)
      throw new Error(response.error || 'Failed to update project status');
    return response.data as Project;
  },
};
