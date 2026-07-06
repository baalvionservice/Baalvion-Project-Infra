/**
 * @file task-service.ts
 * @description Trade Agent task/to-do tracking. Backed by trade-service's
 * tenant-scoped /tasks resource (tradeops.tasks).
 */
import { apiClient } from '@/lib/api-client';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToUserId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  dueDate: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The trade-service Task model is flat snake_case; the UI speaks camelCase.
 */
function mapTaskFromApi(raw: any): Task {
  return {
    id: String(raw?.id),
    title: raw?.title || '',
    description: raw?.description || '',
    category: raw?.category || '',
    priority: raw?.priority || 'medium',
    status: raw?.status || 'open',
    assignedToUserId: raw?.assigned_to_user_id || '',
    relatedEntityType: raw?.related_entity_type || '',
    relatedEntityId: raw?.related_entity_id || '',
    dueDate: raw?.due_date || '',
    completedAt: raw?.completed_at || '',
    createdAt: raw?.created_at || new Date().toISOString(),
    updatedAt: raw?.updated_at || new Date().toISOString(),
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const res = await apiClient.get<any>('/tasks', filters);
  const items = res.data?.items ?? [];
  return items.map(mapTaskFromApi);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const res = await apiClient.getDoc<any>('/tasks', id);
  return res.success && res.data ? mapTaskFromApi(res.data) : null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  dueDate?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  assignedToUserId?: string;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const res = await apiClient.post<any>('/tasks', {
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority || 'medium',
    due_date: data.dueDate || null,
    related_entity_type: data.relatedEntityType,
    related_entity_id: data.relatedEntityId,
    assigned_to_user_id: data.assignedToUserId,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to create task.');
  }
  return mapTaskFromApi(res.data);
}

export async function completeTask(id: string): Promise<Task> {
  const res = await apiClient.patch<any>(`/tasks/${id}/complete`, {});
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to complete task.');
  }
  return mapTaskFromApi(res.data);
}

export const taskService = { getTasks, getTaskById, createTask, completeTask };
