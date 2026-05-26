import { ApiResponse, RoleDefinition, RoleControl, RolePermissionSet } from '@/types';

/**
 * @fileOverview Mock service for managing platform roles and capability nodes.
 * Aligned with Prompt 27 requirements for Persona orchestration.
 */

export let mockControlRoles: RoleControl[] = [
  { id: 'role-1', roleName: 'Admin', usersAssigned: 5, description: 'Full system oversight and security governance.', permissions: ['edit_content', 'publish_content', 'delete_content', 'manage_users', 'system_config'] },
  { id: 'role-2', roleName: 'Editor', usersAssigned: 12, description: 'Editorial workflow management and fact-checking.', permissions: ['edit_content', 'publish_content', 'content_moderate'] },
  { id: 'role-3', roleName: 'Creator', usersAssigned: 156, description: 'Expert analysis publication and audience engagement.', permissions: ['content_create', 'content_edit_own', 'analytics_view_own'] },
  { id: 'role-4', roleName: 'Viewer', usersAssigned: 142500, description: 'General audience with read and tool access.', permissions: ['content_read', 'tools_use'] },
];

export const ALL_PERMISSIONS = [
  { id: 'manage_users', label: 'Manage Users', description: 'Suspend or purge user identities.' },
  { id: 'role_manage', label: 'Manage Roles', description: 'Modify system access levels.' },
  { id: 'content_moderate', label: 'Moderate Content', description: 'Flag and remove community input.' },
  { id: 'publish_content', label: 'Publish Content', description: 'Commit articles to the live index.' },
  { id: 'edit_content', label: 'Edit Content', description: 'Refine any intelligence node.' },
  { id: 'delete_content', label: 'Delete Content', description: 'Permanently remove nodes from index.' },
  { id: 'system_config', label: 'System Config', description: 'Manage categories and global logic.' },
  { id: 'content_create', label: 'Create Content', description: 'Draft new research insights.' },
  { id: 'content_read', label: 'Read Content', description: 'Access all published nodes.' },
  { id: 'tools_use', label: 'Use Tools', description: 'Utilize financial engines.' },
];

export const getRoles = async (): Promise<ApiResponse<RoleDefinition[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockControlRoles.map(r => ({
      id: r.id,
      name: r.roleName.toLowerCase() as any,
      description: r.description || '',
      permissions: r.permissions
    })),
    status: 200,
  };
};

export const getControlRoles = async (): Promise<ApiResponse<RoleControl[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockControlRoles,
    status: 200,
  };
};

export const getRolePermissions = async (): Promise<ApiResponse<RolePermissionSet[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const data: RolePermissionSet[] = mockControlRoles.map(role => ({
    roleId: role.id,
    roleName: role.roleName,
    description: role.description || '',
    permissions: ALL_PERMISSIONS.map(p => ({
      name: p.label,
      enabled: role.permissions.includes(p.id)
    }))
  }));

  return {
    data,
    status: 200
  };
};

export const assignPermissions = async (roleId: string, permissions: string[]): Promise<ApiResponse<RoleControl>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const index = mockControlRoles.findIndex(r => r.id === roleId);
  if (index !== -1) {
    mockControlRoles[index].permissions = permissions;
    return {
      data: mockControlRoles[index],
      status: 200,
      message: 'Capability map synchronized.'
    };
  }
  return {
    data: null as any,
    status: 404,
    message: 'Role not found.'
  };
};

export const createOrUpdateRole = async (role: Partial<RoleControl>): Promise<ApiResponse<RoleControl[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  if (role.id) {
    mockControlRoles = mockControlRoles.map(r => r.id === role.id ? { ...r, ...role } : r);
  } else {
    const newRole: RoleControl = {
      id: `role-${Math.random().toString(36).substr(2, 5)}`,
      roleName: role.roleName || 'New Role',
      usersAssigned: 0,
      description: role.description || '',
      permissions: role.permissions || []
    };
    mockControlRoles.push(newRole);
  }

  return {
    data: mockControlRoles,
    status: 200,
    message: 'Role matrix synchronized successfully.'
  };
};
