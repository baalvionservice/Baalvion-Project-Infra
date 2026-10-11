// Escrow Data Store & State Management
import { VerifiedMemberProfile, ServiceRequest, MemberReview, ChatMessage, EscrowNotification } from "./escrow-types";

// Verified intermediaries. Real people only: add an entry when someone has been approved and has agreed to be listed.
// Nothing here is estimated: counts start at zero and are not shown until real trades exist.
export const AGENTS: VerifiedMemberProfile[] = [
  {
    id: "deepak-kumar-kuldeep",
    name: "Deepak Kumar Kuldeep",
    userId: "deepak-kumar-kuldeep",
    // He supplied both QR codes; the payee name and UPI IDs were read from the QR codes themselves.
    // UPI IDs are not printed on the site: people pay by scanning.
    upiId: "8951284770@axl",
    paymentQrs: [
      { label: "PhonePe", url: "/pay/phonepe-deepak-kumar-kuldeep.jpg" },
      { label: "Bank account (UPI)", url: "/pay/bank-upi-deepak-kumar-kuldeep.jpg" },
    ],
    identityVerified: false,
    verificationDate: "2026-10-11",
    approvalStatus: "approved",
    depositPaid: false,
    depositAmount: 0,
    supportedServices: ["buy_usdt", "crypto_trade", "account_setup"],
    completedJobs: 0,
    positiveReviewPercentage: 0,
    disputesUpheldCount: 0,
    supportedPaymentMethods: ["phonepe", "upi_qr", "upi_id"],
    tradeSizeLimit: 0,
    commissionDetails: "Agree the fee in the trade chat before you pay",
    languages: [],
    availability: true,
    bio: "Intermediary who helps members with USDT purchases, crypto trades and account setup. Pay only by scanning a QR shown on this page, and check that the name your UPI app shows is Deepak Kumar Kuldeep before you send.",
  },
];


// Reviews from completed trades. Empty until real trades are reviewed.
export const REVIEWS: MemberReview[] = [];


// No seeded trades: every trade shown is one a real customer created.
export const INITIAL_TRADES: ServiceRequest[] = [];


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
  const agent = AGENTS.find(a => a.id === tradeData.memberId);
  if (!agent) throw new Error("That intermediary is not available. Choose one from the directory.");
  
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
