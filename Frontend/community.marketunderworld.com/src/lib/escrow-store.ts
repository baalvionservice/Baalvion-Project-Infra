// Escrow Data Store & State Management
import { VerifiedMemberProfile, ServiceRequest, MemberReview, ChatMessage, EscrowNotification } from "./escrow-types";

export const MOCK_AGENTS: VerifiedMemberProfile[] = [
  {
    id: "agent_alpha",
    name: "FastPay Escrow Agent #1",
    userId: "fastpay_pro",
    upiId: "fastpay.escrow@icici",
    phonePeNumber: "+91 98765 43210",
    gpayNumber: "+91 98765 43210",
    identityVerified: true,
    verificationDate: "2026-08-15",
    approvalStatus: "approved",
    depositPaid: true,
    depositAmount: 1000,
    depositTxHash: "0x89f2a49b81c201d4a3e791b82910fae7741bc294711ad8e9204128",
    supportedServices: ["buy_usdt", "crypto_trade", "account_setup"],
    completedJobs: 142,
    positiveReviewPercentage: 99.4,
    disputesUpheldCount: 0,
    supportedPaymentMethods: ["phonepe", "gpay", "upi_qr", "upi_id", "INR"],
    tradeSizeLimit: 5000,
    commissionDetails: "1% flat fee on INR fiat conversion",
    languages: ["English", "Hindi"],
    availability: true,
    averageResponseMinutes: 3,
    bio: "Top-rated verified escrow intermediary handling high-volume USDT purchases & PhonePe/GPay direct transfers."
  },
  {
    id: "agent_beta",
    name: "Global Fiat Intermediary",
    userId: "global_fiat_hub",
    upiId: "globalfiat@okaxis",
    phonePeNumber: "+91 91234 56789",
    gpayNumber: "+91 91234 56789",
    identityVerified: true,
    verificationDate: "2026-09-01",
    approvalStatus: "approved",
    depositPaid: true,
    depositAmount: 1000,
    depositTxHash: "0x3c990a1e4b31c00fa827bc192834fe819200aa12984bc88192801a",
    supportedServices: ["buy_usdt", "account_setup"],
    completedJobs: 89,
    positiveReviewPercentage: 98.1,
    disputesUpheldCount: 0,
    supportedPaymentMethods: ["phonepe", "gpay", "INR"],
    tradeSizeLimit: 2500,
    commissionDetails: "0.8% service fee",
    languages: ["English", "Hindi", "Punjabi"],
    availability: true,
    averageResponseMinutes: 5,
    bio: "Fast seller account onboarding & USDT provisioning for traders with local UPI methods."
  },
  {
    id: "agent_gamma",
    name: "UPI Direct Exchange",
    userId: "upi_express",
    upiId: "upiexpress@paytm",
    phonePeNumber: "+91 99887 76655",
    gpayNumber: "+91 99887 76655",
    identityVerified: true,
    verificationDate: "2026-07-20",
    approvalStatus: "approved",
    depositPaid: true,
    depositAmount: 1000,
    depositTxHash: "0x7711aa09bc881920194726105fe8194bca11029481942bc0129",
    supportedServices: ["buy_usdt", "crypto_trade", "account_setup"],
    completedJobs: 310,
    positiveReviewPercentage: 100,
    disputesUpheldCount: 0,
    supportedPaymentMethods: ["phonepe", "gpay", "upi_qr", "upi_id"],
    tradeSizeLimit: 10000,
    commissionDetails: "0.5% volume fee",
    languages: ["English", "Hindi", "Bengali"],
    availability: true,
    averageResponseMinutes: 2,
    bio: "24/7 instant crypto fulfillment backed by $1,000 security collateral in cold vault."
  }
];

export const MOCK_REVIEWS: MemberReview[] = [
  {
    id: "rev-1",
    requestId: "REQ-7721-A",
    reviewerId: "usr_trader_99",
    reviewerName: "Rahul S.",
    memberId: "agent_alpha",
    rating: 5,
    comment: "Super fast! Sent PhonePe payment and got 100 USDT credited to my account in under 4 minutes.",
    createdAt: "2026-10-08 16:30"
  },
  {
    id: "rev-2",
    requestId: "REQ-6102-B",
    reviewerId: "crypto_newbie",
    reviewerName: "Priya M.",
    memberId: "agent_alpha",
    rating: 5,
    comment: "Helped me setup my marketplace seller account step by step. Very patient and trustworthy!",
    createdAt: "2026-10-05 11:15"
  },
  {
    id: "rev-3",
    requestId: "REQ-4091-C",
    reviewerId: "dark_trader",
    reviewerName: "Vikram K.",
    memberId: "agent_gamma",
    rating: 5,
    comment: "Instant GPay verification. $1,000 security deposit badge gives full confidence.",
    createdAt: "2026-10-09 20:10"
  }
];

