/**
 * @file server/logistics/schemas.ts
 * @description Zod validators for the logistics API boundary.
 */
import { z } from 'zod';

const currency = z.string().regex(/^[A-Za-z]{3}$/, 'must be a 3-letter ISO currency code');
const mode = z.enum(['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL']);
const nonNeg = z.number().nonnegative();

export const createWarehouseSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(256),
  type: z.enum(['GENERAL', 'DISTRIBUTION', 'BONDED', 'COLD_STORAGE', 'FULFILLMENT', 'CROSS_DOCK']).optional(),
  addressLine: z.string().max(512).optional(),
  city: z.string().max(128).optional(),
  country: z.string().max(64).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  capacityUnits: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createCarrierSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(256),
  mode,
  scac: z.string().max(16).optional(),
  iataCode: z.string().max(16).optional(),
  services: z.record(z.string(), z.unknown()).optional(),
  rating: z.number().min(0).max(5).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const quoteFreightSchema = z.object({
  reference: z.string().min(1).max(128).optional(),
  carrierId: z.string().uuid().optional(),
  mode,
  originCountry: z.string().max(64).optional(),
  originPort: z.string().max(128).optional(),
  destinationCountry: z.string().max(64).optional(),
  destinationPort: z.string().max(128).optional(),
  containerType: z.string().max(32).optional(),
  weightKg: nonNeg.optional(),
  volumeM3: nonNeg.optional(),
  ratePerKg: nonNeg,
  minimumCharge: nonNeg.optional(),
  surchargePct: z.number().min(0).max(100).optional(),
  volumetricFactorKgPerM3: z.number().positive().optional(),
  currency,
  transitDays: z.number().int().nonnegative().optional(),
  validUntil: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createShipmentSchema = z.object({
  reference: z.string().min(1).max(128).optional(),
  tradeId: z.string().uuid().optional(),
  carrierId: z.string().uuid().optional(),
  freightQuoteId: z.string().uuid().optional(),
  mode,
  trackingNumber: z.string().max(128).optional(),
  originWarehouseId: z.string().uuid().optional(),
  destWarehouseId: z.string().uuid().optional(),
  originLocation: z.string().max(256).optional(),
  destinationLocation: z.string().max(256).optional(),
  incoterm: z.string().max(16).optional(),
  etd: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const trackingEventSchema = z.object({
  type: z.string().min(1).max(64),
  status: z.string().max(64).optional(),
  location: z.string().max(256).optional(),
  description: z.string().max(1000).optional(),
  occurredAt: z.string().datetime().optional(),
  source: z.string().max(64).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const shipmentTransitionSchema = z.object({
  status: z.enum(['BOOKED', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS_HOLD', 'DELIVERED', 'EXCEPTION', 'CANCELLED']),
  location: z.string().max(256).optional(),
  reason: z.string().max(500).optional(),
});

export const createContainerSchema = z.object({
  containerNo: z.string().min(1).max(32),
  type: z.string().min(1).max(16),
  sealNo: z.string().max(32).optional(),
  warehouseId: z.string().uuid().optional(),
  grossWeightKg: nonNeg.optional(),
  tareWeightKg: nonNeg.optional(),
  cargoDescription: z.string().max(512).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const allocateContainerSchema = z.object({
  shipmentId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.enum(['EMPTY', 'ALLOCATED', 'LOADING', 'LOADED', 'IN_TRANSIT', 'DISCHARGED', 'RETURNED']).optional(),
  sealNo: z.string().max(32).optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type CreateCarrierInput = z.infer<typeof createCarrierSchema>;
export type QuoteFreightInput = z.infer<typeof quoteFreightSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type TrackingEventInput = z.infer<typeof trackingEventSchema>;
export type ShipmentTransitionInput = z.infer<typeof shipmentTransitionSchema>;
export type CreateContainerInput = z.infer<typeof createContainerSchema>;
export type AllocateContainerInput = z.infer<typeof allocateContainerSchema>;
