
import { CaseService } from '../services/case.service';
import { ApiResponse, UserRole } from '../types';

export class CaseController {
  constructor(private caseService: CaseService) {}

  async postCase(req: { clientUid: string; role: UserRole; caseData: any }): Promise<ApiResponse> {
    try {
      const data = await this.caseService.createCase(req.clientUid, req.role, req.caseData);
      return { success: true, message: 'Legal brief published successfully.', data };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to post case', error: error.message };
    }
  }

  async getMyCases(clientUid: string): Promise<ApiResponse> {
    try {
      const data = await this.caseService.getClientCases(clientUid);
      return { success: true, message: 'Client cases fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async discoverCases(params: any = {}): Promise<ApiResponse> {
    try {
      const data = await this.caseService.getPublicCases(params);
      return { success: true, message: 'Public cases discovered', data };
    } catch (error: any) {
      return { success: false, message: 'Discovery failed', error: error.message };
    }
  }

  async closeCase(req: { caseId: string; clientUid: string; isAdmin: boolean }): Promise<ApiResponse> {
    try {
      await this.caseService.closeCase(req.caseId, req.clientUid, req.isAdmin);
      return { success: true, message: 'Case successfully closed.' };
    } catch (error: any) {
      return { success: false, message: 'Closure failed', error: error.message };
    }
  }
}
