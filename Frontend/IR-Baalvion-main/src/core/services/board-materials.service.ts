"use client";

import {
  BoardMaterial,
  WorkflowStatus,
  BoardMaterialClassification,
  UserRole,
} from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";

let materialsState: BoardMaterial[] = [
  {
    id: "mat-001",
    title: "Q4 Strategic M&A Briefing",
    meetingDate: "2026-02-15",
    classification: "Confidential",
    relatedVotes: ["vote-001"],
    documentIds: ["doc-1", "doc-2"],
    workflowStatus: "Published",
    versionHistory: [],
  },
];

export const boardMaterialsService = {
  getMaterials: async (): Promise<BoardMaterial[]> => {
    const { role } = await authService.getCurrentUser();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Board members see everything, others see only Published
    if (
      role === "BoardMember" ||
      role === "admin" ||
      role === "ComplianceOfficer"
    ) {
      return [...materialsState];
    }
    return materialsState.filter((m) => m.workflowStatus === "Published");
  },

  createMaterial: async (
    material: Omit<BoardMaterial, "id" | "versionHistory" | "workflowStatus">
  ): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newMat: BoardMaterial = {
      ...material,
      id: `mat-${Math.random().toString(36).substr(2, 9)}`,
      workflowStatus: "Draft",
      versionHistory: [
        { version: 1, author: role, timestamp: new Date().toISOString() },
      ],
    };

    materialsState.push(newMat);
    await auditService.log({
      userRole: role,
      module: "BoardMaterials",
      action: "create",
      entityId: newMat.id,
      newState: newMat,
    });
    window.dispatchEvent(new Event("materials-updated"));
  },

  updateStatus: async (id: string, status: WorkflowStatus): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const mat = materialsState.find((m) => m.id === id);
    if (!mat) return;

    await new Promise((resolve) => setTimeout(resolve, 200));
    mat.workflowStatus = status;

    await auditService.log({
      userRole: role,
      module: "BoardMaterials",
      action: "manage",
      entityId: id,
      newState: { status },
    });
    window.dispatchEvent(new Event("materials-updated"));
  },
};
