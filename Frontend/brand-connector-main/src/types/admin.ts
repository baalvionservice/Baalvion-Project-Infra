
export type AdminRole = 'super_admin' | 'ops_manager' | 'support_lead';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLogin: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalCampaigns: number;
  totalPayments: number;
  activeSubscriptions: number;
  growthRate: number;
  avgOrderValue: number;
}

export interface SystemLog {
  id: string;
  event: 'user_signup' | 'payment_success' | 'campaign_complete' | 'dispute_filed' | 'system_alert';
  message: string;
  timestamp: string;
  metadata?: any;
}
