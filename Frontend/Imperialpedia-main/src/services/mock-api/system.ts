import { ApiResponse } from "@/types";
import {
  SystemSettings,
  SystemNotification,
  AdminAlert,
  SystemHealth,
  Backup,
  AccessLog,
  ErrorLog,
  FeatureFlag,
  NotificationLog,
  PlatformSettings,
  AdminActivityLog,
  SecuritySettings,
  GlobalNotificationSettings,
  AuditTrailEntry,
  FeatureSettings,
  AdminSession,
  BrandingSettings,
  SystemAlert,
  AdminHomeOverview,
  SecurityDashboardData,
  AdminSystemHubData,
  SecurityMockData,
  InfrastructureMockData,
  EdgeComputingData,
  CdnManagementData,
  SeoManagementData,
  ExperimentManagementData,
  IncidentResponseData,
  AccessManagementData,
  LocalizationData,
  AlertsSystemData,
} from "@/types/system";

/**
 * @fileOverview Mock service for managing global platform configuration and system notifications.
 */

const mockPlatformSettings: PlatformSettings = {
  name: "Imperialpedia",
  logoUrl: "https://imperialpedia.com/logo.png",
  description:
    "The world's most scalable financial intelligence engine. Explore over 1,000,000 pages of deep financial insights.",
  features: {
    seo: true,
    analytics: true,
    payments: false,
  },
};

const mockBrandingSettings: BrandingSettings = {
  platformName: "Imperialpedia",
  logoUrl: "https://imperialpedia.com/logo.png",
  description: "World-class financial intelligence at scale.",
  colors: {
    primary: "#8272F2",
    secondary: "#69B9FF",
  },
};

const mockFeatureSettings: FeatureSettings = {
  seo: true,
  analytics: true,
  payments: false,
  contentModeration: true,
};

const mockSettings: SystemSettings = {
  platform: {
    siteName: "Imperialpedia",
    contactEmail: "admin@imperialpedia.com",
    maintenanceMode: false,
    defaultCurrency: "USD",
  },
  seo: {
    defaultTitleTemplate: "%title% | Imperialpedia Intelligence",
    metaDescriptionTemplate: "Expert-led financial intelligence on %topic%.",
    indexProgrammablePages: true,
    autoGenerateSitemaps: true,
  },
  notifications: {
    enableEmailAlerts: true,
    adminDailyDigest: true,
    systemAlertsWebhook: "https://hooks.slack.com/services/...",
  },
  governance: {
    requireVettingForMonetization: true,
    defaultRevenueShare: 70,
    allowSelfOnboarding: true,
    autoModerateComments: false,
  },
};

const mockGlobalNotificationSettings: GlobalNotificationSettings = {
  email: true,
  push: true,
  sms: false,
};

const mockSecuritySettings: SecuritySettings = {
  twoFactorAuth: true,
  passwordPolicy: {
    minLength: 12,
    requireSpecialChar: true,
    requireNumber: true,
  },
  sessionTimeoutMinutes: 120,
};

const mockSecurityDashboard: SecurityDashboardData = {
  system_health: "Good",
  active_threats: 0,
  failed_logins: 3,
  rate_limit_status: "Normal",
  admin_ip_restriction: ["192.168.1.1", "10.0.0.5"],
};

const mockNotifications: SystemNotification[] = [
  {
    id: "sn-1",
    title: "Q1 Performance Grants",
    message:
      "Applications for the Q1 Intelligence Research grants are now open for verified experts.",
    active: true,
    type: "success",
    target: "creators",
    createdAt: "2024-03-10T10:00:00Z",
  },
  {
    id: "sn-2",
    title: "System Maintenance",
    message:
      "The pSEO indexing engine will undergo scheduled optimization on Sunday at 02:00 UTC.",
    active: true,
    type: "warning",
    target: "all",
    createdAt: "2024-03-12T08:30:00Z",
  },
  {
    id: "sn-3",
    title: "Policy Update",
    message:
      "Expert revenue share benchmarks have been updated in the System Configuration panel.",
    active: false,
    type: "info",
    target: "admins",
    createdAt: "2024-03-05T14:20:00Z",
  },
];

const mockSystemAlerts: SystemAlert[] = [
  {
    id: "sal-1",
    message: "API Gateway Alpha experiencing intermittent latency spikes.",
    type: "Warning",
    status: "Active",
    date: "2024-03-12T14:30:00Z",
  },
  {
    id: "sal-2",
    message: "pSEO Ingestion Node successfully re-sharded for Q2 capacity.",
    type: "Info",
    status: "Active",
    date: "2024-03-12T13:15:00Z",
  },
  {
    id: "sal-3",
    message: "Critical security patch deployed to Auth Kernel v4.2.0.",
    type: "Critical",
    status: "Active",
    date: "2024-03-12T11:45:00Z",
  },
  {
    id: "sal-4",
    message: "Legacy Analytics Node sunsetting process initiated.",
    type: "Info",
    status: "Inactive",
    date: "2024-03-11T16:20:00Z",
  },
];

