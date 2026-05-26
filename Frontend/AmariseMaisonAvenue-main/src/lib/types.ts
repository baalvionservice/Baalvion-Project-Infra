export type CountryCode = "us" | "uk" | "ae" | "in" | "sg" | "ca";
export type LanguageCode = "en" | "ar" | "hi" | "fr";

export type PaymentGateway = "STRIPE" | "RAZORPAY" | "PAYU" | "BANK_TRANSFER";
export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "DISPUTED";
export type SubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "VERIFIED"
  | "EXPIRED";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
}

export type TaxType = "GST" | "VAT" | "SALES_TAX";

export interface TaxRule {
  id: string;
  country: CountryCode;
  taxType: TaxType;
  category: string; // 'general', 'hermes', 'watches', 'jewelry'
  rate: number; // percentage, e.g. 18
  isInclusive: boolean;
  lastUpdated: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  breakdown: {
    itemId: string;
    itemName: string;
    itemPrice: number;
    taxAmount: number;
    taxRate: number;
    taxType: TaxType;
  }[];
}

export interface FXRate {
  currencyCode: string;
  baseCurrency: string; // usually USD
  rate: number;
  spread: number; // Maison markup
  lastUpdated: string;
  source: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  tier: "Silver" | "Gold" | "Diamond";
  isPopular?: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  subscriptionId?: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  status: PaymentStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  country: CountryCode;
}

export type TransactionStatus =
  | "Pending"
  | "Paid"
  | "Processing"
  | "Settled"
  | "Closed"
  | "Refunded"
  | "Confirmed"
  | "Shipped"
  | "Delivered";

export interface Transaction {
  id: string;
  country: CountryCode;
  type: "Sale" | "Refund" | "Payout" | "Subscription";
  clientName: string;
  amount: number;
  netAmount?: number;
  taxAmount?: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
  brandId: string;
  artifactName?: string;
  isProvenanceCertified?: boolean;
  invoiceId?: string;
  gateway?: string;
  lockedRate?: number;
  fulfillmentSteps?: { step: string; timestamp: string; completed: boolean }[];
}

export interface Product {
  id: string;
  name: string;
  departmentId: string;
  categoryId: string;
  subcategoryId: string;
  collectionId: string;
  basePrice: number;
  imageUrl: string[];
  isVip: boolean;
  rating: number;
  reviewsCount: number;
  stock: number;
  brandId: string;
  isGlobal: boolean;
  regions: CountryCode[];
  status: "draft" | "published";
  lastEditedRegion: CountryCode | "global";
  specialNotes?: string;
  condition?: string;
  conditionDetails?: string;
  colors?: string[];
  sizes?: string[];
  vendorId?: string;
  scope?: string;
  currentVersion?: number;
  conflictStrategy?: string;
  versionHistory?: any[];
  targetKeyword?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  enabled: boolean;
  currency: string;
  symbol: string;
  locale: string;
  taxType: TaxType;
  taxRate: number;
  messagingStrategy: "Email" | "WhatsApp" | "Concierge";
  pricingVisibility?: string;
  featuredCategories?: string[];
}

export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  theme: any;
  enabled: boolean;
}

export interface GlobalSyncSession {
  id: string;
  timestamp: string;
  categories: ("products" | "seo" | "config")[];
  targets: CountryCode[];
  actorName: string;
  status: "pending" | "applied" | "rolled_back";
}

export interface GlobalSettings {
  theme: {
    primary: string;
    accent: string;
    fontFamily: string;
  };
  emergencyMode: boolean;
  isGuideMode: boolean;
  adminViewMode: "simple" | "advanced";
  performance?: any;
  payments?: any;
}

export interface MaisonNotification {
  id: string;
  toRole: string;
  country: CountryCode | "global";
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "alert" | "success";
}

export type AdminViewMode = "simple" | "advanced";

export interface VipClient {
  id: string;
  name: string;
  email: string;
  tier: "Silver" | "Gold" | "Diamond";
  loyaltyPoints: number;
  totalSpend: number;
  lastPurchase: string;
  isSubscriber: boolean;
  subscriptionPlan?: string;
  brandId: string;
  status: "pending" | "verified" | "rejected";
  walletBalance: number;
  walletHistory: any[];
  liveRequests: any[];
  certificates: any[];
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  subject: string;
  status: "open" | "resolved";
  priority: "low" | "normal" | "urgent";
  category: string;
  lastMessage: string;
  updatedAt: string;
  createdAt: string;
  messages: { id: string; sender: string; text: string; timestamp: string }[];
  brandId: string;
}

