/**
 * @fileOverview Type definitions for global system configuration and administrative rules.
 */

export interface PlatformSettings {
  name: string;
  logoUrl: string;
  description: string;
  features: {
    seo: boolean;
    analytics: boolean;
    payments: boolean;
  };
}

export interface BrandingSettings {
  logoUrl: string;
  platformName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface FeatureSettings {
  seo: boolean;
  analytics: boolean;
  payments: boolean;
  contentModeration: boolean;
}

export interface SystemSettings {
  platform: {
    siteName: string;
    contactEmail: string;
    maintenanceMode: boolean;
    defaultCurrency: string;
  };
  seo: {
    defaultTitleTemplate: string;
    metaDescriptionTemplate: string;
    indexProgrammablePages: boolean;
    autoGenerateSitemaps: boolean;
  };
  notifications: {
    enableEmailAlerts: boolean;
    adminDailyDigest: boolean;
    systemAlertsWebhook: string;
  };
  governance: {
    requireVettingForMonetization: boolean;
    defaultRevenueShare: number; // percentage
    allowSelfOnboarding: boolean;
    autoModerateComments: boolean;
  };
}

export interface GlobalNotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
  };
  sessionTimeoutMinutes: number;
}

export interface SecurityDashboardData {
  system_health: "Good" | "Warning" | "Critical";
  active_threats: number;
  failed_logins: number;
  rate_limit_status: "Normal" | "Throttled" | "High";
  admin_ip_restriction: string[];
}

export type SystemNotificationType = "info" | "success" | "warning" | "error";
export type SystemNotificationTarget = "all" | "creators" | "admins";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  active: boolean;
  type: SystemNotificationType;
  target: SystemNotificationTarget;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  type: string;
  status: "sent" | "pending" | "failed";
  title: string;
}

export type AdminAlertType = "content" | "user" | "system";

export interface AdminAlert {
  id: string;
  type: AdminAlertType;
  message: string;
  read: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high";
}

export interface SystemAlert {
  id: string;
  message: string;
  type: "Info" | "Warning" | "Critical";
  status: "Active" | "Inactive";
  date: string;
}

export interface SystemHealth {
  uptimePercentage: number;
  errorCountLast24h: number;
  apiStatus: "Healthy" | "Warning" | "Critical";
  latency: number;
  apiUptime: number;
  dbStatus: "Healthy" | "Warning" | "Critical";
  serverLoad: number;
  errorRate: number;
  history: {
    timestamp: string;
    errors: number;
    load: number;
  }[];
  nodes: {
    name: string;
    status: "Healthy" | "Warning" | "Critical";
    load: number;
  }[];
}

export interface Backup {
  id: string;
  timestamp: string;
  status: "completed" | "failed" | "in-progress";
  size: string;
  type: "automated" | "manual";
  checksum: string;
}

export interface AccessLog {
  id: string;
  user: string;
  ip: string;
  device: string;
  timestamp: string;
  status: "success" | "failed";
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  module: string;
  type: "info" | "warning" | "critical";
  message: string;
  stackTrace?: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  impact: "low" | "medium" | "high";
  isBeta: boolean;
  module: string;
}

export interface AdminActivityLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  date: string;
  status: "Success" | "Failed";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  userName: string;
  type?: string;
  status?: "Success" | "Failed";
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module?: string;
  status?: "Success" | "Failed";
}

export interface RoleControl {
  id: string;
  roleName: string;
  usersAssigned: number;
  permissions: string[];
  description?: string;
}

export interface Permission {
  name: string;
  enabled: boolean;
}

export interface RolePermissionSet {
  roleId: string;
  roleName: string;
  description: string;
  permissions: Permission[];
}

export interface AdminSession {
  id: string;
  user: string;
  role: string;
  loginTime: string;
  ip: string;
  status: "Active" | "Inactive";
}

export interface AdminHomeOverview {
  totalUsers: number;
  totalCreators: number;
  pendingModeration: number;
  activeSessions: number;
  alertsActive: number;
  pSEONodes: number;
  systemHealth: "Healthy" | "Degraded" | "Critical";
}

/**
 * Prompt 42: Admin CMS Dashboard Types
 */
export interface CMSContentItem {
  content_id: string | number;
  title: string;
  author: string;
  status: "Draft" | "Review" | "Published";
  last_updated: string;
}

