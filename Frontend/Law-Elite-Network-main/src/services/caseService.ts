/**
 * @fileOverview CaseService
 * Primary service layer for managing legal briefs and document synchronization.
 */

import {
  getCasesMock,
  saveCasesMock,
} from "@/lib/mock/caseMock";
import { Case } from "@/types/case";

/**
 * Commits a new legal brief to the network ledger.
 */
export const createCase = async (caseData: Case): Promise<void> => {
  // Simulate network synchronization latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const data = getCasesMock();
  saveCasesMock([...data, caseData]);
};

/**
 * Retrieves all active briefs for a specific member.
 */
export const getUserCases = async (userId: string): Promise<Case[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const data = getCasesMock();
  return data.filter((c: Case) => c.userId === userId);
};

/**
 * Retrieves all briefs assigned to a specific practitioner.
 */
export const getLawyerCases = async (lawyerId: string): Promise<Case[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const data = getCasesMock();
  return data.filter((c: Case) => c.lawyerId === lawyerId);
};

/**
 * Synchronizes the status of a specific legal matter.
 */
export const updateCaseStatus = async (
  caseId: string,
  status: "open" | "in_progress" | "closed"
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const data = getCasesMock();

  const updated = data.map((c: Case) =>
    c.id === caseId ? { ...c, status, updatedAt: Date.now() } : c
  );

  saveCasesMock(updated);
};