const mockNotificationLogs: NotificationLog[] = [
  {
    id: "nl-1",
    timestamp: "2024-03-12T10:00:00Z",
    recipient: "All Experts",
    type: "Grant Announcement",
    status: "sent",
    title: "Q1 Research Grants Active",
  },
  {
    id: "nl-2",
    timestamp: "2024-03-12T09:30:00Z",
    recipient: "Eleanor Vance",
    type: "Security Alert",
    status: "sent",
    title: "Unusual Login Attempt Detected",
  },
  {
    id: "nl-3",
    timestamp: "2024-03-11T16:45:00Z",
    recipient: "The Market Maven",
    type: "Editorial Feedback",
    status: "sent",
    title: "Revision Requested: QE Analysis",
  },
  {
    id: "nl-4",
    timestamp: "2024-03-11T14:20:00Z",
    recipient: "All Users",
    type: "Platform Update",
    status: "failed",
    title: "New pSEO Engine Launch",
  },
  {
    id: "nl-5",
    timestamp: "2024-03-11T11:00:00Z",
    recipient: "Sarah Crypto",
    type: "Engagement Update",
    status: "pending",
    title: "Your article is trending!",
  },
];

const mockAdminAlerts: AdminAlert[] = [
  {
    id: "aa-1",
    type: "content",
    message: "New high-priority article submission from @marketmaven.",
    read: false,
    createdAt: new Date().toISOString(),
    priority: "high",
  },
  {
    id: "aa-2",
    type: "user",
    message: "Expert verification request pending for User #842.",
    read: false,
    createdAt: new Date().toISOString(),
    priority: "medium",
  },
  {
    id: "aa-3",
    type: "system",
    message:
      "pSEO Health Audit complete: 14 nodes require metadata optimization.",
    read: false,
    createdAt: new Date().toISOString(),
    priority: "low",
  },
];

const mockBackups: Backup[] = [
  {
    id: "bak-1",
    timestamp: "2024-03-12T04:00:00Z",
    status: "completed",
    size: "1.4GB",
    type: "automated",
    checksum: "sha256:8f2d...",
  },
  {
    id: "bak-2",
    timestamp: "2024-03-11T04:00:00Z",
    status: "completed",
    size: "1.38GB",
    type: "automated",
    checksum: "sha256:4a1c...",
  },
  {
    id: "bak-3",
    timestamp: "2024-03-10T15:30:00Z",
    status: "completed",
    size: "1.35GB",
    type: "manual",
    checksum: "sha256:9e0b...",
  },
  {
    id: "bak-4",
    timestamp: "2024-03-09T04:00:00Z",
    status: "failed",
    size: "0KB",
    type: "automated",
    checksum: "N/A",
  },
];

const mockFeatureFlags: FeatureFlag[] = [
  {
    id: "ff-1",
    name: "AI Content Outliner",
    enabled: true,
    description:
      "Generative AI tool for building article structures from topics.",
    impact: "low",
    isBeta: false,
    module: "Content Engine",
  },
  {
    id: "ff-2",
    name: "Expert Payout Automations",
    enabled: false,
    description: "Automated 15-day settlement cycles for verified creators.",
    impact: "high",
    isBeta: true,
    module: "Monetization",
  },
  {
    id: "ff-3",
    name: "pSEO v2 Scaling",
    enabled: true,
    description: "Next-gen programmatic engine supporting 5M+ indexable nodes.",
    impact: "medium",
    isBeta: false,
    module: "Infrastructure",
  },
  {
    id: "ff-4",
    name: "Institutional Portfolio View",
    enabled: false,
    description: "High-fidelity aggregate views for private wealth users.",
    impact: "medium",
    isBeta: true,
    module: "Calculators",
  },
  {
    id: "ff-5",
    name: "Real-time Market Data",
    enabled: true,
    description: "Live stock and bond price ingestion for analysis nodes.",
    impact: "high",
    isBeta: false,
    module: "Intelligence",
  },
  {
    id: "ff-6",
    name: "Multilingual Glossary",
    enabled: false,
    description:
      "Automated translation of the financial glossary into 12 languages.",
    impact: "low",
    isBeta: true,
    module: "SEO",
  },
];

const mockAccessLogs: AccessLog[] = [
  {
    id: "acc-1",
    user: "eleanor@imperialpedia.com",
    ip: "192.168.1.42",
    device: "Desktop (macOS / Chrome)",
    timestamp: "2024-03-12T10:30:00Z",
    status: "success",
  },
  {
    id: "acc-2",
    user: "maven@imperialpedia.com",
    ip: "10.0.0.15",
    device: "Mobile (iOS / Safari)",
    timestamp: "2024-03-12T09:15:00Z",
    status: "success",
  },
  {
    id: "acc-3",
    user: "unknown@hacker.net",
    ip: "45.12.88.2",
    device: "Linux / Firefox",
    timestamp: "2024-03-12T08:45:00Z",
    status: "failed",
  },
];

