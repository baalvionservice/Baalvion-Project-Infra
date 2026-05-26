/**
 * @fileOverview Production-Grade Logistics & Dispatch Engine (Mock)
 * Simulates real-world courier interaction and tracking lifecycle.
 */

import { Shipment, ShipmentStatus, CountryCode } from '../types';

export class LogisticsEngine {
  private static COURIERS: Record<CountryCode, string[]> = {
    us: ['FedEx Custom Critical', 'UPS Express Saver'],
    uk: ['Royal Mail Special Delivery', 'DHL Heritage'],
    ae: ['Aramex VIP', 'Maison Private Courier'],
    in: ['BlueDart Apex', 'Professional Logistics'],
    sg: ['SingPost Platinum', 'DHL Global']
  };

  /**
   * Generates a new institutional shipment record
   */
  static createShipment(orderId: string, userId: string, country: CountryCode): Shipment {
    const shipmentId = `shp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const courier = this.COURIERS[country][0];
    const trackingId = `TRK-${Math.random().toString(10).substr(2, 12)}`;

    return {
      id: shipmentId,
      orderId,
      userId,
      country,
      courierName: courier,
      trackingId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'pending',
          location: 'Central Atelier Registry',
          timestamp: new Date().toISOString(),
          message: 'Acquisition registered for dispatch protocol.'
        }
      ]
    };
  }

  /**
   * Simulates a lifecycle update from an external courier API
   */
  static generateTrackingUpdate(currentStatus: ShipmentStatus): { status: ShipmentStatus; message: string } {
    const flow: ShipmentStatus[] = ['pending', 'packed', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'];
    const currentIndex = flow.indexOf(currentStatus);
    
    if (currentIndex === -1 || currentIndex === flow.length - 1) {
      return { status: currentStatus, message: 'Maintenance of current status.' };
    }

    const nextStatus = flow[currentIndex + 1];
    const messages: Record<ShipmentStatus, string> = {
      pending: 'Awaiting atelier preparation.',
      packed: 'Artifact secured in archival packaging.',
      dispatched: 'Handed to jurisdictional courier.',
      in_transit: 'In global archival transit.',
      out_for_delivery: 'Specialist courier approaching destination.',
      delivered: 'Artifact successfully guarded by collector.',
      failed: 'Dispatch exception: Address unreachable.',
      returned: 'Restored to regional hub.'
    };

    return {
      status: nextStatus,
      message: messages[nextStatus]
    };
  }
}
