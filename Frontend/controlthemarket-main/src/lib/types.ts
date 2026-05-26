export type UserRole = "candidate" | "company" | "admin";
export type CompanyRole = "owner" | "admin" | "member";
export type ExperienceLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export type BadgeRarity = "Common" | "Rare" | "Elite";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
}

export interface Domain {
  name: string;
  verified: boolean;
  purpose: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyRole?: CompanyRole; // For users with the 'company' role
  createdAt: string; // ISO 8601 date string
  isActive: boolean;
  isVerified?: boolean;
  companyId?: string; // For users with the 'company' role
  companyName?: string; // For users with the 'company' role
  onboardingCompleted?: boolean;
  candidateOnboardingCompleted?: boolean;
  consentAccepted?: boolean;
  consentAcceptedAt?: string;
  profile?: {
    avatarUrl?: string;
    bio?: string;
    location?: string;
    experienceLevel?: ExperienceLevel;
    skills?: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioLinks?: string[];
    badgeIds?: string[];
  };
  candidatePerformance?: {
    completedTasks?: number;
    averageScore?: number;
    ranking?: number;
  };
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // The ID of the user who owns the company
  domains?: Domain[];
  logoUrl?: string;
  industry?: string;
  location?: string;
  country?: string;
  createdAt: string; // ISO 8601 date string
  isActive?: boolean;
  isVerified?: boolean;
  verificationDocs?: {
    country: string;
    documents: {
      name: string;
      url: string;
    }[];
  };
}

export type TaskDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";
export type TaskStatus = "draft" | "published" | "closed" | "archived";
export type RoleCategory =
  | "Engineering"
  | "Frontend"
  | "Backend"
  | "Full Stack"
  | "DevOps"
  | "Mobile"
  | "Design"
  | "UI/UX Design"
  | "Graphic Design"
  | "Product Design"
  | "Motion Design"
  | "Marketing"
  | "Digital Marketing"
  | "SEO"
  | "Content Marketing"
  | "Performance Marketing"
  | "Business"
  | "Sales"
  | "Operations"
  | "Business Development"
  | "Strategy"
  | "Data"
  | "Data Analyst"
  | "Data Scientist"
  | "Machine Learning Engineer";

export type TaskType =
  // Engineering
  | "Coding"
  | "Backend Development"
  | "API Design"
  | "Database Management"
  | "Project"
  | "Documentation"
  | "UI"
  | "Component"
  | "Styling"
  | "Feature Implementation"
  | "DevOps"
  | "CI/CD"
  | "Security Analysis"
  | "Automated Testing"
  | "Bug Fix"
  | "Code Review"
  | "System Architecture"
  | "Mobile Development"
  | "Algorithm Design"
  | "Performance Optimization"
  // Design
  | "Design"
  | "User Research"
  | "Wireframing"
  | "Prototyping"
  | "Visual Design"
  | "Branding"
  // Marketing
  | "Campaign Planning"
  | "Content Creation"
  | "Social Media"
  | "Email Marketing"
  | "Ads"
  | "Market Analysis"
  | "Copywriting"
  | "Growth Hacking"
  | "SEO"
  // Business
  | "Strategy Planning"
  | "Financial Modeling"
  | "Presentation"
  | "Business Case"
  // Data
  | "Data Cleaning"
  | "Visualization"
  | "Statistical Analysis"
  | "Reporting"
  | "SQL Querying"
  | "Machine Learning Model"
  | "Python"
  // General
  | "MCQ";

export type TaskPriority = "High" | "Medium" | "Low";

export interface TaskRound {
  roundNumber: number;
  instructions: string;
  expectedOutputs: string;
  timeLimitMinutes?: number;
}

export interface Task {
  id: string;
  title: string;
  name?: string; // Adding name property for compatibility
  description: string;
  instructions: string;
  expectedOutputs: string;
  roleCategory: RoleCategory;
  taskTypes?: TaskType[];
  difficulty: TaskDifficulty;
  priority?: TaskPriority;
  timeLimitMinutes?: number;
  deadline: string; // ISO 8601 date string
  companyId: string;
  createdBy: string; // User ID of creator
  status: TaskStatus;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  multiRound?: boolean;
  rounds?: TaskRound[];
  imageUrl?: string;
  imageHint?: string;
  projectFile?: {
    url: string;
    name: string;
    size?: number;
  };
  assignedTo?: string[]; // Array of user IDs
  isOpen?: boolean; // True if public, false if invite-only
  isPrivate?: boolean; // True if only assigned users can see, supersedes isOpen
}