const mockErrorLogs: ErrorLog[] = [
  {
    id: "err-1",
    timestamp: "2024-03-12T11:45:00Z",
    module: "API Gateway",
    type: "critical",
    message:
      "Connection timeout reached while attempting to synchronize search cluster indices.",
  },
  {
    id: "err-2",
    timestamp: "2024-03-12T10:20:00Z",
    module: "Content Engine",
    type: "warning",
    message:
      "Failed to generate automated summary for intelligence node art-452. Falling back to default excerpt.",
  },
];

const mockAdminActivityLogs: AdminActivityLog[] = [
  {
    id: "al-1",
    admin: "Eleanor Vance",
    action: "User Suspension",
    target: "Wealth Builder (u-4)",
    date: "2024-03-12T14:30:00Z",
    status: "Success",
  },
  {
    id: "al-2",
    admin: "Platform Lead",
    action: "System Config Update",
    target: "pSEO Ingestion Engine",
    date: "2024-03-12T13:15:00Z",
    status: "Success",
  },
  {
    id: "al-3",
    admin: "Eleanor Vance",
    action: "Permission Override",
    target: "Editor Cohort (role-2)",
    date: "2024-03-12T11:45:00Z",
    status: "Failed",
  },
  {
    id: "al-4",
    admin: "Expert Editor",
    action: "Content Purge",
    target: "Article Node: Yield Scam 101",
    date: "2024-03-12T10:00:00Z",
    status: "Success",
  },
  {
    id: "al-5",
    admin: "Platform Lead",
    action: "Global Alert Dispatch",
    target: "System Notification Hub",
    date: "2024-03-12T09:30:00Z",
    status: "Success",
  },
  {
    id: "al-6",
    admin: "Eleanor Vance",
    action: "Expert Verification",
    target: "Sarah Crypto (u-6)",
    date: "2024-03-11T16:20:00Z",
    status: "Success",
  },
];

const mockAuditTrailEntries: AuditTrailEntry[] = [
  {
    id: "at-1",
    timestamp: "2026-03-15 10:00",
    user: "Admin123",
    action: "Edited Article: Mock Article 1",
    module: "pSEO Engine",
    status: "Success",
  },
  {
    id: "at-2",
    timestamp: "2026-03-15 10:15",
    user: "Editor456",
    action: "Approved Glossary Term: XYZ",
    module: "Auth Kernel",
    status: "Success",
  },
  {
    id: "at-3",
    timestamp: "2026-03-15 10:30",
    user: "Admin123",
    action: "Changed Feature Flag: Beta Feature",
    module: "Resilience Hub",
    status: "Failed",
  },
  {
    id: "at-4",
    timestamp: "2026-03-15 11:00",
    user: "ExpertEditor",
    action: "Purged High-Impact Node: Yield Scam",
    module: "Moderation",
    status: "Success",
  },
  {
    id: "at-5",
    timestamp: "2026-03-15 11:45",
    user: "SystemBot",
    action: "Scaled API Gateway Cluster",
    module: "Infrastructure",
    status: "Success",
  },
];

const mockAdminSessions: AdminSession[] = [
  {
    id: "sess-1",
    user: "Eleanor Vance",
    role: "Administrator",
    loginTime: "2024-03-12T10:30:00Z",
    ip: "192.168.1.42",
    status: "Active",
  },
  {
    id: "sess-2",
    user: "Expert Editor",
    role: "Editor",
    loginTime: "2024-03-12T09:15:00Z",
    ip: "10.0.0.15",
    status: "Active",
  },
  {
    id: "sess-3",
    user: "The Market Maven",
    role: "Administrator",
    loginTime: "2024-03-11T16:45:00Z",
    ip: "45.12.88.2",
    status: "Inactive",
  },
  {
    id: "sess-4",
    user: "Platform Lead",
    role: "Administrator",
    loginTime: "2024-03-12T14:00:00Z",
    ip: "172.16.0.1",
    status: "Active",
  },
];

const mockAdminHomeOverview: AdminHomeOverview = {
  totalUsers: 142500,
  totalCreators: 156,
  pendingModeration: 5,
  activeSessions: 12,
  alertsActive: 3,
  pSEONodes: 1248500,
  systemHealth: "Healthy",
};

