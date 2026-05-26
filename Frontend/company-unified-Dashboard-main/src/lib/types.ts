export type Role = "ADMIN" | "INVESTOR" | "CO_FOUNDER" | "EMPLOYEE";
export type Currency = "USD" | "INR" | "GBP" | "AED" | "SGD";
export type BusinessStatus = "Active" | "Growth" | "Review";

export interface Business {
  id: string;
  name: string;
  imageId: string;
  country: string;
  countryCode: string;
  currency: Currency;
  status: BusinessStatus;
  currentMetrics: {
    revenue: number;
    profit: number;
    employees: number;
    domains: number;
  };
  revenueHistory: { month: string; revenue: number; profit: number }[];
  equitySplit: { name: string; percentage: number }[];
  notableEvents: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  imageId: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  businessId: string;
  country: string;
  status: string;
  employmentType: string;
  joinDate: string;
  salary: number;
  manager: string | null;
  directReports: string[];
  performance: {
    score: number;
    tasksCompleted: number;
    attendance: number;
  };
  imageId: string;
}

export interface FxRate {
  [key: string]: number;
}

export type PaymentGateway = "Stripe" | "Razorpay" | "PayPal";
export type TransactionStatus = "Success" | "Failed" | "Pending";

export interface Transaction {
  id: string;
  businessId: string;
  gateway: PaymentGateway;
  customer: {
    name: string;
    email: string;
  };
  amount: number;
  fee: number;
  currency: Currency;
  status: TransactionStatus;
  date: string;
}

export type KpiPeriod = "Day" | "Week" | "Month" | "Quarter" | "Year";

export interface KpiData {
  businessId: string;
  revenue: {
    target: number;
    actual: number;
  };
  profitMargin: {
    value: number;
    trend: "up" | "down" | "flat";
  };
  customers: {
    total: number;
    change: number;
  };
  returnRate: number;
  nps: number;
}

export interface AllKpis {
  [key: string]: KpiData[];
}

export type NotificationType = "Alert" | "System" | "Finance" | "Team";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

export interface ServerCost {
  country: string;
  provider: string;
  cost: number;
  services: string;
}

export interface Stakeholder {
  name: string;
  role: string;
  equity: number;
  usdValue: number;
  vestingStatus: string;
  notes: string;
}

export interface EquityHistoryEvent {
  id: string;
  date: string;
  event: string;
  stakeholder: string;
  change: string;
  newTotal: string;
}

export interface EquityData {
  businessId: string;
  valuation: number;
  stakeholders: Stakeholder[];
  equityHistory: EquityHistoryEvent[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigneeId: string;
  businessId: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  comments: {
    id: string;
    authorId: string;
    text: string;
    timestamp: string;
  }[];
}

export interface ComplianceRecord {
  countryId: string;
  country: string;
  business: string;
  flag: string;
  taxStatus: string;
  taxStatusCode: "ok" | "warning";
  vatGst: string;
  licenses: string;
  dataLaws: string;
  employmentLaw: string;
  overallScore: number;
  actionItems: string[];
}

export interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: string;
  paymentDate: string;
}

export type Severity = "Critical" | "Warning" | "Info";
export type Status = "Success" | "Failed";
export type Action =
  | "LOGIN"
  | "LOGOUT"
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "PERMISSION_CHANGE"
  | "FAILED_LOGIN";

export interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number | string;
  user: string;
  role?: string;
  resource: string;
  ipAddress: string;
  location: string;
  status: Status;
  severity: Severity;
  details: Record<string, any>;
}

export interface PermissionRole {
  [key: string]: boolean;
}

export interface PermissionsData {
  roles: {
    [roleName: string]: PermissionRole;
  };
  permissions: Array<{
    id: number;
    user_id: number;
    module: string;
    access: string;
  }>;
}