export interface TaskTemplate {
  templateId: string;
  title: string;
  description: string;
  roleCategory: RoleCategory;
  difficulty: TaskDifficulty;
  taskTypes: TaskType[];
  instructions: string;
  expectedOutputs: string;
  timeLimitMinutes?: number;
  createdBy: string; // companyId
  createdAt: string;
  updatedAt: string;
  multiRound?: boolean;
  rounds?: TaskRound[];
  isPrivate?: boolean;
}

export type SubmissionContentType = "link" | "file" | "externalLink";

export type SubmissionStatus =
  | "assigned"
  | "in-progress"
  | "pending"
  | "in-review"
  | "evaluated"
  | "shortlisted"
  | "rejected"
  | "resubmitted"
  | "moved-to-next-round"
  | "flagged";

export type ValidationStatus = "Valid" | "Invalid" | "Warning" | "Pending";
export type TestCaseStatus = "Passed" | "Failed" | "Warning" | "Pending";
export type SandboxStatus =
  | "Active"
  | "Idle"
  | "Completed"
  | "Error"
  | "Not Started";
export type LiveSessionStatus =
  | "Not Started"
  | "Scheduled"
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Requested"
  | "Denied";
export type PlagiarismRisk = "High" | "Medium" | "Low" | "None";

export interface TestCase {
  id: string;
  submissionId?: string;
  name: string;
  description: string;
  expectedOutcome: string;
  actualOutcome: string;
  status: TestCaseStatus;
}

export type DomainAccessRequest = {
  domainName: string;
  status: "pending" | "approved" | "revoked";
  reason: string;
};

export interface Submission {
  id: string;
  taskId: string;
  userId: string; // candidateId
  companyId: string; // Denormalized for easier querying
  content?: {
    type: SubmissionContentType;
    value: string; // URL or file path
    fileName?: string; // For file uploads
    fileSize?: number; // for file uploads
  };
  status: SubmissionStatus;
  validationStatus?: ValidationStatus;
  testCaseStatus?: TestCaseStatus;
  autoScore?: number;
  autoScoringStatus?: "Pending" | "Completed" | "Failed";
  sandboxStatus?: SandboxStatus;
  liveSessionStatus?: LiveSessionStatus;
  plagiarismRisk?: PlagiarismRisk;
  recordingStatus?: "Recording" | "Paused" | "Completed" | "Not Started";
  assignedAt: string; // ISO 8601 date string
  submittedAt?: string; // ISO 8601 date string
  resubmittedAt?: string; // ISO 8601 date string
  lastUpdated: string; // ISO 8601 date string
  timeSpentMinutes?: number;
  attemptsCount?: number;
  currentRound?: number;
  skillMatchResult?: {
    result: "pass" | "fail";
    skillBadge: string;
  };
  requestedDomains?: DomainAccessRequest[];
}

export interface Evaluation {
  id: string;
  submissionId: string;
  score: number; // 0-100 overall score
  criteriaScores?: {
    [key: string]: number;
  };
  criteriaComments?: {
    [key: string]: string;
  };
  feedback: string;
  evaluatedBy: string; // userId of company member
  evaluatedAt: string; // ISO 8601 date string
  videoFeedbackUrl?: string; // URL to the recorded video feedback
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

export interface EvaluationSchema {
  id: string;
  name: string;
  description: string;
  criteria: EvaluationCriterion[];
  isActive: boolean;
}

export type ActivityActionType =
  | "submission"
  | "task_update"
  | "status_change"
  | "login"
  | "override"
  | "user_created"
  | "company_created";
export type ActivityStatus = "Success" | "Failed" | "Pending";

export interface Activity {
  id: string;
  performerId: string; // userId
  actionType: ActivityActionType;
  timestamp: string; // ISO 8601
  targetEntity: {
    type: "Task" | "User" | "Company" | "Submission";
    id: string;
    name?: string;
  };
  status: ActivityStatus;
  description: string;
}

export type NotificationType =
  | "task_deadline"
  | "new_submission"
  | "user_signup"
  | "system_warning"
  | "flagged_submission";
export type NotificationPriority = "High" | "Medium" | "Low";
export type NotificationStatus = "Unread" | "Read" | "Resolved";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  timestamp: string; // ISO 8601
  title: string;
  description: string;
  relatedEntity: {
    type: "Task" | "User" | "Company" | "Submission" | "System";
    id: string;
    name?: string;
  };
}