const mockAdminSystemHubData: AdminSystemHubData = {
  analytics: [
    { metric: "Active Users", value: 1200, trend: "up" },
    { metric: "Content Engagement", value: 350, trend: "up" },
    { metric: "Subscription Conversions", value: 75, trend: "down" },
  ],
  system_monitoring: [
    {
      server: "Server1",
      cpu_usage: "45%",
      memory_usage: "68%",
      active_requests: 120,
      uptime: "99.9%",
      status: "healthy",
    },
    {
      server: "Server2",
      cpu_usage: "78%",
      memory_usage: "82%",
      active_requests: 200,
      uptime: "99.5%",
      status: "warning",
    },
  ],
  alerts: [
    {
      alert_type: "High CPU",
      server: "Server2",
      threshold: "75%",
      current: "78%",
      status: "mock_triggered",
    },
    {
      alert_type: "Low Memory",
      server: "Server3",
      threshold: "20%",
      current: "18%",
      status: "mock_triggered",
    },
  ],
};

const mockSecurityData: SecurityMockData = {
  auth_mock: [
    {
      user: "User123",
      role: "Admin",
      login_status: "success",
      "2FA_required": true,
    },
    {
      user: "User456",
      role: "Editor",
      login_status: "failed",
      "2FA_required": false,
    },
  ],
  security_flags: [
    { feature: "Encryption at Rest", status: "mock_enabled" },
    { feature: "CSRF Protection", status: "mock_enabled" },
    { feature: "XSS Protection", status: "mock_enabled" },
    { feature: "GDPR Compliance Banner", status: "mock_displayed" },
  ],
  alerts: [
    {
      alert_type: "Rate Limit Exceeded",
      user: "User789",
      status: "mock_triggered",
    },
    { alert_type: "Account Locked", user: "User456", status: "mock_triggered" },
  ],
};

const mockInfrastructureData: InfrastructureMockData = {
  infrastructure: [
    {
      cluster: "Cluster1",
      nodes: 5,
      cpu_usage: "45%",
      memory_usage: "60%",
      network_usage: "120Mbps",
      auto_scaling: "mock_active",
    },
    {
      cluster: "Cluster2",
      nodes: 3,
      cpu_usage: "70%",
      memory_usage: "80%",
      network_usage: "200Mbps",
      auto_scaling: "mock_inactive",
    },
  ],
  ci_cd: [
    {
      pipeline_name: "Build & Deploy",
      status: "mock_success",
      progress: "100%",
    },
    {
      pipeline_name: "Staging Deployment",
      status: "mock_running",
      progress: "60%",
    },
  ],
  caching_queues: [
    {
      name: "RedisCache1",
      queue_length: 25,
      processed_jobs: 120,
      error_rate: "mock_low",
    },
    {
      name: "MessageQueue1",
      queue_length: 10,
      processed_jobs: 90,
      error_rate: "mock_none",
    },
  ],
};

const mockEdgeComputingData: EdgeComputingData = {
  regions: [
    {
      region_name: "US-East",
      nodes: 5,
      latency: "45ms",
      status: "mock_active",
    },
    {
      region_name: "EU-West",
      nodes: 3,
      latency: "60ms",
      status: "mock_warning",
    },
    {
      region_name: "AP-South",
      nodes: 4,
      latency: "120ms",
      status: "mock_active",
    },
    {
      region_name: "SA-East",
      nodes: 2,
      latency: "250ms",
      status: "mock_offline",
    },
  ],
  edge_nodes: [
    {
      node_name: "EdgeNode1",
      region: "US-East",
      cpu_usage: "50%",
      memory_usage: "65%",
      network_traffic: "100Mbps",
    },
    {
      node_name: "EdgeNode2",
      region: "EU-West",
      cpu_usage: "70%",
      memory_usage: "75%",
      network_traffic: "80Mbps",
    },
    {
      node_name: "EdgeNode3",
      region: "AP-South",
      cpu_usage: "42%",
      memory_usage: "50%",
      network_traffic: "150Mbps",
    },
    {
      node_name: "EdgeNode4",
      region: "US-East",
      cpu_usage: "85%",
      memory_usage: "90%",
      network_traffic: "250Mbps",
    },
  ],
  alerts: [
    {
      alert_type: "High Latency",
      region: "EU-West",
      current: "60ms",
      status: "mock_triggered",
    },
    { alert_type: "Node Offline", node: "EdgeNode3", status: "mock_triggered" },
    {
      alert_type: "Memory Spike",
      node: "EdgeNode4",
      current: "90%",
      status: "mock_triggered",
    },
  ],
};

