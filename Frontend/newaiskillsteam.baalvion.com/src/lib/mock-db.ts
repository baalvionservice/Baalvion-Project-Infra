import type {
  User,
  Company,
  Task,
  Submission,
  Evaluation,
  Plan,
  Subscription,
  Invoice,
  Badge,
  Notification,
  SystemError,
  SystemLog,
  ApiIntegration,
  IntegrationLog,
  Webhook,
  GitHubRepository,
  Team,
  SystemMetric,
  ServiceStatus,
  ServiceLoad,
  ScalingEvent,
  SystemIncident,
  UsageMetric,
  PlanUsage,
  RevenueMetric,
  PlanDistribution,
  RevenueSource,
  EvaluationSchema,
  TestCase,
  WebhookTriggerLog,
  Activity,
  TaskTemplate,
} from "./types";
import {
  mockUsers,
  mockCompanies,
  mockTasks,
  mockSubmissions,
  mockEvaluations,
  mockPlans,
  mockSubscriptions,
  mockInvoices,
  mockBadges,
  mockNotifications,
  mockSystemErrors,
  mockSystemLogs,
  mockApiIntegrations,
  mockIntegrationLogs,
  mockWebhooks,
  mockGitHubRepositories,
  mockTeams,
  mockSystemMetrics,
  mockServiceStatus,
  mockServiceLoad,
  mockScalingEvents,
  mockSystemIncidents,
  mockUsageMetrics,
  mockPlanUsage,
  mockRevenueMetrics,
  mockPlanDistribution,
  mockRevenueSources,
  mockEvaluationSchemas,
  mockTestCases,
  mockWebhookTriggerLogs,
  mockActivityLogs,
  mockTemplates,
} from "./mock-data";

// This is a mock database that uses localStorage for persistence.
// It's a simple way to simulate a backend for development purposes.

export interface DB {
  users: User[];
  companies: Company[];
  tasks: Task[];
  templates: TaskTemplate[];
  submissions: Submission[];
  evaluations: Evaluation[];
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  badges: Badge[];
  notifications: Notification[];
  activities: Activity[];
  systemErrors: SystemError[];
  systemLogs: SystemLog[];
  apiIntegrations: ApiIntegration[];
  integrationLogs: IntegrationLog[];
  webhooks: Webhook[];
  webhookTriggerLogs: WebhookTriggerLog[];
  githubRepositories: GitHubRepository[];
  teams: Team[];
  systemMetrics: SystemMetric[];
  serviceStatus: ServiceStatus[];
  serviceLoad: ServiceLoad[];
  scalingEvents: ScalingEvent[];
  systemIncidents: SystemIncident[];
  usageMetrics: UsageMetric[];
  planUsage: PlanUsage[];
  revenueMetrics: RevenueMetric[];
  planDistribution: PlanDistribution[];
  revenueSources: RevenueSource[];
  evaluationSchemas: EvaluationSchema[];
  testCases: TestCase[];
}

const DB_KEY = "skillmatch_db";

let db: DB | null = null;

const initializeDB = (): DB => {
  if (typeof window === "undefined") {
    // If on server, just use in-memory mock data
    return {
      users: mockUsers,
      companies: mockCompanies,
      tasks: mockTasks,
      templates: mockTemplates,
      submissions: mockSubmissions,
      evaluations: mockEvaluations,
      plans: mockPlans,
      subscriptions: mockSubscriptions,
      invoices: mockInvoices,
      badges: mockBadges,
      notifications: mockNotifications,
      activities: mockActivityLogs,
      systemErrors: mockSystemErrors,
      systemLogs: mockSystemLogs,
      apiIntegrations: mockApiIntegrations,
      integrationLogs: mockIntegrationLogs,
      webhooks: mockWebhooks,
      webhookTriggerLogs: mockWebhookTriggerLogs,
      githubRepositories: mockGitHubRepositories,
      teams: mockTeams,
      systemMetrics: mockSystemMetrics,
      serviceStatus: mockServiceStatus,
      serviceLoad: mockServiceLoad,
      scalingEvents: mockScalingEvents,
      systemIncidents: mockSystemIncidents,
      usageMetrics: mockUsageMetrics,
      planUsage: mockPlanUsage,
      revenueMetrics: mockRevenueMetrics,
      planDistribution: mockPlanDistribution,
      revenueSources: mockRevenueSources,
      evaluationSchemas: mockEvaluationSchemas,
      testCases: mockTestCases,
    };
  }

  try {
    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
      const parsed = JSON.parse(savedDb);
      if (parsed && typeof parsed === "object") {
        return parsed as DB;
      }
    }
  } catch (error) {
    console.error("Failed to parse DB from localStorage", error);
    localStorage.removeItem(DB_KEY);
  }

  // If no DB in localStorage, initialize with mock data
  const initialDB: DB = {
    users: mockUsers,
    companies: mockCompanies,
    tasks: mockTasks,
    templates: mockTemplates,
    submissions: mockSubmissions,
    evaluations: mockEvaluations,
    plans: mockPlans,
    subscriptions: mockSubscriptions,
    invoices: mockInvoices,
    badges: mockBadges,
    notifications: mockNotifications,
    activities: mockActivityLogs,
    systemErrors: mockSystemErrors,
    systemLogs: mockSystemLogs,
    apiIntegrations: mockApiIntegrations,
    integrationLogs: mockIntegrationLogs,
    webhooks: mockWebhooks,
    webhookTriggerLogs: mockWebhookTriggerLogs,
    githubRepositories: mockGitHubRepositories,
    teams: mockTeams,
    systemMetrics: mockSystemMetrics,
    serviceStatus: mockServiceStatus,
    serviceLoad: mockServiceLoad,
    scalingEvents: mockScalingEvents,
    systemIncidents: mockSystemIncidents,
    usageMetrics: mockUsageMetrics,
    planUsage: mockPlanUsage,
    revenueMetrics: mockRevenueMetrics,
    planDistribution: mockPlanDistribution,
    revenueSources: mockRevenueSources,
    evaluationSchemas: mockEvaluationSchemas,
    testCases: mockTestCases,
  };

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  } catch (error) {
    console.error("Failed to save initial DB to localStorage", error);
  }

  return initialDB;
};

export const getDB = (): DB => {
  if (!db) {
    db = initializeDB();
  }
  return db;
};

export const setDB = (newDB: DB): void => {
  db = newDB;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(newDB));
    } catch (error) {
      console.error("Failed to save DB to localStorage", error);
    }
  }
};
