export type UserRole = "BRAND" | "CREATOR" | "ADMIN";

export type BrandMemberRole = "OWNER" | "MANAGER" | "REVIEWER" | "VIEWER";

export enum CampaignStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  REVIEWING = "REVIEWING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export enum InviteStatus {
  SENT = "SENT",
  OPENED = "OPENED",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export enum DeliverableStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  APPROVED = "APPROVED",
  REMOVED = "REMOVED",
}

export enum DisputeStatus {
  FILED = "FILED",
  UNDER_REVIEW = "UNDER_REVIEW",
  ADMIN_DECISION = "ADMIN_DECISION",
  RESOLVED = "RESOLVED",
}

export interface Dispute {
  id: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  deliverableId?: string;
  category: string;
  reason: string;
  proposedResolution: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum OnboardingStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export type SupportCategory = "TECHNICAL" | "BILLING" | "CAMPAIGN" | "OTHER";
export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  phone?: string;
  status?: "ACTIVE" | "SUSPENDED" | "PENDING";
  isVerified?: boolean;
  preferredCurrency?: string;
  notificationPreferences?: {
    campaigns: boolean;
    payments: boolean;
    messages: boolean;
    system: boolean;
  };
  twoFactorEnabled?: boolean;
  fcmTokens?: string[];
  tourCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandMember {
  id: string;
  userId: string;
  email: string;
  role: BrandMemberRole;
  joinedAt: string;
  lastActive?: string;
}

export interface Review {
  id: string;
  creatorId: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  campaignId: string;
  campaignTitle: string;
  rating: number;
  comment: string;
  response?: string;
  createdAt: string;
}

export interface PackageDeal {
  id: string;
  title: string;
  description: string;
  price: number;
  deliverables: string[];
}

export interface AuthenticityReport {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
  breakdown: {
    growth: number;
    engagement: number;
    ratio: number;
    maturity: number;
    geo: number;
  };
}

export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  bio: string;
  photoURL: string;
  niches: string[];
  socialStats: Record<string, any>;
  baseRates: Record<string, number>;
  packages?: PackageDeal[];
  location?: string;
  rating: number;
  visibility?: "PUBLIC" | "PRIVATE";
  isVerified?: boolean;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FLAGGED";
  authenticityScore?: number;
  authenticityReport?: AuthenticityReport;
  privacySettings?: {
    canMessage: "anyone" | "verified" | "invited";
    canSeeRates: "anyone" | "verified";
  };
  payoutAccounts?: Array<{
    id: string;
    type: "UPI" | "BANK";
    name: string;
    details: string;
    isPrimary: boolean;
  }>;
  onboardingStatus: OnboardingStatus;
  onboardingStep: number;
  payoutMethod?: {
    type: "UPI" | "BANK";
    details: Record<string, string>;
  };
  portfolioSamples?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  platform: string;
  campaignType: string;
  results: string;
  isPublic: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "TRIALING"
  | "INCOMPLETE";

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  website: string;
  teamSize: string;
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  brandGuidelines: string;
  logoUrl?: string;
  onboardingStatus: OnboardingStatus;
  onboardingStep: number;
  currency?: string;
  billingMethod?: {
    type: "CARD";
    last4: string;
    brand: string;
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  gstNumber?: string;
  billingAddress?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED";
  apiKeys?: string[];
  defaultBriefTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDeliverable {
  type: string;
  qty: number;
  platform: string;
  specs: string;
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  niches: string[];
  budget: number;
  escrowBalance?: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  requirements: string[];
  deliverablesCount: number;
  deliverables?: CampaignDeliverable[];
  dos?: string[];
  donts?: string[];
  hashtags?: string[];
  handles?: string[];
  links?: string[];
  mandatoryMentions?: string;
  creatorTier?: "NANO" | "MICRO" | "MID" | "MACRO";
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  targetLocations?: string[];
  languages?: string[];
  audienceAgeMin?: number;
  audienceAgeMax?: number;
  audienceGender?: string;
  minPosts?: number;
  isExclusive?: boolean;
  moderationNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  escrowBalance: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  campaignId?: string;
  amount: number;
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "PAYMENT"
    | "PAYOUT"
    | "CREDIT"
    | "DEBIT"
    | "ESCROW_LOCK"
    | "ESCROW_RELEASE"
    | "FEE"
    | "REFUND";
  status: TransactionStatus;
  description: string;
  receiptUrl?: string;
  createdAt: string;
}

export type NotificationType =
  | "NEW_MATCH"
  | "APPLICATION_UPDATE"
  | "PAYMENT_RECEIVED"
  | "DEADLINE_REMINDER"
  | "DISPUTE_UPDATE"
  | "NEW_MESSAGE"
  | "SYSTEM"
  | "PROFILE_VIEW"
  | "CAMPAIGN_INVITE";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  link?: string;
  relatedId?: string;
  createdAt: string;
  expiresAt?: string; // For 30-day cleanup logic
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  cta?: string;
  audience: "ALL" | "BRANDS" | "CREATORS" | "NICHE" | "PLAN";
  audienceValue?: string;
  type: "IN_APP" | "EMAIL" | "BOTH";
  status: "SENT" | "SCHEDULED";
  sentAt: string;
  stats: {
    recipients: number;
    opens: number;
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  actionType: string;
  entityId: string;
  entityType: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  isCritical: boolean;
  ipAddress?: string;
}

export interface CreatorNote {
  id: string;
  userId: string;
  campaignTitle: string;
  title: string;
  content: string;
  type: "AI_IDEA" | "MANUAL";
  createdAt: string;
}

export type FlaggedContent = {
  id: string;
  deliverableId: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  reason: string;
  flagType: "USER_REPORT" | "AUTO_KEYWORD" | "AI_DETECTION";
  riskFactor: number;
  status: "PENDING" | "CLEARED" | "REMOVED";
  createdAt: string;
};

export type FraudAlertType =
  | "FOLLOWER_SPIKE"
  | "HIGH_ENGAGEMENT"
  | "MULTI_ACCOUNT_IP"
  | "SUSPICIOUS_PAYOUT";

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: FraudAlertType;
  riskScore: number;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  metadata: {
    ipAddress?: string;
    delta?: string;
    connectedAccounts?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
  feedback?: "ACCURATE" | "FALSE_POSITIVE" | "INCONCLUSIVE";
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "DOCUMENT";
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastSenderId?: string;
  updatedAt: string;
  typing?: Record<string, boolean>;
  campaignTitle?: string;
}