const mockCdnManagementData: CdnManagementData = {
  cdn_nodes: [
    {
      node_name: "CDN-US-East",
      region: "US-East",
      latency: "45ms",
      bandwidth_usage: "120Mbps",
      status: "mock_active",
    },
    {
      node_name: "CDN-EU-West",
      region: "EU-West",
      latency: "60ms",
      bandwidth_usage: "90Mbps",
      status: "mock_warning",
    },
    {
      node_name: "CDN-AP-South",
      region: "AP-South",
      latency: "110ms",
      bandwidth_usage: "45Mbps",
      status: "mock_active",
    },
    {
      node_name: "CDN-SA-East",
      region: "SA-East",
      latency: "240ms",
      bandwidth_usage: "12Mbps",
      status: "mock_inactive",
    },
  ],
  page_cache: [
    {
      page_url: "/glossary/compound-interest",
      cache_status: "mock_cached",
      last_refresh: "2026-03-15 10:00",
      ttl: "3600s",
      cache_hit_ratio: "95%",
    },
    {
      page_url: "/guides/long-form-guide",
      cache_status: "mock_expired",
      last_refresh: "2026-03-14 15:00",
      ttl: "3600s",
      cache_hit_ratio: "88%",
    },
    {
      page_url: "/articles/macro-outlook-2026",
      cache_status: "mock_cached",
      last_refresh: "2026-03-15 11:30",
      ttl: "7200s",
      cache_hit_ratio: "92%",
    },
    {
      page_url: "/search?q=inflation",
      cache_status: "mock_miss",
      last_refresh: "N/A",
      ttl: "600s",
      cache_hit_ratio: "42%",
    },
  ],
  alerts_logs: [
    {
      alert_type: "CDN Node High Latency",
      node: "CDN-EU-West",
      status: "mock_triggered",
      timestamp: "2026-03-15 12:45",
    },
    {
      log_type: "Cache Purge",
      page: "/guides/long-form-guide",
      timestamp: "2026-03-15 09:00",
    },
    { log_type: "Global Cache Burst", timestamp: "2026-03-14 23:00" },
  ],
};

const mockSeoManagementData: SeoManagementData = {
  seo_pages: [
    {
      page_url: "/glossary/compound-interest",
      title: "Compound Interest Definition | Intelligence Index",
      meta_description:
        "Learn how compound interest builds long-term wealth. Explore expert definitions and real-world examples.",
      focus_keywords: ["compound interest", "finance", "investing"],
      seo_score: 85,
      social_preview: "mock_preview_url",
    },
    {
      page_url: "/guides/long-form-guide",
      title: "The Comprehensive Guide to Wealth Preservation",
      meta_description:
        "An institutional-grade deep dive into protecting capital across complex market cycles.",
      focus_keywords: ["investing guide", "wealth", "strategy"],
      seo_score: 78,
      social_preview: "mock_preview_url",
    },
    {
      page_url: "/articles/yield-curve-2026",
      title: "Analyzing the 2026 Yield Curve Inversion",
      meta_description:
        "What the current bond market is telling us about the upcoming fiscal super-cycle.",
      focus_keywords: ["yield curve", "bonds", "recession"],
      seo_score: 92,
      social_preview: "mock_preview_url",
    },
  ],
  sitemap: [
    {
      page_url: "/glossary/compound-interest",
      parent: "/glossary",
      status: "mock_active",
      last_updated: "2026-03-15 10:00",
    },
    {
      page_url: "/guides/long-form-guide",
      parent: "/guides",
      status: "mock_active",
      last_updated: "2026-03-14 15:00",
    },
    {
      page_url: "/articles/yield-curve-2026",
      parent: "/articles",
      status: "mock_active",
      last_updated: "2026-03-15 09:30",
    },
  ],
  alerts_suggestions: [
    {
      alert_type: "Missing Alt Tags",
      page: "/guides/long-form-guide",
      status: "mock_triggered",
    },
    {
      alert_type: "Duplicate Meta Node",
      page: "/glossary/interest-rates",
      status: "mock_triggered",
    },
    {
      suggestion: "Increase keyword density for 'fiscal Super-cycle'",
      page: "/articles/yield-curve-2026",
      status: "mock_suggested",
    },
    {
      suggestion: "Improve meta description CTR mapping",
      page: "/glossary/compound-interest",
      status: "mock_suggested",
    },
  ],
};

const mockExperimentData: ExperimentManagementData = {
  experiments: [
    {
      id: "exp-1",
      experiment_name: "Homepage CTA Test",
      description: "Testing CTA button colors for institutional conversion.",
      start_date: "2026-03-10",
      end_date: "2026-03-20",
      status: "mock_running",
      kpi: { CTR: "5%", Conversions: "2%", Engagement: "12.4%" },
    },
    {
      id: "exp-2",
      experiment_name: "Pricing Page Layout",
      description: "Testing grid vs stack pricing layouts for Pro tier.",
      start_date: "2026-03-12",
      end_date: "2026-03-22",
      status: "mock_completed",
      kpi: { CTR: "6%", Conversions: "3%", Engagement: "8.2%" },
    },
    {
      id: "exp-3",
      experiment_name: "Expert Profile Badge Shift",
      description: "Visual priority for verification badges.",
      start_date: "2026-03-15",
      end_date: "2026-03-25",
      status: "mock_draft",
      kpi: { CTR: "0%", Conversions: "0%" },
    },
  ],
  ab_variants: [
    {
      variant: "A",
      traffic: "50%",
      metric_values: { CTR: "5%", Conversions: "2%" },
    },
    {
      variant: "B",
      traffic: "50%",
      metric_values: { CTR: "6%", Conversions: "3%" },
    },
  ],
  experiment_details: [
    {
      experiment_name: "Homepage CTA Test",
      timeline: "mock_timeline",
      results_graph: "mock_graph",
      variant_insights:
        "Variant B shows 20% higher conversion velocity in APAC nodes.",
      chart_data: [
        { date: "Day 1", variantA: 120, variantB: 110 },
        { date: "Day 2", variantA: 135, variantB: 142 },
        { date: "Day 3", variantA: 140, variantB: 168 },
        { date: "Day 4", variantA: 155, variantB: 190 },
        { date: "Day 5", variantA: 162, variantB: 210 },
      ],
    },
  ],
};

