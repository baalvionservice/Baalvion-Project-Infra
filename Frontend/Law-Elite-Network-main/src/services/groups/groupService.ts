/**
 * @fileOverview Discussion Group Service — legal communities + Q&A
 * (spec area 5). Q&A is modeled as posts with postType 'question'/'answer'.
 * Backed by law-service /v1/groups.
 */
import { apiClient, publicClient } from '@/lib/api/client';

export interface DiscussionGroup {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  memberCount: number;
}

export interface GroupPost {
  id: number;
  content: string;
  postType: 'update' | 'question' | 'answer';
  createdAt: string;
  author: { id: number; name: string; profile_photo?: string | null };
  answers?: GroupPost[];
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

const adaptGroup = (g: any): DiscussionGroup => ({
  id: g.id, name: g.name, slug: g.slug, description: g.description, memberCount: Number(g.memberCount ?? 0),
});
const adaptPost = (p: any): GroupPost => ({
  id: p.id, content: p.content, postType: p.post_type, createdAt: p.created_at || p.createdAt,
  author: p.author, answers: Array.isArray(p.answers) ? p.answers.map(adaptPost) : undefined,
});

export const listGroups = async (): Promise<DiscussionGroup[]> => {
  const res = await publicClient.get('/groups');
  return (unwrap<any[]>(res?.data) || []).map(adaptGroup);
};

export const getGroup = async (slugOrId: string): Promise<DiscussionGroup | null> => {
  try {
    const res = await publicClient.get(`/groups/${slugOrId}`);
    return adaptGroup(unwrap(res?.data));
  } catch {
    return null;
  }
};

export const createGroup = async (name: string, description?: string): Promise<DiscussionGroup> => {
  const res = await apiClient.post('/groups', { name, description });
  return adaptGroup(unwrap(res?.data));
};

export const joinGroup = async (slugOrId: string) => apiClient.post(`/groups/${slugOrId}/join`);
export const leaveGroup = async (slugOrId: string) => apiClient.post(`/groups/${slugOrId}/leave`);

export const listGroupPosts = async (slugOrId: string): Promise<GroupPost[]> => {
  const res = await publicClient.get(`/groups/${slugOrId}/posts`);
  const data = unwrap<any>(res?.data);
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map(adaptPost);
};

export const createGroupPost = async (
  slugOrId: string,
  content: string,
  postType: 'update' | 'question' | 'answer' = 'update',
  parentPostId?: number,
): Promise<GroupPost> => {
  const res = await apiClient.post(`/groups/${slugOrId}/posts`, { content, postType, parentPostId });
  return adaptPost(unwrap(res?.data));
};
