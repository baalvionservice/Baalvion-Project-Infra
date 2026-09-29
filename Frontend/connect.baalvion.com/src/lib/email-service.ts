
'use client';

/**
 * @fileOverview Baalvion Email Dispatch Service (Mock)
 * 
 * Uses @react-email/render to generate HTML from React components.
 * In development, logs the HTML to console. In production, this would
 * integrate with Resend, SendGrid, or Postmark.
 */

import { render } from "@react-email/render";
import React from 'react';

/**
 * Mock function to "send" an email by rendering the React component to HTML
 * and logging it to the console for inspection.
 */
export async function sendMockEmail(
  to: string,
  subject: string,
  component: React.ReactElement
) {
  try {
    // Render the React component to an HTML string
    const html = await render(component);

    console.group(`📧 MOCK EMAIL DISPATCH: ${subject}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--- HTML CONTENT START ---');
    console.log(html);
    console.log('--- HTML CONTENT END ---');
    console.groupEnd();

    return { success: true, messageId: `mock_${Date.now()}` };
  } catch (error) {
    console.error('Failed to render email template:', error);
    return { success: false, error };
  }
}

/**
 * Helper to trigger specific template types for testing
 */
export async function triggerTestEmail(type: string, email: string) {
  const { WelcomeBrandEmail } = await import("@/emails/WelcomeBrand");
  const { WelcomeCreatorEmail } = await import("@/emails/WelcomeCreator");
  const { PaymentReceivedEmail } = await import("@/emails/PaymentReceived");

  switch (type) {
    case 'WELCOME_BRAND':
      return sendMockEmail(email, "Welcome to Baalvion!", React.createElement(WelcomeBrandEmail, { brandName: "Acme Corp" }));
    case 'WELCOME_CREATOR':
      return sendMockEmail(email, "Welcome to Baalvion!", React.createElement(WelcomeCreatorEmail, { userName: "Sarah" }));
    case 'PAYMENT':
      return sendMockEmail(email, "Payment Confirmed", React.createElement(PaymentReceivedEmail, { userName: "Sarah", amount: "₹12,000" }));
    default:
      console.warn('Unknown email type triggered');
  }
}
