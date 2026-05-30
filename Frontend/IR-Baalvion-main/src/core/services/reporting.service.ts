'use client';

import { Report, ExportFormat } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { votingService } from "./voting.service";
import { notificationService } from "./notification.service";
import { boardMaterialsService } from "./board-materials.service";
import { pageService } from "./page.service";
import { generatedReportsApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/generated-reports. Report generation aggregates a snapshot
// from the (now real) voting/board/page/notification services, then persists it. No in-memory mock.
export const reportingService = {
  getAllReports: async (): Promise<Report[]> => {
    const list = (await generatedReportsApi.list()) as Report[];
    return list.sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());
  },

  getReportById: async (id: string): Promise<Report | null> => {
    return (await generatedReportsApi.get(id)) as Report | null;
  },

  createReport: async (report: Omit<Report, 'id' | 'status' | 'versionHistory' | 'generatedAt' | 'dataSnapshot'>): Promise<string> => {
    const { role } = await authService.getCurrentUser();
    const created: any = await generatedReportsApi.create({
      ...report,
      status: 'Draft',
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString() }],
    });
    await auditService.log({ userRole: role, module: 'Reporting', action: 'create', entityId: String(created.id), newState: created });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('report-updated'));
    return String(created.id);
  },

  generateReport: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const report = await generatedReportsApi.get(id);
    if (!report || report.status === 'Generated') return;

    // Aggregate a snapshot from the live services
    const snapshots: any = {};
    if (report.reportType === 'Voting') {
      snapshots.votes = await votingService.getVotes();
    } else if (report.reportType === 'Governance') {
      snapshots.auditLogs = await auditService.getLogs({ limit: 100 });
      snapshots.boardMaterials = await boardMaterialsService.getMaterials();
    } else if (report.reportType === 'System') {
      const pagesRes = await pageService.getAllPages();
      snapshots.pages = pagesRes.data || [];
      snapshots.notifications = await notificationService.getAllNotifications();
    }

    await generatedReportsApi.update(id, { status: 'Generated', generatedAt: new Date().toISOString(), dataSnapshot: snapshots });
    await auditService.log({ userRole: role, module: 'Reporting', action: 'generate', entityId: id, newState: { status: 'Generated', snapshotKeys: Object.keys(snapshots) } });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('report-updated'));
  },

  exportReport: async (id: string, format: ExportFormat): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const report = await generatedReportsApi.get(id);
    if (!report || report.status !== 'Generated') throw new Error("Report must be generated before export.");

    // Client-side file download of the persisted snapshot
    const content = JSON.stringify(report.dataSnapshot, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().getTime()}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    await auditService.log({ userRole: role, module: 'Reporting', action: 'export', entityId: id, newState: { format } });
  },

  archiveReport: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    await generatedReportsApi.update(id, { status: 'Archived' });
    await auditService.log({ userRole: role, module: 'Reporting', action: 'delete', entityId: id, newState: { status: 'Archived' } });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('report-updated'));
  },
};
