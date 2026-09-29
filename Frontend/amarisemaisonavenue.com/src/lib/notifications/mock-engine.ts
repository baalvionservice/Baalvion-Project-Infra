/**
 * @fileOverview Institutional Notification Engine (Mock)
 * Handles the dispatch of in-app alerts and simulated email communications.
 */

import { MaisonNotification, CountryCode } from '../types';

/**
 * Mock Email Dispatcher
 * Logs a simulated email payload to the console.
 */
export function sendEmailMock(toRole: string, message: string, country: string = 'global') {
  const timestamp = new Date().toLocaleString();
  console.log(`
%c[EMAIL MOCK] 📩
%cTo: %c${toRole.toUpperCase()}
%cMarket: %c${country.toUpperCase()}
%cMessage: %c${message}
%cTime: %c${timestamp}
------------------------------------------`,
    "color: #7E3F98; font-weight: bold; font-size: 12px;",
    "color: #999;", "color: #000; font-weight: bold;",
    "color: #999;", "color: #D4AF37; font-weight: bold;",
    "color: #999;", "color: #333; italic",
    "color: #999;", "color: #666;"
  );
}

/**
 * Institutional Notification Helper
 * This function can be used by AI Autopilot, CRM, and Operations modules.
 */
export function dispatchInstitutionalNotification(
  store: any, 
  params: {
    toRole: string;
    message: string;
    country?: string;
    type?: MaisonNotification['type'];
    sendEmail?: boolean;
  }
) {
  const { toRole, message, country = 'global', type = 'info', sendEmail = true } = params;

  // 1. Update In-App State
  store.sendNotification(toRole, message, country, type);

  // 2. Simulate Email if requested
  if (sendEmail) {
    sendEmailMock(toRole, message, country);
  }

  // 3. System Console Log
  console.log(`%c[SYSTEM ALERT] %c${toRole} | ${country} | ${message}`, "color: #D4AF37; font-weight: bold;", "color: #666;");
}