const mockIncidentResponseData: IncidentResponseData = {
  incidents: [
    {
      incident_id: "INC001",
      type: "Server Outage",
      severity: "High",
      status: "mock_active",
      timestamp: "2026-03-15 09:00",
    },
    {
      incident_id: "INC002",
      type: "API Failure",
      severity: "Medium",
      status: "mock_resolved",
      timestamp: "2026-03-14 14:00",
    },
  ],
  alerts: [
    {
      alert_id: "ALRT001",
      source: "Server1",
      severity: "High",
      message: "CPU usage exceeded threshold",
      timestamp: "2026-03-15 08:45",
    },
    {
      alert_id: "ALRT002",
      source: "RedisCache1",
      severity: "Medium",
      message: "Cache hit ratio dropped below 80%",
      timestamp: "2026-03-14 13:30",
    },
  ],
  incident_details: [
    {
      incident_id: "INC001",
      timeline: "mock_timeline",
      affected_systems: ["Server1", "LoadBalancer1"],
      suggested_resolution: "Restart servers and redistribute load",
    },
  ],
};

const mockAccessManagementData: AccessManagementData = {
  feature_flags: [
    {
      feature_name: "Advanced Analytics",
      description:
        "Enable advanced reporting charts and longitudinal tracking.",
      status: "mock_on",
      category: "Core",
    },
    {
      feature_name: "Beta AI Summary",
      description: "Enable AI-generated summaries for financial guides.",
      status: "mock_off",
      category: "AI Analyst",
    },
    {
      feature_name: "Real-time Sentiment",
      description: "Live market sentiment node processing from social wires.",
      status: "mock_on",
      category: "AI Analyst",
    },
    {
      feature_name: "Portfolio Backtesting",
      description:
        "Allow Pro users to simulate strategies against historical nodes.",
      status: "mock_off",
      category: "Premium",
    },
  ],
  roles: [
    {
      role_name: "Admin",
      permissions: [
        "manage_users",
        "edit_content",
        "view_analytics",
        "system_config",
        "audit_logs",
        "feature_toggles",
      ],
    },
    {
      role_name: "Editor",
      permissions: [
        "edit_content",
        "view_analytics",
        "moderate_comments",
        "publish_content",
      ],
    },
    {
      role_name: "User",
      permissions: [
        "view_content",
        "post_comments",
        "use_calculators",
        "watchlist_hub",
      ],
    },
    {
      role_name: "Guest",
      permissions: ["view_public_content", "register_account"],
    },
  ],
  mock_user_assignments: [
    { user: "User123", assigned_role: "Admin" },
    { user: "User456", assigned_role: "Editor" },
    { user: "User789", assigned_role: "User" },
    { user: "Eleanor Vance", assigned_role: "Admin" },
    { user: "Julian Wealth", assigned_role: "Editor" },
  ],
};

const mockLocalizationData: LocalizationData = {
  languages: [
    { language_code: "en", language_name: "English", status: "mock_enabled" },
    { language_code: "es", language_name: "Spanish", status: "mock_enabled" },
    { language_code: "fr", language_name: "French", status: "mock_disabled" },
    { language_code: "hi", language_name: "Hindi", status: "mock_enabled" },
  ],
  localization_content: [
    {
      key: "glossary_term_compound_interest",
      source_text: "Compound Interest",
      translation: {
        es: "Interés Compuesto",
        fr: "Intérêt Composé",
        hi: "चक्रवृद्धि ब्याज",
      },
      status: "mock_reviewed",
      module: "Glossary",
    },
    {
      key: "guide_long_form_intro",
      source_text: "Complete Guide to Investing",
      translation: {
        es: "Guía Completa de Inversión",
        fr: "Guide Complet d'Investissement",
        hi: "निवेश के लिए पूर्ण गाइड",
      },
      status: "mock_pending",
      module: "Guides",
    },
    {
      key: "ui_button_subscribe",
      source_text: "Subscribe to Pro",
      translation: {
        es: "Suscribirse a Pro",
        fr: "S'abonner à Pro",
        hi: "प्रो की सदस्यता लें",
      },
      status: "mock_approved",
      module: "UI Components",
    },
  ],
};

