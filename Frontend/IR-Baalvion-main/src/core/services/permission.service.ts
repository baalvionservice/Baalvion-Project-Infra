import {
  UserRole,
  ModuleName,
  ActionType,
  Permission,
  RoleDefinition,
} from "../content/schemas";

const ROLE_REGISTRY: RoleDefinition[] = [
  {
    role: "admin",
    permissions: [
      {
        module: "Navigation",
        actions: ["view", "create", "edit", "delete", "reorder"],
      },
      {
        module: "Pages",
        actions: ["view", "create", "edit", "publish", "delete"],
      },
      { module: "DataRoom", actions: ["view", "upload", "delete", "reorder"] },
      { module: "Dashboard", actions: ["view", "configure"] },
      { module: "Governance", actions: ["view", "manage"] },
      { module: "AuditLogs", actions: ["view"] },
      { module: "Settings", actions: ["view", "manage"] },
    ],
  },
  {
    role: "ComplianceOfficer",
    permissions: [
      { module: "Governance", actions: ["view", "manage"] },
      { module: "AuditLogs", actions: ["view"] },
      { module: "DataRoom", actions: ["view"] },
    ],
  },
  {
    role: "IRManager",
    permissions: [
      { module: "Pages", actions: ["view", "edit"] },
      { module: "Navigation", actions: ["view", "edit"] },
      { module: "DataRoom", actions: ["view", "upload"] },
    ],
  },
];

export const permissionService = {
  hasPermission: async (
    role: UserRole,
    module: ModuleName,
    action: ActionType
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const roleDef = ROLE_REGISTRY.find((r) => r.role === role);
    if (!roleDef) return false;

    const permission = roleDef.permissions.find((p) => p.module === module);
    if (!permission) return false;

    return permission.actions.includes(action);
  },

  getRolePermissions: async (role: UserRole): Promise<Permission[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return ROLE_REGISTRY.find((r) => r.role === role)?.permissions || [];
  },
};
