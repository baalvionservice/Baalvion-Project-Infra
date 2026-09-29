/**
 * @fileOverview Lawyer Connection Service — follow / connect / collaborate
 * (spec area 5). Backed by law-service /v1/connections.
 */
import { apiClient } from '@/lib/api/client';

export type ConnectionRelation = 'follow' | 'connect' | 'collaborate';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface LawyerConnection {
  id: number;
  relation: ConnectionRelation;
  status: ConnectionStatus;
  createdAt: string;
  requester: { id: number; name: string; profile_photo?: string | null; country?: string; city?: string };
  addressee: { id: number; name: string; profile_photo?: string | null; country?: string; city?: string };
}

export interface GroupUpdatePost {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string; profile_photo?: string | null };
  group: { id: number; name: string; slug: string };
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

export const sendConnectionRequest = async (addresseeId: number, relation: ConnectionRelation) => {
  const res = await apiClient.post('/connections', { addresseeId, relation });
  return unwrap(res?.data);
};

export const acceptConnectionRequest = async (id: number) => apiClient.post(`/connections/${id}/accept`);
export const declineConnectionRequest = async (id: number) => apiClient.post(`/connections/${id}/decline`);
export const removeConnection = async (id: number) => apiClient.delete(`/connections/${id}`);

export const listConnections = async (box: 'followers' | 'following' | 'connections' | 'pending'): Promise<LawyerConnection[]> => {
  const res = await apiClient.get('/connections', { params: { box } });
  const data = unwrap<any>(res?.data);
  return Array.isArray(data) ? data : data?.items || [];
};

export const getNetworkFeed = async (): Promise<GroupUpdatePost[]> => {
  const res = await apiClient.get('/connections/feed');
  return unwrap<GroupUpdatePost[]>(res?.data) || [];
};
