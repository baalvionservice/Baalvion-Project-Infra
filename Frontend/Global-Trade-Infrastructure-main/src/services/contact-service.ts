/**
 * @file contact-service.ts
 * @description PUBLIC contact-form intake. Submits an institutional inquiry to
 * the same unauthenticated auth-gateway surface the onboarding wizards use —
 * the visitor has no session yet.
 */

export interface ContactInquiryInput {
  name: string;
  email: string;
  institution?: string;
  subject: 'onboarding' | 'technical' | 'governance' | 'other';
  message: string;
}

class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  async submitInquiry(input: ContactInquiryInput): Promise<void> {
    const res = await fetch('/trade-bff/auth/contact-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || 'Inquiry could not be sent');
    }
  }
}

export const contactService = ContactService.getInstance();