export interface PrivateInquiry {
  id: string;
  customerName: string;
  email: string;
  country: string;
  budgetRange: "Tier 1" | "Tier 2" | "Tier 3";
  intent: "Personal" | "Investment" | "Collector" | "Exploratory";
  message: string;
  contactMethod: "WhatsApp" | "Email";
  status: "new" | "contacted" | "qualifying" | "presenting" | "closing" | "won";
  leadTier: number;
  timestamp: string;
  productId?: string;
  serviceId?: string;
  brandId?: string;
}

export interface LeadConversation {
  id: string;
  inquiryId: string;
  status: "active" | "closed";
  messages: {
    id: string;
    sender: "client" | "curator";
    text: string;
    timestamp: string;
  }[];
}

export interface MaisonMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  country: CountryCode | "global";
}

export interface MaisonAlert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  status: "active" | "resolved";
  triggeredAt: string;
  country: CountryCode | "global";
}

export interface SystemHealthScore {
  overall: number;
  subsystems: {
    payments: number;
    api: number;
    inventory: number;
    ai: number;
    operational: number;
  };
  lastUpdated: string;
}

export interface FraudLog {
  id: string;
  userId: string;
  orderId?: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  actionTaken: string;
  timestamp: string;
  metadata?: any;
}

export interface DynamicPrice {
  id: string;
  productId: string;
  basePrice: number;
  adjustedPrice: number;
  country: CountryCode;
  reason: string;
  confidenceScore: number;
  updatedAt: string;
  metadata?: any;
}

export interface CMSSection {
  id: string;
  visible: boolean;
  content?: any;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  brandId: string;
  isGlobal: boolean;
}

export interface Editorial {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  country: string;
  author: string;
  date: string;
  isVip: boolean;
  featuredProducts: string[];
  targetKeyword?: string;
  metaDescription?: string;
  contentOutline?: string[];
  brandId: string;
  isGlobal: boolean;
}

export interface SEOMetadata {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords: string;
  country: string;
}

export interface SalesScript {
  id: string;
  name: string;
  stage: string;
  template: string;
  triggerKeywords?: string[];
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  type: "Private Viewing" | "Virtual Try-on" | "Atelier Tour";
  date: string;
  time: string;
  city: string;
  status: "pending" | "confirmed" | "canceled";
  brandId: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "issued" | "paid" | "pending";
  date: string;
  taxAmount: number;
  taxRate: number;
  complianceCertified: boolean;
  brandId: string;
  gateway?: string;
  fxRate?: number;
}

export interface Affiliate {
  id: string;
  name: string;
  tier: string;
  referralCode: string;
  salesGenerated: number;
  commissionEarned: number;
  status: string;
  brandId: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  productId: string;
  reason: string;
  status: "pending" | "received" | "inspected" | "restocked";
  warehouseId: string;
  requestedAt: string;
  brandId: string;
  country: string;
}

export interface MaisonError {
  id: string;
  type: string;
  module: string;
  message: string;
  severity: string;
  timestamp: string;
  resolved: boolean;
  country: string;
}

export interface BrandIntegrityIssue {
  id: string;
  productName: string;
  issueType: string;
  description: string;
  severity: string;
  status: "pending" | "fixed";
  country: string;
}

export interface WorkflowTask {
  id: string;
  name: string;
  module: string;
  status: string;
  logs: { id: string; message: string; timestamp: string }[];
}

export interface AIModuleStatus {
  id: string;
  name: string;
  enabled: boolean;
  level: "manual" | "assisted" | "auto";
}

export interface AIActionLog {
  id: string;
  moduleId: string;
  action: string;
  details: string;
  status: "executed" | "failed" | "suggested";
  timestamp: string;
  confidence?: number;
}

export interface AISuggestion {
  id: string;
  moduleId: string;
  type: string;
  title: string;
  description: string;
  data: any;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}

export type JobStatus =
  | "pending"
  | "running"
  | "retrying"
  | "completed"
  | "failed";
