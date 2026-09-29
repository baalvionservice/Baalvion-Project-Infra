export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'account' | 'security' | 'feature_request' | 'abuse' | 'other';

export interface SupportTicket {
  id:           string;
  ticketNumber: string;
  subject:      string;
  description:  string;
  status:       TicketStatus;
  priority:     TicketPriority;
  category:     TicketCategory;
  userId:       string | null;
  userEmail:    string;
  userName:     string;
  orgId:        string | null;
  orgName:      string | null;
  assigneeId:   string | null;
  assigneeName: string | null;
  tags:         string[];
  slaDeadline:  string | null;
  slaBreached:  boolean;
  messageCount: number;
  firstResponseAt: string | null;
  resolvedAt:   string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface TicketMessage {
  id:          string;
  ticketId:    string;
  authorId:    string;
  authorName:  string;
  authorRole:  'user' | 'agent' | 'system';
  body:        string;
  isInternal:  boolean;
  attachments: Array<{ name: string; url: string; size: number }>;
  createdAt:   string;
}

export interface CustomerTimeline {
  userId:       string;
  email:        string;
  name:         string;
  plan:         string;
  signedUpAt:   string;
  lastActiveAt: string;
  events:       Array<{
    id:        string;
    type:      'auth' | 'payment' | 'support' | 'security' | 'account';
    action:    string;
    meta:      Record<string, unknown>;
    createdAt: string;
  }>;
  tickets:      SupportTicket[];
  payments:     Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>;
}

export interface SupportStats {
  openTickets:       number;
  pendingTickets:    number;
  resolvedToday:     number;
  avgFirstResponseMs: number;
  avgResolutionMs:   number;
  slaBreached:       number;
  csat:              number | null;
}

export interface Macro {
  id:       string;
  name:     string;
  body:     string;
  category: string;
  usageCount: number;
}
