"use client";

import { BoardMaterial, WorkflowStatus } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { boardMaterialsApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/board-materials. Visibility (board members see all, others
// only Published) is enforced client-side. No in-memory mock.
export const boardMaterialsService = {
  getMaterials: async (): Promise<BoardMaterial[]> => {
    const { role } = await authService.getCurrentUser();
    const all = (await boardMaterialsApi.list()) as BoardMaterial[];
    if (role === "BoardMember" || role === "admin" || role === "ComplianceOfficer") {
      return all;
    }
    return all.filter((m) => m.workflowStatus === "Published");
  },

  createMaterial: async (
    material: Omit<BoardMaterial, "id" | "versionHistory" | "workflowStatus">
  ): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const created: any = await boardMaterialsApi.create({
      ...material,
      workflowStatus: "Draft",
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString() }],
    });
    await auditService.log({ userRole: role, module: "BoardMaterials", action: "create", entityId: String(created.id), newState: created });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("materials-updated"));
  },

  updateStatus: async (id: string, status: WorkflowStatus): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    await boardMaterialsApi.update(id, { workflowStatus: status });
    await auditService.log({ userRole: role, module: "BoardMaterials", action: "manage", entityId: id, newState: { status } });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("materials-updated"));
  },
};
