/**
 * @fileOverview Document Vault Service Orchestrator
 * Decouples the UI from the underlying storage implementation and handles audit logs.
 */

import * as firebaseService from './document.firebase';
import * as mockService from './document.mock';
import { createActivity } from '@/services/activities/activityService';
import { createNotification } from '@/services/notifications/notificationService';
import { logAction } from '@/services/audit/auditService';
import { analyzeDocument } from '@/services/ai/aiService';
import { parseDocumentText } from '@/lib/utils/documentParser';
import { getCasesByClient } from '@/services/cases/caseService';

const USE_MOCK = true;

/**
 * Uplinks a document to the secure network vault.
 */
export const uploadDocument = async (file: File, caseId: string, userId: string, userRole = 'client') => {
  const result = USE_MOCK 
    ? await mockService.mockUploadDocument(file, caseId, userId)
    : await firebaseService.firebaseUploadDocument(file, caseId, userId);

  const docId = (result as any).id;

  // 1. Log Activity
  await createActivity({
    caseId,
    type: 'document_uploaded',
    message: `Record "${file.name}" surgically committed to the secure dossier vault.`,
    performedBy: userId,
    metadata: { fileName: file.name }
  });

  // 2. Trigger Enhanced Notification
  await createNotification({
    userId,
    title: 'New Document Uploaded to Your Case',
    message: `A new professional record "${file.name}" has been successfully committed to your secure vault.`,
    type: 'case_updated',
    relatedCaseId: caseId
  });

  // 3. Audit Log
  await logAction({
    userId,
    userRole,
    action: 'upload_document',
    entityType: 'document',
    entityId: docId || 'unknown',
    details: { fileName: file.name, fileSize: file.size }
  });

  // 4. Trigger AI Analysis (Non-blocking)
  const runAnalysis = async () => {
    try {
      const text = await parseDocumentText(file);
      await analyzeDocument(docId, text);
    } catch (e) {
      console.error("AI Document analysis protocol interrupted:", e);
    }
  };
  
  runAnalysis();

  return result;
};

/**
 * Retrieves all synchronized records for a specific case dossier.
 */
export const getDocumentsByCase = async (caseId: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetDocumentsByCase(caseId);
  }
  return await firebaseService.firebaseGetDocumentsByCase(caseId);
};

/**
 * Retrieves all documents across all cases for a specific user.
 */
export const getAllUserDocuments = async (userId: string) => {
  const cases = await getCasesByClient(userId);
  const docPromises = cases.map(c => getDocumentsByCase(c.id || c.caseId));
  const results = await Promise.all(docPromises);
  return results.flat().sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
};

/**
 * Permanently redacts a document from the network ledger.
 */
export const deleteDocument = async (documentId: string, fileUrl: string) => {
  if (USE_MOCK) {
    return await mockService.mockDeleteDocument(documentId);
  }
  return await firebaseService.firebaseDeleteDocument(documentId, fileUrl);
};
