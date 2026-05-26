/**
 * @fileOverview Maison Event Handlers
 * Defines how specific modules react to global events.
 */

import { eventBus } from './bus';
import { StockManager } from '../inventory/stockManager';
import { sendEmailMock } from '../notifications/mock-engine';
import { workerEngine } from '../reliability/worker-engine';

/**
 * Initialize all core platform handlers
 * This unifies the previously disconnected logic chains.
 */
export function initializeGlobalHandlers() {
  
  // 1. Payment Reactions
  eventBus.subscribe('payment_success', async (event) => {
    const { orderId, amount, userId } = event.payload;
    
    // Step A: Trigger Order Confirmation
    await eventBus.publish({
      type: 'order_confirmed',
      source: 'orders',
      countryCode: event.countryCode,
      payload: { orderId, status: 'PAID' }
    });

    // Step B: Initialize Dispatch Job
    workerEngine.enqueue({
      type: 'NOTIF_DISPATCH',
      country: event.countryCode,
      payload: { userId, template: 'order_confirmation', orderId }
    });

    // Step C: Legacy Mock Notification
    sendEmailMock('client', `Maison Settlement Confirmed: ${amount} for Order ${orderId}.`, event.countryCode);
  });

  eventBus.subscribe('payment_failed', async (event) => {
    const { productId, quantity, orderId } = event.payload;
    
    // Step A: Auto-release stock back to the archive
    StockManager.releaseStock(productId, quantity);
    
    // Step B: Fail Order
    await eventBus.publish({
      type: 'order_failed',
      source: 'orders',
      countryCode: event.countryCode,
      payload: { orderId, reason: 'Settlement Rejected' }
    });
  });

  // 2. Inventory Management
  eventBus.subscribe('inventory_locked', async (event) => {
    // Log scarcity signals for AI
    await eventBus.publish({
      type: 'ai_insight_generated',
      source: 'inventory',
      countryCode: event.countryCode,
      payload: { 
        insight: `Inventory Contention Spike: ${event.payload.productId}`,
        confidence: 0.95
      }
    });
  });

  // 3. Logistics Pipeline
  eventBus.subscribe('shipment_dispatched', async (event) => {
    const { orderId, trackingId } = event.payload;
    sendEmailMock('client', `Institutional Dispatch Protocol Active. Tracking: ${trackingId}`, event.countryCode);
  });

  // 4. AI Strategic Signals
  eventBus.subscribe('ai_insight_generated', async (event) => {
    console.log(`%c[AI AUTOPILOT] 🧠 Strategic Insight: ${event.payload.insight}`, "color: #3B82F6;");
  });

  console.log("%c[INTEGRATION] 🔗 Global Event Handlers Active.", "color: #10b981; font-weight: bold;");
}
