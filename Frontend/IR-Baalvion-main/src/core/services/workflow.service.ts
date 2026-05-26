"use client";

import { WorkflowStatus, UserRole, ModuleName } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { permissionService } from "./permission.service";
import { settingsService } from "./settings.service";

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  Draft: ["InReview"],
  InReview: ["Approved", "Rejected"],
  Approved: ["Published"],
  Published: ["Archived", "Draft"],
  Rejected: ["Draft"],
  Archived: ["Draft"],
};

export const workflowService = {
  canTransition: (current: WorkflowStatus, next: WorkflowStatus): boolean => {
    return VALID_TRANSITIONS[current]?.includes(next) || false;
  },

  handleTransition: async (
    entityId: string,
    module: ModuleName,
    currentStatus: WorkflowStatus,
    targetStatus: WorkflowStatus,
    updateFn: (newStatus: WorkflowStatus) => Promise<void>
  ) => {
    const { role } = await authService.getCurrentUser();
    const settings = await settingsService.getSettings();

    // Check Publishing Freeze
    if (targetStatus === "Published" && settings.features.freezePublishing) {
      throw new Error("Publishing is currently frozen for compliance review.");
    }

    // Check Permissions
    const canManage = await permissionService.hasPermission(
      role,
      module,
      "manage"
    );
    const isCompliance = role === "ComplianceOfficer" || role === "admin";

    if (targetStatus === "Approved" || targetStatus === "Rejected") {
      if (!isCompliance)
        throw new Error(
          "Only Compliance Officers can approve or reject changes."
        );
    }

    if (!workflowService.canTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Invalid state transition from ${currentStatus} to ${targetStatus}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    await updateFn(targetStatus);

    await auditService.log({
      userRole: role,
      module: "Workflow",
      action: "manage",
      entityId,
      previousState: { status: currentStatus },
      newState: { status: targetStatus },
    });

    window.dispatchEvent(new Event("workflow-updated"));
  },
};