export type JobType =
  | "PAYMENT_VERIFY"
  | "INVENTORY_TTL"
  | "NOTIF_DISPATCH"
  | "METRICS_SYNC"
  | "AUDIT_SYNC";

export interface BackgroundJob {
  id: string;
  type: JobType;
  payload: any;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  nextRunAt: string;
  error?: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  description: string;
  heroImage: string;
  featuredCollections: string[];
  featuredProducts: string[];
  office: {
    city: string;
    address: string;
    phone: string;
    email: string;
    mapUrl: string;
    image: string;
  };
  trends: { title: string; description: string }[];
}

export interface BuyingGuide {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tips: string[];
  featuredProducts: string[];
  featuredCollections: string[];
  imageUrl: string;
  category: string;
  country: string;
  date: string;
  author: string;
  targetKeyword?: string;
  metaDescription?: string;
  investmentOutlook?: string;
  brandId: string;
  isGlobal: boolean;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  categories: string[];
}

export interface Category {
  id: string;
  departmentId: string;
  name: string;
  subcategories: string[];
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  locale: string;
  flag: string;
  office: {
    city: string;
    address: string;
    phone: string;
    email: string;
    mapUrl: string;
    image: string;
  };
}

export interface MaisonStory {
  title: string;
  subtitle: string;
  history: { year: string; milestone: string; description: string }[];
  philosophy: string;
  craftsmanship: { title: string; description: string; imageUrl: string }[];
  sustainability: string;
  institutionalCharter: string;
  brandId: string;
}

export interface CustomerServiceInfo {
  shipping: string;
  returns: string;
  faqs: { question: string; answer: string }[];
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  lastActive: string;
  twoFactorEnabled: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  performance: number;
  productCount: number;
  salesTotal: number;
  status: string;
  payoutSchedule: string;
  joinedDate: string;
  kpis: { returnRate: number; fulfillmentSpeed: string; rating: number };
  brandId: string;
}

export interface Campaign {
  id: string;
  title: string;
  type: string;
  status: "active" | "scheduled" | "completed";
  discountValue: number;
  startDate: string;
  endDate: string;
  market: string;
  reach: number;
  conversions: number;
  roi: number;
  predictedRoi: number;
  abTestActive: boolean;
  brandId: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  severity: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  userCount: number;
  avgOrderValue: number;
  tags: string[];
  predictedChurn: number;
  brandId: string;
}

export interface SupportStats {
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
  csatScore: number;
  activeChats: number;
}

export interface MaisonIntegration {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  lastSync: string;
  uptime: number;
  brandId: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  latency: string;
  integrationId: string;
}

export interface IndexingStatus {
  catalogItems: number;
  indexedItems: number;
  lastFullScan: string;
  searchEngineStatus: string;
  sitemapStatus: string;
  autoSyncEnabled: boolean;
}

export interface IndexingLog {
  id: string;
  timestamp: string;
  action: string;
  itemsAffected: number;
  duration: string;
  status: string;
}

export type ShipmentStatus =
  | "pending"
  | "packed"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export interface Shipment {
  id: string;
  orderId: string;
  userId: string;
  country: CountryCode;
  courierName: string;
  trackingId: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  history: {
    status: ShipmentStatus;
    location: string;
    timestamp: string;
    message: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  country: string;
  action: string;
  entity: string;
  severity: "low" | "medium" | "high";
  beforeState?: any;
  afterState?: any;
  reason?: string;
  timestamp: string;
}

export interface ProductExtended {
  collectorValue: string;
  marketRange: string;
  investmentInsight: string;
  scarcityTag: string;
  priceVisible: boolean;
}

export interface MaisonService {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceRange: string;
  features: string[];
  imageUrl: string;
  brandId: string;
  isGlobal: boolean;
}

export interface MaisonReport {
  id: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  isPremium: boolean;
  previewImage: string;
  brandId: string;
}

export interface RiskLevel {
  score: number;
  level: "low" | "medium" | "high" | "critical";
}

export type AIAutomationLevel = "manual" | "assisted" | "auto";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  action: string;
  conditions: any[];
}

export interface SystemLog {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  module: string;
  metadata?: any;
  status?: "success" | "error";
  type?: string;
  action?: string;
}