export type PerformanceTrend = "improving" | "declining" | "stable" | "new";

export interface CandidateInsight {
  candidate: User;
  aggregatedScore: number;
  percentileRank: number;
  evaluationCount: number;
  trend: PerformanceTrend;
  topSkill: string | null;
  weakestSkill: string | null;
}

export interface CompanyInsight {
  company: Company;
  avgCandidateScore: number;
  candidateCount: number;
  topSkills: string[];
  skillGaps: string[];
}

export type IntegrationStatus = "Connected" | "Pending" | "Error";

export interface GitHubRepository {
  id: string;
  name: string;
  url: string;
  ownerName: string; // Candidate or Team name
  ownerId: string;
  status: IntegrationStatus;
  lastSync: string; // ISO date string
  commitCount: number;
  branchCount: number;
  lastCommitMessage: string;
}

export type WebhookEvent =
  | "submission.created"
  | "submission.evaluated"
  | "task.published"
  | "user.created";
export type WebhookStatus = "Active" | "Inactive" | "Error";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  lastTriggered?: string; // ISO date string
}

export interface WebhookTriggerLog {
  id: string;
  webhookId: string;
  timestamp: string;
  status: "Success" | "Failed";
  payload: string;
}

export interface Team {
  id: string;
  name: string;
  companyId: string;
  memberIds: string[];
  leadId: string; // The user ID of the team lead
}

export type ApiIntegrationStatus = "Active" | "Inactive" | "Error";
export type ApiIntegrationCategory =
  | "Analytics"
  | "Chat"
  | "Cloud Storage"
  | "DevOps"
  | "Monitoring"
  | "Payments"
  | "Other";

export interface ApiIntegration {
  id: string;
  name: string;
  category: ApiIntegrationCategory;
  description: string;
  status: ApiIntegrationStatus;
  lastSync: string; // ISO date string
  apiKey: string;
  endpointUrl: string;
  subscribedEvents: WebhookEvent[];
}

export type IntegrationLogSource =
  | "GitHub"
  | "Webhook"
  | "Jira"
  | "Slack"
  | "Sentry"
  | "Vercel";

export interface IntegrationLog {
  id: string;
  source: IntegrationLogSource;
  eventType: string; // e.g., 'push', 'submission.evaluated'
  status: "Success" | "Warning" | "Error";
  timestamp: string;
  description?: string;
  relatedEntity: {
    type: "Task" | "Submission" | "User" | "Company" | "System";
    id: string;
    name?: string;
  };
}

export type ServiceStatusName =
  | "Authentication"
  | "Database"
  | "API Gateway"
  | "Task Queue"
  | "AI Assistant"
  | "Notifications";
export type ServiceStatusState = "Running" | "Degraded" | "Down";

export interface ServiceStatus {
  id: string;
  name: ServiceStatusName;
  status: ServiceStatusState;
  lastChecked: string;
  uptimePercentage?: number;
  lastDowntime?: string;
}

export type AutoScalingStatus = "Stable" | "Scaling Up" | "Scaling Down";

export interface SystemMetric {
  id: string;
  activeUsers: number;
  activeSessions: number;
  systemLoad: number; // percentage
  apiRequestsPerMinute: number;
  requestsPerSecond: number;
  autoScalingStatus: AutoScalingStatus;
  errorRate: number; // percentage
  timestamp: string;
  avgApiResponseTime: number;
  dbQueryTime: number;
}

export interface ServiceLoad {
  id: string;
  name: ServiceStatusName;
  loadPercentage: number;
  requestsHandled: number;
}

export interface ScalingEvent {
  id: string;
  timestamp: string;
  change: "up" | "down";
  instanceCount: number;
  reason: string;
}

export type LogSeverity = "Info" | "Warning" | "Error";

export interface SystemLog {
  id: string;
  service: string; // e.g., 'API', 'Auth', 'Database'
  severity: LogSeverity;
  timestamp: string; // ISO 8601
  message: string;
}

export type ErrorSeverity = "Critical" | "Warning" | "Minor";