export const INITIAL_TRADES: ServiceRequest[] = [
  {
    id: "REQ-8822-B",
    customerId: "user_buyer_1",
    customerName: "Alex Mercer",
    memberId: "agent_alpha",
    memberName: "FastPay Escrow Agent #1",
    serviceType: "account_setup",
    amount: 50,
    paymentMethod: "phonepe",
    deadline: "2026-10-11T12:00:00Z",
    instructions: "Seller Account Registration & Market Access Access Counter (50 USDT)",
    status: "payment_verification",
    serviceCost: 50,
    memberCommission: 2,
    totalCost: 52,
    paymentProviderReference: "UPI-PAY-98127391827",
    evidenceUrls: ["/proof_sample_1.png"],
    chatMessages: [
      {
        id: "m-1",
        requestId: "REQ-8822-B",
        senderId: "user_buyer_1",
        senderName: "Alex Mercer",
        senderRole: "customer",
        text: "Hi agent! I have sent ₹4,500 via PhonePe to fastpay.escrow@icici. Reference: UPI-PAY-98127391827.",
        timestamp: "10:14 AM"
      },
      {
        id: "m-2",
        requestId: "REQ-8822-B",
        senderId: "agent_alpha",
        senderName: "FastPay Escrow Agent #1",
        senderRole: "verified_member",
        text: "Got it! Checking my PhonePe notification right now...",
        timestamp: "10:15 AM"
      }
    ],
    createdAt: "2026-10-10T10:00:00Z",
    updatedAt: "2026-10-10T10:15:00Z"
  }
];

// LocalStorage Persistence Helpers
const IS_SERVER = typeof window === "undefined";

export function getStoredTrades(): ServiceRequest[] {
  if (IS_SERVER) return INITIAL_TRADES;
  const data = localStorage.getItem("baalvion_escrow_trades");
  if (!data) {
    localStorage.setItem("baalvion_escrow_trades", JSON.stringify(INITIAL_TRADES));
    return INITIAL_TRADES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_TRADES;
  }
}

export function saveTrades(trades: ServiceRequest[]): void {
  if (IS_SERVER) return;
  localStorage.setItem("baalvion_escrow_trades", JSON.stringify(trades));
}

export function createNewTrade(tradeData: Partial<ServiceRequest>): ServiceRequest {
  const trades = getStoredTrades();
  const agent = MOCK_AGENTS.find(a => a.id === tradeData.memberId) || MOCK_AGENTS[0];
  
  const newTrade: ServiceRequest = {
    id: `REQ-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 3).toUpperCase()}`,
    customerId: tradeData.customerId || "current_user",
    customerName: tradeData.customerName || "You (Buyer)",
    memberId: agent.id,
    memberName: agent.name,
    serviceType: tradeData.serviceType || "buy_usdt",
    amount: tradeData.amount || 100,
    paymentMethod: tradeData.paymentMethod || "phonepe",
    deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    instructions: tradeData.instructions || "USDT Access Request",
    status: "created",
    serviceCost: tradeData.amount || 100,
    memberCommission: Math.max(1, Math.round((tradeData.amount || 100) * 0.01)),
    totalCost: (tradeData.amount || 100) + Math.max(1, Math.round((tradeData.amount || 100) * 0.01)),
    chatMessages: [
      {
        id: `msg-${Date.now()}`,
        requestId: "",
        senderId: "system",
        senderName: "System Escrow Bot",
        senderRole: "admin",
        text: `Trade initiated with ${agent.name}. Please transfer payment via ${tradeData.paymentMethod?.toUpperCase() || 'UPI'} to complete escrow.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  trades.unshift(newTrade);
  saveTrades(trades);
  return newTrade;
}

export function updateTradeState(tradeId: string, updates: Partial<ServiceRequest>): ServiceRequest | null {
  const trades = getStoredTrades();
  const index = trades.findIndex(t => t.id === tradeId);
  if (index === -1) return null;

  trades[index] = {
    ...trades[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveTrades(trades);
  return trades[index];
}

export function appendChatMessage(tradeId: string, message: Omit<ChatMessage, "id">): ChatMessage {
  const trades = getStoredTrades();
  const trade = trades.find(t => t.id === tradeId);
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    ...message
  };

  if (trade) {
    if (!trade.chatMessages) trade.chatMessages = [];
    trade.chatMessages.push(newMsg);
    saveTrades(trades);
  }

  return newMsg;
}

// Generate real PhonePe / GPay / UPI QR string
export function buildUpiUri(upiId: string, amountInInr: number, name: string, note: string): string {
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(note);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amountInInr}&cu=INR&tn=${encodedNote}`;
}
