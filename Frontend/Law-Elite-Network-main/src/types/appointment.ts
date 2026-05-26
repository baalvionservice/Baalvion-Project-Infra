/**
 * @fileOverview Core Appointment Type definitions for the Law Elite Network.
 */

export interface Appointment {
  id?: string;
  appointmentId?: string;
  clientId: string;
  lawyerId: string;
  lawyerName?: string;
  caseId: string;
  caseTitle?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}
