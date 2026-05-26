
export type TeamRole = "admin" | "manager" | "viewer";
export type TeamStatus = "active" | "invited";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  joinedAt: string;
  avatar?: string;
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface PermissionMatrix {
  admin: Permission[];
  manager: Permission[];
  viewer: Permission[];
}
