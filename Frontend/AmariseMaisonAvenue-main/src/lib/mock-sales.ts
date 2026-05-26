import { PrivateInquiry, LeadConversation } from './types';

/**
 * HIGH-TICKET SALES MOCK DATA
 * Mocked CRM registry for private acquisitions.
 * Using stable strings for hydration consistency.
 */

export const MOCK_INQUIRIES: PrivateInquiry[] = [
  {
    id: 'inq-101',
    customerName: 'Alexander Cross',
    email: 'a.cross@heritage.com',
    country: 'United Kingdom',
    budgetRange: 'Tier 1',
    intent: 'Collector',
    message: 'Seeking a 1924 series Birkin in pristine condition for personal archive.',
    contactMethod: 'WhatsApp',
    status: 'new',
    leadTier: 1,
    timestamp: '2024-03-15T10:00:00Z',
    productId: 'prod-1'
  },
  {
    id: 'inq-102',
    customerName: 'Sophia Chen',
    email: 'sophia@lux.net',
    country: 'Singapore',
    budgetRange: 'Tier 2',
    intent: 'Investment',
    message: 'Interested in the appreciation trajectory of the seasonal Haute Couture pieces.',
    contactMethod: 'Email',
    status: 'contacted',
    leadTier: 2,
    timestamp: '2024-03-15T09:30:00Z',
    productId: 'prod-10'
  }
];

export const MOCK_CONVERSATIONS: LeadConversation[] = [
  {
    id: 'conv-101',
    inquiryId: 'inq-101',
    status: 'active',
    messages: [
      { id: 'm1', sender: 'client', text: 'Seeking a 1924 series Birkin in pristine condition.', timestamp: '2024-03-15T10:05:00Z' },
      { id: 'm2', sender: 'curator', text: 'Thank you for your inquiry. Your request has been personally reviewed by our acquisition desk. Before we proceed, I would like to understand your intent more precisely.', timestamp: '2024-03-15T10:10:00Z' }
    ]
  }
];
