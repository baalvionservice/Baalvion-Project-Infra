'use client';

import { Report, ReportType, ReportStatus, ExportFormat, ModuleName } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { votingService } from "./voting.service";
import { notificationService } from "./notification.service";
import { boardMaterialsService } from "./board-materials.service";
import { pageService } from "./page.service";

let reportsState: Report[] = [
  {
    id: 'rep-001',
    title: 'FY2025 Annual Governance Review',
    reportType: 'Governance',
    dateRange: { start: '2025-01-01', end: '2025-12-31' },
    includedModules: ['Governance', 'AuditLogs'],
    generatedByRole: 'ComplianceOfficer',
    status: 'Generated',
    generatedAt: '2026-01-05T10:00:00Z',
    exportFormat: 'PDF',
    dataSnapshot: { summary: 'Historical baseline for 2025 compliance.' },
    versionHistory: []
  }
];

export const reportingService = {
  getAllReports: async (): Promise<Report[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...reportsState].sort((a, b) => {
      const dateA = new Date(a.generatedAt || 0).getTime();
      const dateB = new Date(b.generatedAt || 0).getTime();
      return dateB - dateA;
    });
  },

  getReportById: async (id: string): Promise<Report | null> => {
    return reportsState.find(r => r.id === id) || null;
  },

  createReport: async (report: Omit<Report, 'id' | 'status' | 'versionHistory' | 'generatedAt' | 'dataSnapshot'>): Promise<string> => {
    const { role } = await authService.getCurrentUser();
    await new Promise(resolve => setTimeout(resolve, 200));

    const newReport: Report = {
      ...report,
      id: `rep-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Draft',
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString() }]
    };

    reportsState.push(newReport);
    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'create',
      entityId: newReport.id,
      newState: newReport
    });

    window.dispatchEvent(new Event('report-updated'));
    return newReport.id;
  },

  generateReport: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const report = reportsState.find(r => r.id === id);
    if (!report || report.status === 'Generated') return;

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate intensive data aggregation

    // Aggregate snapshots from other services
    const snapshots: any = {};
    
    if (report.reportType === 'Voting') {
      snapshots.votes = await votingService.getVotes();
    } else if (report.reportType === 'Governance') {
      snapshots.auditLogs = await auditService.getLogs({ limit: 100 });
      snapshots.boardMaterials = await boardMaterialsService.getMaterials();
    } else if (report.reportType === 'System') {
      snapshots.pages = await pageService.getAllPages();
      snapshots.notifications = await notificationService.getAllNotifications();
    }

    report.status = 'Generated';
    report.generatedAt = new Date().toISOString();
    report.dataSnapshot = snapshots;

    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'generate',
      entityId: id,
      newState: { status: 'Generated', snapshotKeys: Object.keys(snapshots) }
    });

    window.dispatchEvent(new Event('report-updated'));
  },

  exportReport: async (id: string, format: ExportFormat): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const report = reportsState.find(r => r.id === id);
    if (!report || report.status !== 'Generated') throw new Error("Report must be generated before export.");

    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock file download
    const content = JSON.stringify(report.dataSnapshot, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().getTime()}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'export',
      entityId: id,
      newState: { format }
    });
  },

  archiveReport: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const report = reportsState.find(r => r.id === id);
    if (!report) return;

    report.status = 'Archived';
    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'delete',
      entityId: id,
      newState: { status: 'Archived' }
    });
    window.dispatchEvent(new Event('report-updated'));
  }
};
