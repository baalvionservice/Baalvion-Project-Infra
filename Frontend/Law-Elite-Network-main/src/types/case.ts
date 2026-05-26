/**
 * @fileOverview Extended Core Case Type definitions for LawOS.
 */

export type CaseTaskStatus = 'pending' | 'in_progress' | 'completed';
export type CasePriority = 'low' | 'medium' | 'high';

export interface CaseTask {
  id: string;
  title: string;
  status: CaseTaskStatus;
  deadline?: string;
  assignedTo: string;
  createdAt: number;
}

export interface CaseNote {
  id: string;
  text: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: number;
}

export interface TimeLog {
  id: string;
  durationMinutes: number;
  category: 'research' | 'drafting' | 'meeting' | 'court' | 'admin';
  isBillable: boolean;
  description: string;
  createdAt: number;
}

export interface Case {
  id: string;
  caseId: string;
  userId: string;
  clientId: string;
  lawyerId: string | null;
  title: string;
  description: string;
  category: string;
  priority: CasePriority;
  status: "open" | "active" | "closed";
  documents: string[];
  tasks: CaseTask[];
  notes: CaseNote[];
  timeLogs: TimeLog[];
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}
