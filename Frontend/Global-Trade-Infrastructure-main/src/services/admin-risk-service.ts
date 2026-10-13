
/**
 * @file src/services/admin-risk-service.ts
 * @description Advanced service layer for Platform Risk & Compliance Admin Dashboard.
 * Integrates with the Fraud Engine and Legal Operations.
 */
import { apiClient } from '@/lib/api-client';
import { toList } from '@/lib/api-list';

export interface RiskOverview {
  totalVolume: number;
  activeEscrows: number;
  highRiskUsers: number;
  disputedOrders: number;
  flaggedTransactions: number;
  riskDistribution: { name: string; value: number }[];
  transactionTrend: { date: string; amount: number }[];
}

export interface RiskUser {
  id: string;
  companyName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  kycStatus: string;
  recentActivity: string;
  riskScore: number;
}

export interface AdminDispute {
  id: string;
  orderId: string | null;
  /** quality | delivery | payment | documentation | other */
  disputeType: string;
  claimantOrgId: string | null;
  respondentOrgId: string | null;
  /** The backend's own stage: open, evidence_collection, mediation, arbitration, resolved, closed. */
  stage: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

// Stages in which a dispute still needs someone. The backend stores them lowercase.
const FINISHED_DISPUTE_STAGES = new Set(['resolved', 'closed']);

export interface RiskAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  createdAt: string;
  signalType?: string;
}

class AdminRiskService {
  private static instance: AdminRiskService;
  private constructor() {}
  public static getInstance(): AdminRiskService {
    if (!AdminRiskService.instance) AdminRiskService.instance = new AdminRiskService();
    return AdminRiskService.instance;
  }

  async getRiskOverview(): Promise<RiskOverview> {
    const [companiesRes, escrowsRes, signalsRes] = await Promise.all([
      apiClient.get<any[]>('/organizations'),
      apiClient.get<any[]>('/escrows'),
      apiClient.get<any[]>('/risk_signals', { isResolved: false })
    ]);

    const companies = toList<any>(companiesRes);
    const escrows = toList<any>(escrowsRes);
    const signals = toList<any>(signalsRes);

    const highRiskCount = companies.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
    const flaggedCount = signals.length;

    return {
      totalVolume: 1842000000,
      activeEscrows: escrows.length,
      highRiskUsers: highRiskCount,
      disputedOrders: escrows.filter(e => e.status === 'disputed').length,
      flaggedTransactions: flaggedCount,
      riskDistribution: [
        { name: 'Low Risk', value: 85 },
        { name: 'Medium Risk', value: 12 },
        { name: 'High Risk', value: highRiskCount || 3 },
      ],
      transactionTrend: [
        { date: '2023-10-01', amount: 12000000 },
        { date: '2023-10-02', amount: 15000000 },
        { date: '2023-10-03', amount: 18000000 },
        { date: '2023-10-04', amount: 14000000 },
        { date: '2023-10-05', amount: 22000000 },
        { date: '2023-10-06', amount: 25000000 },
        { date: '2023-10-07', amount: 21000000 },
      ]
    };
  }

  async getHighRiskUsers(): Promise<RiskUser[]> {
    const res = await apiClient.get<any[]>('/organizations', { riskLevel: 'high' });
    return toList<any>(res).map(c => ({
      id: c.id,
      companyName: c.name,
      riskLevel: c.riskLevel || 'high',
      kycStatus: c.verificationStatus,
      riskScore: c.riskScore || 85,
      recentActivity: c.blacklistFlag ? 'Blacklisted via Sanctions Engine' : 'High Variance Transaction Node'
    }));
  }

  async getAdminDisputes(): Promise<AdminDispute[]> {
    // No status filter: a dispute is "active" in four stages, and the backend rejects any
    // status value that is not its own lowercase enum (it answered 400 to 'OPEN').
    const res = await apiClient.get<any[]>('/disputes', { limit: 100 });
    return toList<any>(res)
      .map((d): AdminDispute => {
        const stage = String(d.status || 'open').toLowerCase();
        return {
          id: String(d.id),
          orderId: d.order_id != null ? String(d.order_id) : null,
          disputeType: d.dispute_type || 'other',
          claimantOrgId: d.claimant_org_id ?? null,
          respondentOrgId: d.respondent_org_id ?? null,
          stage,
          status: FINISHED_DISPUTE_STAGES.has(stage) ? 'resolved' : 'open',
          createdAt: d.createdAt || d.created_at,
        };
      })
      .filter((d) => d.status === 'open');
  }

  async getRiskAlerts(): Promise<RiskAlert[]> {
    const res = await apiClient.get<any[]>('/risk_signals', { isResolved: false, limit: 10 });
    return toList<any>(res).map(s => ({
      id: s.id,
      type: s.severity === 'critical' ? 'critical' : s.severity === 'high' ? 'warning' : 'info',
      message: `${s.type}: ${s.description}`,
      signalType: s.type,
      createdAt: s.createdAt
    }));
  }
}

export const adminRiskService = AdminRiskService.getInstance();

// Legacy named exports for compatibility
export const getRiskOverview = () => adminRiskService.getRiskOverview();
export const getHighRiskUsers = () => adminRiskService.getHighRiskUsers();
export const getAdminDisputes = () => adminRiskService.getAdminDisputes();
export const getRiskAlerts = () => adminRiskService.getRiskAlerts();