const mockAlertsSystemData: AlertsSystemData = {
  alerts: [
    {
      alert_id: "ALRT101",
      type: "CPU Usage",
      severity: "High",
      source: "Server1",
      timestamp: "2026-03-15 09:00",
      status: "mock_active",
    },
    {
      alert_id: "ALRT102",
      type: "Cache Miss",
      severity: "Medium",
      source: "RedisCache1",
      timestamp: "2026-03-14 14:00",
      status: "mock_resolved",
    },
    {
      alert_id: "ALRT103",
      type: "Unauthorized Access",
      severity: "High",
      source: "AuthKernel",
      timestamp: "2026-03-15 10:30",
      status: "mock_active",
    },
    {
      alert_id: "ALRT104",
      type: "API Latency",
      severity: "Low",
      source: "Gateway-Alpha",
      timestamp: "2026-03-15 11:45",
      status: "mock_snoozed",
    },
  ],
  notification_channels: [
    { channel: "Email", status: "mock_enabled", last_sent: "2026-03-15 08:45" },
    { channel: "Push", status: "mock_enabled", last_sent: "2026-03-15 08:50" },
    { channel: "SMS", status: "mock_disabled", last_sent: "2026-03-14 13:30" },
    {
      channel: "In-App",
      status: "mock_enabled",
      last_sent: "2026-03-15 11:00",
    },
  ],
  alert_rules: [
    {
      rule_name: "High CPU Usage",
      condition: "CPU > 85%",
      priority: "mock_high",
      status: "mock_active",
    },
    {
      rule_name: "Cache Miss Alert",
      condition: "Cache hit ratio < 80%",
      priority: "mock_medium",
      status: "mock_inactive",
    },
    {
      rule_name: "Critical Latency",
      condition: "Response > 500ms",
      priority: "mock_high",
      status: "mock_active",
    },
    {
      rule_name: "Low Memory Warning",
      condition: "MEM < 10%",
      priority: "mock_low",
      status: "mock_active",
    },
  ],
};

export const getPlatformSettings = async (): Promise<
  ApiResponse<PlatformSettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockPlatformSettings,
    status: 200,
  };
};

export const updatePlatformSettings = async (
  settings: PlatformSettings
): Promise<ApiResponse<PlatformSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "Global configuration synchronized.",
  };
};

export const getBrandingSettings = async (): Promise<
  ApiResponse<BrandingSettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockBrandingSettings,
    status: 200,
  };
};

export const updateBrandingSettings = async (
  settings: BrandingSettings
): Promise<ApiResponse<BrandingSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "Visual identity synchronized across the cluster.",
  };
};

export const getFeatureSettings = async (): Promise<
  ApiResponse<FeatureSettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockFeatureSettings,
    status: 200,
  };
};

export const updateFeatureSettings = async (
  settings: FeatureSettings
): Promise<ApiResponse<FeatureSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "Functional gateways synchronized successfully.",
  };
};

export const getSystemSettings = async (): Promise<
  ApiResponse<SystemSettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockSettings,
    status: 200,
  };
};

export const updateSystemSettings = async (
  settings: SystemSettings
): Promise<ApiResponse<SystemSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "System configuration synchronized successfully.",
  };
};

export const getGlobalNotificationSettings = async (): Promise<
  ApiResponse<GlobalNotificationSettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockGlobalNotificationSettings,
    status: 200,
  };
};

export const updateGlobalNotificationSettings = async (
  settings: GlobalNotificationSettings
): Promise<ApiResponse<GlobalNotificationSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "Communication nodes synchronized across the cluster.",
  };
};

export const getSecuritySettings = async (): Promise<
  ApiResponse<SecuritySettings>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockSecuritySettings,
    status: 200,
  };
};

export const updateSecuritySettings = async (
  settings: SecuritySettings
): Promise<ApiResponse<SecuritySettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: settings,
    status: 200,
    message: "Security protocols updated and broadcast to all nodes.",
  };
};

export const getSecurityDashboardData = async (): Promise<
  ApiResponse<SecurityDashboardData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockSecurityDashboard,
    status: 200,
  };
};

export const getSystemNotifications = async (): Promise<
  ApiResponse<SystemNotification[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockNotifications,
    status: 200,
  };
};

export const updateSystemNotification = async (
  notification: SystemNotification
): Promise<ApiResponse<SystemNotification>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: notification,
    status: 200,
    message: "Broadcast parameters updated.",
  };
};

export const deleteSystemNotification = async (
  id: string
): Promise<ApiResponse<void>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: undefined,
    status: 200,
    message: "Notification purged from index.",
  };
};

