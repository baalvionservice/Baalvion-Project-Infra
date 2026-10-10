// Escrow Marketplace Types

export type EscrowRole = "customer" | "verified_member" | "admin";

export type ServiceType = "buy_usdt" | "crypto_trade" | "account_setup";
export type PaymentMethod = "upi_qr" | "upi_id" | "gpay" | "phonepe" | "USDT" | "BTC" | "USD" | "INR";

export type TradeStatus = 
  | "created" // Request submitted
  | "member_assigned" // Verified member is assigned
  | "payment_verification" // Payment submitted, waiting for verification
  | "in_progress" // Member is performing the requested service
  | "completed" // Service completed, commission released
  | "disputed" // Customer reported an issue
  | "cancelled";

export interface VerifiedMemberProfile {
  id: string;
  name?: string;
  userId: string;
  avatarUrl?: string;
  bio?: string;
  upiId?: string;
  phonePeNumber?: string;
  gpayNumber?: string;
  identityVerified: boolean;
  verificationDate: string;
  approvalStatus: "pending" | "approved" | "suspended";
  depositPaid: boolean;
  depositAmount: number;
  depositTxHash?: string;
  supportedServices: ServiceType[];
  completedJobs: number;
  positiveReviewPercentage: number;
  disputesUpheldCount: number;
  supportedPaymentMethods: PaymentMethod[];
  tradeSizeLimit: number;
  commissionDetails: string;
  languages: string[];
  availability: boolean;
  averageResponseMinutes?: number;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: EscrowRole;
  text: string;
  attachmentUrl?: string;
  timestamp: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName?: string;
  memberId?: string;
  memberName?: string;
  serviceType: ServiceType;
  amount: number;
  paymentMethod: PaymentMethod;
  deadline: string; // ISO date string
  instructions: string;
  status: TradeStatus;
  serviceCost: number;
  memberCommission: number;
  totalCost: number;
  paymentProviderReference?: string;
  evidenceUrls?: string[];
  chatMessages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDispute {
  id: string;
  requestId: string;
  raisedById: string;
  reason: "incomplete_work" | "payment_mismatch" | "failed_usdt" | "setup_issue" | "other";
  description: string;
  evidenceUrls: string[];
  status: "open" | "under_review" | "resolved" | "appealed";
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberReview {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName?: string;
  memberId: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
}

export interface EscrowNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  timestamp: string;
}
