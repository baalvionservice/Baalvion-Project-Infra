/**
 * @fileOverview Mock Document Implementation
 */

const STORAGE_KEY = 'law_elite_vault_mock';

export const mockUploadDocument = async (file: File, caseId: string, userId: string) => {
  // Simulate professional uplink latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newDoc = {
    id: `doc_${Date.now()}`,
    caseId,
    uploadedBy: userId,
    fileName: file.name,
    fileUrl: 'https://picsum.photos/seed/doc/800/1200',
    fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    fileSize: file.size,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newDoc, ...existing]));
  return newDoc;
};

export const mockGetDocumentsByCase = async (caseId: string) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((d: any) => d.caseId === caseId);
};

export const mockDeleteDocument = async (documentId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updated = all.filter((d: any) => d.id !== documentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
