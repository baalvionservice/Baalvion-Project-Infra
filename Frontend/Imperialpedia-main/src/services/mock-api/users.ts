import { User, ApiResponse, UserStatus } from '@/types';

/**
 * @fileOverview Mock service for managing platform identities and access states.
 * Aligned with Prompt 27 requirements for Admin Control.
 */

export const mockUsers: User[] = [
  { id: 'u-1', name: 'Eleanor Vance', email: 'eleanor@imperialpedia.com', role: 'admin', status: 'active', dateJoined: '2023-12-01T10:00:00Z' },
  { id: 'u-2', name: 'The Market Maven', email: 'maven@imperialpedia.com', role: 'creator', status: 'active', dateJoined: '2024-01-15T09:30:00Z' },
  { id: 'u-3', name: 'Expert Editor', email: 'editor@imperialpedia.com', role: 'editor', status: 'active', dateJoined: '2024-02-10T14:20:00Z' },
  { id: 'u-4', name: 'Wealth Builder', email: 'wealth@imperialpedia.com', role: 'creator', status: 'suspended', dateJoined: '2023-11-05T11:00:00Z' },
  { id: 'u-5', name: 'Platform Lead', email: 'lead@imperialpedia.com', role: 'admin', status: 'active', dateJoined: '2022-12-01T08:00:00Z' },
  { id: 'u-6', name: 'Sarah Crypto', email: 'sarah@web3.io', role: 'creator', status: 'active', dateJoined: '2024-03-01T16:45:00Z' },
  { id: 'u-7', name: 'Standard Reader', email: 'reader@example.com', role: 'viewer', status: 'active', dateJoined: '2024-03-10T12:00:00Z' },
];

export const getUsers = async (): Promise<ApiResponse<User[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockUsers,
    status: 200,
  };
};

export const updateUserStatuses = async (userIds: string[], status: UserStatus): Promise<ApiResponse<User[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const updated = mockUsers.map(u => userIds.includes(u.id) ? { ...u, status } : u);
  return {
    data: updated,
    status: 200,
    message: `Successfully updated ${userIds.length} users to ${status}.`
  };
};
