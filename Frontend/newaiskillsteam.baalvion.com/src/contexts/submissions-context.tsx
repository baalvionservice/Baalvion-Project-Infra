
'use client';

import type { Submission } from '@/lib/types';
import * as api from '@/lib/api';
import { assignTask as assignTaskWrite, updateSubmission as updateSubmissionWrite } from '@/lib/write-api';
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';

interface SubmissionsContextType {
  submissions: Submission[];
  assignTaskToUser: (data: { taskId: string; userId: string; }) => Promise<void>;
  updateSubmission: (submissionId: string, updates: Partial<Submission>) => Promise<void>;
  findSubmissionByTask: (taskId: string, userId: string) => Submission | undefined;
}

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
      api.getSubmissions().then(data => setSubmissions(data));
  }, []);

  const assignTaskToUser = useCallback(async ({ taskId, userId }: { taskId: string, userId: string }) => {
    const { data: newSubmission } = await assignTaskWrite(taskId, userId);
    if (newSubmission) {
        setSubmissions(prev => {
            if (prev.some(s => s.id === newSubmission.id)) {
                return prev;
            }
            return [...prev, newSubmission];
        });
    }
  }, []);

  const updateSubmission = useCallback(async (submissionId: string, updates: Partial<Submission>) => {
    const currentSubmission = submissions.find(s => s.id === submissionId);
    if (!currentSubmission) return;
    
    // Optimistically update UI
    const updatedSubmission = { ...currentSubmission, ...updates, lastUpdated: new Date().toISOString() };
    setSubmissions(prev => prev.map(s => s.id === submissionId ? updatedSubmission : s));

    // Persist changes to backend
    await updateSubmissionWrite(submissionId, updates);
  }, [submissions]);
  
  const findSubmissionByTask = useCallback((taskId: string, userId: string): Submission | undefined => {
      return submissions.find(sub => sub.taskId === taskId && sub.userId === userId);
  }, [submissions]);

  const value = useMemo(() => ({ submissions, assignTaskToUser, updateSubmission, findSubmissionByTask }), [submissions, assignTaskToUser, updateSubmission, findSubmissionByTask]);

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const context = useContext(SubmissionsContext);
  if (context === undefined) {
    throw new Error('useSubmissions must be used within a SubmissionsProvider');
  }
  return context;
}
