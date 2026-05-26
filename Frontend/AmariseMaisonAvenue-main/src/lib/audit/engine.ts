/**
 * @fileOverview Institutional Audit & Compliance Engine
 * Handles standardized logging and mock report generation.
 */

import { AuditLogEntry } from '../types';

/**
 * Mock Audit Report Generator
 * Returns a CSV-formatted string for institutional documentation.
 */
export function generateAuditReport(logs: AuditLogEntry[]): string {
  const headers = ["ID", "Actor", "Role", "Country", "Action", "Entity", "Severity", "Timestamp"];
  const rows = logs.map(log => [
    log.id,
    log.actorName,
    log.actorRole,
    log.country,
    log.action,
    log.entity,
    log.severity,
    new Date(log.timestamp).toISOString()
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  console.log(`%c[COMPLIANCE REPORT] Generated ${logs.length} entries for export.`, "color: #7E3F98; font-weight: bold;");
  return csv;
}

/**
 * Trigger browser download of mock CSV
 */
export function downloadMockAuditReport(logs: AuditLogEntry[]) {
  const content = generateAuditReport(logs);
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `maison-audit-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