export interface UserRoleItem {
  username: string;
  role: "Admin" | "Editor" | "Moderator" | "Viewer";
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface CMSAnalyticsMetric {
  metric: string;
  value: number;
}

export interface SystemLogItem {
  event: string;
  user: string;
  timestamp: string;
}

export interface CMSDashboardData {
  cms_content: CMSContentItem[];
  user_roles: UserRoleItem[];
  analytics: CMSAnalyticsMetric[];
  system_logs: SystemLogItem[];
}

/**
 * Prompt 43: Admin System Hub Types
 */
export interface AdminAnalyticsKPI {
  metric: string;
  value: number;
  trend: "up" | "down";
}

export interface SystemMonitoringNode {
  server: string;
  cpu_usage: string;
  memory_usage: string;
  active_requests: number;
  uptime: string;
  status: "healthy" | "warning" | "critical";
}

export interface ThresholdAlert {
  alert_type: string;
  server: string;
  threshold: string;
  current: string;
  status: "mock_triggered" | "resolved";
}

export interface AdminSystemHubData {
  analytics: AdminAnalyticsKPI[];
  system_monitoring: SystemMonitoringNode[];
  alerts: ThresholdAlert[];
}

/**
 * Prompt 44: Security Mock Types
 */
export interface AuthMockEntry {
  user: string;
  role: "Admin" | "Editor" | "User";
  login_status: "success" | "failed";
  "2FA_required": boolean;
}

export interface SecurityFlag {
  feature: string;
  status: "mock_enabled" | "mock_displayed" | "mock_disabled";
}

export interface SecurityAlert {
  alert_type: string;
  user: string;
  status: "mock_triggered" | "resolved";
}

export interface SecurityMockData {
  auth_mock: AuthMockEntry[];
  security_flags: SecurityFlag[];
  alerts: SecurityAlert[];
}

/**
 * Prompt 45: Infrastructure & Scale Mock Types
 */
export interface InfrastructureNode {
  cluster: string;
  nodes: number;
  cpu_usage: string;
  memory_usage: string;
  network_usage: string;
  auto_scaling: "mock_active" | "mock_inactive";
}

export interface PipelineNode {
  pipeline_name: string;
  status: "mock_success" | "mock_running" | "mock_failed";
  progress: string;
}

export interface QueueNode {
  name: string;
  queue_length: number;
  processed_jobs: number;
  error_rate: "mock_none" | "mock_low" | "mock_medium" | "mock_high";
}

export interface InfrastructureMockData {
  infrastructure: InfrastructureNode[];
  ci_cd: PipelineNode[];
  caching_queues: QueueNode[];
}

/**
 * Prompt 46: Edge Computing & Multi-Region Types
 */
export interface RegionNode {
  region_name: string;
  nodes: number;
  latency: string;
  status: "mock_active" | "mock_warning" | "mock_offline";
}

export interface EdgeNode {
  node_name: string;
  region: string;
  cpu_usage: string;
  memory_usage: string;
  network_traffic: string;
}

export interface EdgeAlert {
  alert_type: string;
  region?: string;
  node?: string;
  current?: string;
  status: "mock_triggered" | "resolved";
}

export interface EdgeComputingData {
  regions: RegionNode[];
  edge_nodes: EdgeNode[];
  alerts: EdgeAlert[];
}

/**
 * Prompt 47: CDN & Page Cache Types
 */
export interface CdnNode {
  node_name: string;
  region: string;
  latency: string;
  bandwidth_usage: string;
  status: "mock_active" | "mock_warning" | "mock_inactive";
}

export interface PageCacheItem {
  page_url: string;
  cache_status: "mock_cached" | "mock_expired" | "mock_miss";
  last_refresh: string;
  ttl: string;
  cache_hit_ratio: string;
}

export interface CdnLogEntry {
  alert_type?: string;
  node?: string;
  status?: string;
  log_type?: string;
  page?: string;
  timestamp: string;
}

export interface CdnManagementData {
  cdn_nodes: CdnNode[];
  page_cache: PageCacheItem[];
  alerts_logs: CdnLogEntry[];
}

/**
 * Prompt 48: SEO & Sitemap Types
 */
export interface SeoManagementPage {
  page_url: string;
  title: string;
  meta_description: string;
  focus_keywords: string[];
  seo_score: string | number;
  social_preview: string;
}

export interface SitemapEntry {
  page_url: string;
  parent: string;
  status: "mock_active" | "mock_inactive";
  last_updated: string;
}

export interface SeoAlertSuggestion {
  alert_type?: string;
  suggestion?: string;
  page: string;
  status: "mock_triggered" | "mock_suggested";
}

export interface SeoManagementData {
  seo_pages: SeoManagementPage[];
  sitemap: SitemapEntry[];
  alerts_suggestions: SeoAlertSuggestion[];
}

/**
 * Prompt 49: Experiment Tracking & A/B Testing Types
 */
export interface ExperimentNode {
  id?: string;
  experiment_name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "mock_running" | "mock_completed" | "mock_draft";
  kpi: {
    CTR: string;
    Conversions: string;
    Engagement?: string;
  };
}

export interface AbVariant {
  variant: string; // A, B, C
  traffic: string; // 50%
  metric_values: {
    CTR: string;
    Conversions: string;
  };
}

export interface ExperimentDetail {
  experiment_name: string;
  timeline: string;
  results_graph: string;
  variant_insights: string;
  chart_data?: { date: string; variantA: number; variantB: number }[];
}

export interface ExperimentManagementData {
  experiments: ExperimentNode[];
  ab_variants: AbVariant[];
  experiment_details: ExperimentDetail[];
}

/**
 * Prompt 50: Incident Response & Alerts Types
 */
export interface IncidentNode {
  incident_id: string;
  type: string;
  severity: "High" | "Medium" | "Low";
  status: "mock_active" | "mock_acknowledged" | "mock_resolved";
  timestamp: string;
}

export interface SystemAlertNode {
  alert_id: string;
  source: string;
  severity: "High" | "Medium" | "Low";
  message: string;
  timestamp: string;
}

export interface IncidentDetail {
  incident_id: string;
  timeline: string;
  affected_systems: string[];
  suggested_resolution: string;
}

export interface IncidentResponseData {
  incidents: IncidentNode[];
  alerts: SystemAlertNode[];
  incident_details: IncidentDetail[];
}

/**
 * Prompt 51: Feature Flags & RBAC Types
 */
export interface FeatureFlagNode {
  feature_name: string;
  description: string;
  status: "mock_on" | "mock_off";
  category?: string;
}

export interface RoleAccessNode {
  role_name: string;
  permissions: string[];
}

export interface UserAssignmentNode {
  user: string;
  assigned_role: string;
}

export interface AccessManagementData {
  feature_flags: FeatureFlagNode[];
  roles: RoleAccessNode[];
  mock_user_assignments: UserAssignmentNode[];
}

/**
 * Prompt 52: Multi-Language & Localization Types
 */
export interface LanguageNode {
  language_code: string;
  language_name: string;
  status: "mock_enabled" | "mock_disabled";
}

export interface LocalizationItem {
  key: string;
  source_text: string;
  translation: Record<string, string>;
  status: "mock_reviewed" | "mock_pending" | "mock_approved";
  module?: string;
}

export interface LocalizationData {
  languages: LanguageNode[];
  localization_content: LocalizationItem[];
}

/**
 * Prompt 53: Advanced Alerts & Notifications Types
 */
export interface AdvancedAlertNode {
  alert_id: string;
  type: string;
  severity: "High" | "Medium" | "Low";
  source: string;
  timestamp: string;
  status: "mock_active" | "mock_resolved" | "mock_snoozed";
}

export interface NotificationChannelNode {
  channel: string;
  status: "mock_enabled" | "mock_disabled";
  last_sent: string;
}

export interface AlertRuleNode {
  rule_name: string;
  condition: string;
  priority: "mock_high" | "mock_medium" | "mock_low";
  status: "mock_active" | "mock_inactive";
}

export interface AlertsSystemData {
  alerts: AdvancedAlertNode[];
  notification_channels: NotificationChannelNode[];
  alert_rules: AlertRuleNode[];
}

/**
 * Prompt 73: Platform Transparency Report Types
 */
export interface TransparencyMetrics {
  articles_published: number;
  contributors: number;
  editorial_reviews: number;
  moderation_actions: number;
  community_reports: number;
  revisions_made: number;
}

export interface TransparencyReportNode {
  id: string;
  title: string;
  period: string;
  summary: string;
}

export interface TransparencyData {
  metrics: TransparencyMetrics;
  moderation: {
    removed: number;
    flagged: number;
    warnings: number;
    restricted: number;
    resolved: number;
    trends: { date: string; removed: number; flagged: number }[];
  };
  editorial: {
    submitted: number;
    approved: number;
    rejected: number;
    revised: number;
    trends: { date: string; approved: number; revised: number }[];
  };
  community: {
    discussions: number;
    comments: number;
    votes: number;
    predictions: number;
    trends: { date: string; engagement: number }[];
  };
  quality: {
    avg_score: number;
    verified_pct: number;
    needs_improvement: number;
    top_rated: number;
    trends: { date: string; score: number }[];
  };
  reports: TransparencyReportNode[];
}
