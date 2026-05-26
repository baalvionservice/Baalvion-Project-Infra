/**
 * @fileOverview AutomationService
 * Orchestrates event-driven intelligence alerts to drive engagement and conversion.
 */

import { createNotification } from "./notificationService";
import { EVENTS, PlatformEvent } from "@/lib/automation/eventTriggers";

/**
 * Handles incoming platform events and triggers automated behavioral responses.
 */
export const handleEvent = async (
  event: PlatformEvent,
  payload: { userId: string; metadata?: any }
) => {
  const timestamp = Date.now();
  // Add a random suffix to prevent key collisions if events fire in the same millisecond
  const uniqueId = () => `${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
  
  switch (event) {
    case EVENTS.BOOKING_CREATED:
      await createNotification({
        id: `auto_book_${uniqueId()}`,
        userId: payload.userId,
        title: "Engagement Initiated",
        message: "Your consultation request has been broadcasted. Please complete settlement to secure the slot.",
        read: false,
        createdAt: timestamp,
      });
      break;

    case EVENTS.PAYMENT_SUCCESS:
      await createNotification({
        id: `auto_pay_${uniqueId()}`,
        userId: payload.userId,
        title: "Settlement Verified",
        message: "Your session fee has been secured in escrow. The practitioner has been notified.",
        read: false,
        createdAt: timestamp,
      });
      break;

    case EVENTS.LAWYER_VIEWED:
      // Triggered if a user views a profile but hasn't booked yet
      await createNotification({
        id: `auto_view_${uniqueId()}`,
        userId: payload.userId,
        title: "Need Strategic Counsel?",
        message: `Secure an executive slot with ${payload.metadata?.lawyerName || 'the practitioner'} while availability lasts.`,
        read: false,
        createdAt: timestamp,
      });
      break;

    case EVENTS.INACTIVE_USER:
      await createNotification({
        id: `auto_inactive_${uniqueId()}`,
        userId: payload.userId,
        title: "Network Pulse",
        message: "New elite practitioners matching your profile have joined the network. Explore the marketplace.",
        read: false,
        createdAt: timestamp,
      });
      break;
  }
};