export const getSystemAlerts = async (): Promise<
  ApiResponse<SystemAlert[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockSystemAlerts,
    status: 200,
  };
};

export const getNotificationLogs = async (): Promise<
  ApiResponse<NotificationLog[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockNotificationLogs,
    status: 200,
  };
};

export const getAdminAlerts = async (): Promise<ApiResponse<AdminAlert[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockAdminAlerts,
    status: 200,
  };
};

export const getSystemHealth = async (): Promise<ApiResponse<SystemHealth>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: {
      uptimePercentage: 99.98,
      errorCountLast24h: 12,
      apiStatus: "Healthy",
      latency: 42,
      apiUptime: 99.98,
      dbStatus: "Healthy",
      serverLoad: 45,
      errorRate: 0.02,
      history: Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        load: Math.floor(Math.random() * 30) + 20,
        errors: Math.floor(Math.random() * 2),
      })),
      nodes: [
        { name: "API Gateway Hub", status: "Healthy", load: 24 },
        { name: "pSEO Ingestion Node", status: "Healthy", load: 68 },
        { name: "Search Index Cluster", status: "Warning", load: 82 },
        { name: "Media Transformer", status: "Healthy", load: 12 },
      ],
    },
    status: 200,
  };
};

export const getBackups = async (): Promise<ApiResponse<Backup[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockBackups,
    status: 200,
  };
};

export const createBackup = async (): Promise<ApiResponse<Backup>> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const newBackup: Backup = {
    id: `bak-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    status: "completed",
    size: "1.42GB",
    type: "manual",
    checksum: `sha256:${Math.random().toString(36).substr(2, 10)}`,
  };
  return {
    data: newBackup,
    status: 200,
    message: "System snapshot created and mirrored to off-site vault.",
  };
};

export const restoreBackup = async (id: string): Promise<ApiResponse<void>> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    data: undefined,
    status: 200,
    message: `Platform state successfully reverted to snapshot ${id}.`,
  };
};

export const getFeatureFlags = async (): Promise<
  ApiResponse<FeatureFlag[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockFeatureFlags,
    status: 200,
  };
};

export const updateFeatureFlag = async (
  id: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: undefined,
    status: 200,
    message: `Feature flag status updated successfully.`,
  };
};

export const getAccessLogs = async (): Promise<ApiResponse<AccessLog[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAccessLogs,
    status: 200,
  };
};

export const getErrorLogs = async (): Promise<ApiResponse<ErrorLog[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockErrorLogs,
    status: 200,
  };
};

export const getAdminLogs = async (): Promise<
  ApiResponse<AdminActivityLog[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAdminActivityLogs,
    status: 200,
  };
};

export const getAuditTrail = async (): Promise<
  ApiResponse<AuditTrailEntry[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAuditTrailEntries,
    status: 200,
  };
};

export const getActiveSessions = async (): Promise<
  ApiResponse<AdminSession[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAdminSessions,
    status: 200,
  };
};

export const terminateSession = async (
  id: string
): Promise<ApiResponse<void>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: undefined,
    status: 200,
    message: "Session terminated across production clusters.",
  };
};

export const getAdminHomeOverview = async (): Promise<
  ApiResponse<AdminHomeOverview>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAdminHomeOverview,
    status: 200,
  };
};

export const getAdminSystemHubData = async (): Promise<
  ApiResponse<AdminSystemHubData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockAdminSystemHubData,
    status: 200,
  };
};

export const getSecurityMockData = async (): Promise<
  ApiResponse<SecurityMockData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockSecurityData,
    status: 200,
  };
};

export const getInfrastructureMockData = async (): Promise<
  ApiResponse<InfrastructureMockData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockInfrastructureData,
    status: 200,
  };
};

export const getEdgeComputingData = async (): Promise<
  ApiResponse<EdgeComputingData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockEdgeComputingData,
    status: 200,
  };
};

export const getCdnManagementData = async (): Promise<
  ApiResponse<CdnManagementData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockCdnManagementData,
    status: 200,
  };
};

export const getSeoManagementData = async (): Promise<
  ApiResponse<SeoManagementData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockSeoManagementData,
    status: 200,
  };
};

export const getExperimentManagementData = async (): Promise<
  ApiResponse<ExperimentManagementData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockExperimentData,
    status: 200,
  };
};

export const getIncidentResponseData = async (): Promise<
  ApiResponse<IncidentResponseData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockIncidentResponseData,
    status: 200,
  };
};

export const getAccessManagementData = async (): Promise<
  ApiResponse<AccessManagementData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockAccessManagementData,
    status: 200,
  };
};

export const getLocalizationData = async (): Promise<
  ApiResponse<LocalizationData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockLocalizationData,
    status: 200,
  };
};

export const getAlertsSystemData = async (): Promise<
  ApiResponse<AlertsSystemData>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockAlertsSystemData,
    status: 200,
  };
};
