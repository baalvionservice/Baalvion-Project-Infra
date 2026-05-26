
"use client";

import { apiClient } from '@/lib/api/client';

export class CaseMatchRepository {
  constructor() {}

  async create(data: { caseId: string; lawyerUid: string; score: number }) {
    try {
      const res = await apiClient.post('/cases/matches', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getMatchesByCase(caseId: string) {
    try {
      const res = await apiClient.get('/cases/matches', { params: { caseId } });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }

  async getMatchesByLawyer(lawyerUid: string) {
    try {
      const res = await apiClient.get('/cases/matches', { params: { lawyerUid } });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }
}