export interface SystemError {
  id: string;
  service: string; // e.g., 'API', 'Auth', 'Database'
  type: string; // e.g., 'Unhandled Exception', 'API Timeout'
  severity: ErrorSeverity;
  message: string;
  stackTrace: string;
  frequency: number;
  lastOccurred: string; // ISO 8601
  status: "Open" | "Resolved" | "Ignored";
  affectedUsers: number;
}

export type IncidentStatus = "Resolved" | "Ongoing" | "Investigating";

export interface SystemIncident {
  id: string;
  serviceName: ServiceStatusName;
  status: IncidentStatus;
  startTime: string; // ISO
  endTime?: string; // ISO
  durationMinutes?: number;
  description: string;
}

export type InvoiceStatus = "Paid" | "Failed" | "Pending" | "Due" | "Overdue";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  amount: number;
  date: string; // ISO date string
  dueDate: string; // ISO date string
  status: InvoiceStatus;
  planName: string;
  pdfUrl?: string; // link to mock pdf
  billingPeriod: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
}

export interface UsageMetric {
  date: string;
  apiCalls: number;
  tasksCreated: number;
  storageUsage: number;
}

export interface PlanUsage {
  feature: "API Calls" | "Tasks" | "Storage" | "Submissions";
  usage: number;
  limit: number;
  unit: string;
}

export interface RevenueMetric {
  month: string; // e.g., "Jan", "Feb"
  mrr: number;
  newSubscriptions: number;
  churn: number;
}

export interface PlanDistribution {
  plan: "Basic" | "Pro" | "Enterprise";
  count: number;
}

export interface RevenueSource {
  source: "Subscriptions" | "Usage-based" | "Add-ons";
  amount: number;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits: {
    tasks: number; // -1 for unlimited
    submissions: number; // -1 for unlimited
    teamMembers: number; // -1 for unlimited
  };
  features: string[];
}

export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "EXPIRED" | "TRIAL";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type PaymentProvider =
  | "STRIPE"
  | "RAZORPAY"
  | "PAYPAL"
  | "GOOGLE_PAY"
  | "APPLE_PAY"
  | "PAYU"
  | "ACH";

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string; // ISO
  endDate: string; // ISO
  billingCycle: BillingCycle;
  paymentProvider?: PaymentProvider;
  externalSubscriptionId?: string;
  usage: {
    tasksCreated: number;
    submissionsReceived: number;
  };
}

// Dashboard data interfaces
export interface RecordingDashboardData {
  id: string;
  candidate: User;
  task: Task;
  company?: Company;
  recordingStatus?: "Recording" | "Paused" | "Completed" | "Not Started";
  submittedAt: string;
}

export interface SecurityDashboardData {
  id: string;
  candidate: User;
  task: Task;
  company: Company;
  status: SubmissionStatus;
  plagiarismRisk?: PlagiarismRisk;
  applicationDate: string;
}

export interface AdminSubmissionData {
  id: string;
  candidate: User;
  task: Task;
  company: Company;
  status: SubmissionStatus;
  validationStatus?: ValidationStatus;
  score?: number;
  autoScore?: number;
  autoScoringStatus?: "Pending" | "Completed" | "Failed";
  applicationDate: string;
}

export interface SubmissionWithTestData {
  id: string;
  candidate: User;
  task: Task;
  company: Company;
  status: SubmissionStatus;
  testCaseStatus?: TestCaseStatus;
  submittedAt: string;
}

export interface FeedbackData {
  submissionId: string;
  candidate: User;
  task: {
    id: string;
    title: string;
    roleCategory: RoleCategory;
  };
  score?: number;
  feedbackStatus: "Pending" | "Completed";
  evaluationDate: string;
}

export interface EvaluationData {
  id: string;
  candidate: User;
  task: {
    id: string;
    title: string;
    roleCategory: RoleCategory;
    multiRound?: boolean;
    timeLimitMinutes?: number;
  };
  status: SubmissionStatus;
  score?: number;
  submittedAt: string;
  timeSpentMinutes?: number;
}

export interface ComparisonData {
  submission: Submission;
  task: Task;
  candidate: User;
  evaluation?: Evaluation;
}

export interface AutomatedSubmission {
  id: string;
  candidateName: string;
  candidateAvatar?: string;
  taskTitle: string;
  companyName: string;
  autoScore?: number;
  validationStatus?: ValidationStatus;
  testCaseStatus?: TestCaseStatus;
  processedAt: string;
}
