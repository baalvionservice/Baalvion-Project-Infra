/**
 * @fileOverview Common reusable types and primitives.
 */

export type ID = string;
export type Slug = string;
export type Timestamp = string; // ISO 8601 format

export type Status = 'active' | 'inactive' | 'development' | 'planned' | 'archived';

export type Role = 'admin' | 'writer' | 'editor' | 'creator' | 'reader' | 'guest' | 'viewer';

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  status?: UserStatus;
  avatar?: string;
  dateJoined?: string;
}

export interface RoleDefinition {
  id: string;
  name: Role;
  description: string;
  permissions: string[];
}

export interface BaseModule {
  id: ID;
  name: string;
  description: string;
  status: Status;
}

export interface DashboardWidget {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
}
