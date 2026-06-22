/**
 * @file server/services/logistics-service.ts
 * @description The logistics engine application service: warehouses, carriers,
 * freight quoting (volumetric/chargeable-weight rating), shipment creation, an
 * append-only tracking timeline, container management and shipment lifecycle
 * transitions. Mutations are tenant-scoped, optimistic-locked, audited and emit
 * outbox events; tracking events are immutable.
 */
import { randomUUID } from 'crypto';
import {
  Prisma,
  Warehouse,
  Carrier,
  FreightQuote,
  LogisticsShipment,
  Container,
  ShipmentTrackingEvent,
} from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  warehouseRepository,
  carrierRepository,
  freightQuoteRepository,
  logisticsShipmentRepository,
  containerRepository,
  shipmentTrackingEventRepository,
  auditRepository,
  outboxRepository,
  WarehouseFilter,
  CarrierFilter,
  FreightQuoteFilter,
  ShipmentFilter,
  ContainerFilter,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { Money } from '../ledger/money';
import { rateFreight } from '../logistics/freight-rating';
import { resolveTrackingStatus, assertTransition, ShipmentTrackingError, type ShipmentStatus } from '../logistics/shipment-tracking';
import type { ActorContext } from './rule-service';
import {
  CreateWarehouseInput,
  CreateCarrierInput,
  QuoteFreightInput,
  CreateShipmentInput,
  TrackingEventInput,
  ShipmentTransitionInput,
  CreateContainerInput,
  AllocateContainerInput,
} from '../logistics/schemas';

type Page = { page: number; pageSize: number };

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}
function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function audit(
  tx: Prisma.TransactionClient,
  ctx: ActorContext,
  entityType: string,
  entityId: string,
  action: string,
  before: Prisma.InputJsonValue | undefined,
  after: Prisma.InputJsonValue,
  correlationId: string,
  outboxType: string,
  payload: Prisma.InputJsonValue,
): Promise<void> {
  await auditRepository.record(
    {
      organizationId: ctx.organizationId,
      entityType,
      entityId,
      action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      source: 'logistics',
      beforeState: before,
      afterState: after,
      correlationId,
      ip: ctx.ip ?? undefined,
    },
    tx,
  );
  await outboxRepository.enqueue(
    { organizationId: ctx.organizationId, eventType: outboxType, payload, correlationId, sequence: 0 },
    tx,
  );
}

export const logisticsService = {
  // ── Warehouses ───────────────────────────────────────────────────────────────
  async createWarehouse(ctx: ActorContext, input: CreateWarehouseInput): Promise<Warehouse> {
    const existing = await warehouseRepository.findByCode(ctx.organizationId, input.code);
    if (existing) throw new ValidationError(`WAREHOUSE_CODE_TAKEN: ${input.code}`);
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await warehouseRepository.create(
        {
          organizationId: ctx.organizationId,
          code: input.code,
          name: input.name,
          type: input.type ?? 'GENERAL',
          addressLine: input.addressLine ?? null,
          city: input.city ?? null,
          country: input.country ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          capacityUnits: input.capacityUnits ?? null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as Warehouse;
      await audit(tx, ctx, 'Warehouse', row.id, 'CREATE', undefined, snapshot(row), correlationId, 'WAREHOUSE_CREATED', { warehouseId: row.id, code: row.code } as Prisma.InputJsonValue);
      return row;
    });
    await flushOutbox();
    return created;
  },
  listWarehouses(ctx: ActorContext, filter: WarehouseFilter, page: Page) {
    return warehouseRepository.listScoped(ctx.organizationId, filter, page);
  },
  async getWarehouse(ctx: ActorContext, id: string): Promise<Warehouse> {
    const row = await warehouseRepository.findScopedById(id, ctx.organizationId);
    if (!row) throw new NotFoundError('Warehouse', id);
    return row;
  },

  // ── Carriers ─────────────────────────────────────────────────────────────────
  async createCarrier(ctx: ActorContext, input: CreateCarrierInput): Promise<Carrier> {
    const existing = await carrierRepository.findByCode(ctx.organizationId, input.code);
    if (existing) throw new ValidationError(`CARRIER_CODE_TAKEN: ${input.code}`);
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await carrierRepository.create(
        {
          organizationId: ctx.organizationId,
          code: input.code,
          name: input.name,
          mode: input.mode,
          scac: input.scac ?? null,
          iataCode: input.iataCode ?? null,
          services: input.services ? asJson(input.services) : undefined,
          rating: input.rating ?? null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as Carrier;
      await audit(tx, ctx, 'Carrier', row.id, 'CREATE', undefined, snapshot(row), correlationId, 'CARRIER_CREATED', { carrierId: row.id, code: row.code } as Prisma.InputJsonValue);
      return row;
    });
    await flushOutbox();
    return created;
  },
  listCarriers(ctx: ActorContext, filter: CarrierFilter, page: Page) {
    return carrierRepository.listScoped(ctx.organizationId, filter, page);
  },
  async getCarrier(ctx: ActorContext, id: string): Promise<Carrier> {
    const row = await carrierRepository.findScopedById(id, ctx.organizationId);
    if (!row) throw new NotFoundError('Carrier', id);
    return row;
  },

  // ── Freight quotes ─────────────────────────────────────────────────────────────
  async quoteFreight(ctx: ActorContext, input: QuoteFreightInput): Promise<FreightQuote> {
    const currency = Money.zero(input.currency).currency;
    const rating = rateFreight({
      mode: input.mode,
      weightKg: input.weightKg,
      volumeM3: input.volumeM3,
      ratePerKg: input.ratePerKg,
      minimumCharge: input.minimumCharge,
      surchargePct: input.surchargePct,
      volumetricFactorKgPerM3: input.volumetricFactorKgPerM3,
    });
    const base = Money.of(rating.baseAmount, currency);
    const surcharge = Money.of(rating.surchargeAmount, currency);
    const total = Money.of(rating.totalAmount, currency);

    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await freightQuoteRepository.create(
        {
          organizationId: ctx.organizationId,
          reference: input.reference ?? null,
          carrierId: input.carrierId ?? null,
          mode: input.mode,
          originCountry: input.originCountry ?? null,
          originPort: input.originPort ?? null,
          destinationCountry: input.destinationCountry ?? null,
          destinationPort: input.destinationPort ?? null,
          containerType: input.containerType ?? null,
          weightKg: input.weightKg ?? null,
          volumeM3: input.volumeM3 ?? null,
          chargeableWeightKg: rating.chargeableWeightKg,
          currency,
          baseAmount: base.toDecimalString(),
          surchargeAmount: surcharge.toDecimalString(),
          totalAmount: total.toDecimalString(),
          transitDays: input.transitDays ?? null,
          status: 'QUOTED',
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as FreightQuote;
      await audit(tx, ctx, 'FreightQuote', row.id, 'QUOTE', undefined, snapshot(row), correlationId, 'FREIGHT_QUOTED', { quoteId: row.id, total: row.totalAmount, currency } as Prisma.InputJsonValue);
      return row;
    });
    await flushOutbox();
    return created;
  },
  listQuotes(ctx: ActorContext, filter: FreightQuoteFilter, page: Page) {
    return freightQuoteRepository.listScoped(ctx.organizationId, filter, page);
  },
  async getQuote(ctx: ActorContext, id: string): Promise<FreightQuote> {
    const row = await freightQuoteRepository.findScopedById(id, ctx.organizationId);
    if (!row) throw new NotFoundError('FreightQuote', id);
    return row;
  },
  async acceptQuote(ctx: ActorContext, id: string, shipmentId?: string): Promise<FreightQuote> {
    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const quote = await freightQuoteRepository.findScopedById(id, ctx.organizationId, tx);
      if (!quote) throw new NotFoundError('FreightQuote', id);
      if (quote.status !== 'QUOTED') throw new ValidationError(`QUOTE_NOT_ACCEPTABLE: status is ${quote.status}`);
      const updated = (await freightQuoteRepository.updateWithLock(id, quote.version, { status: 'ACCEPTED', acceptedShipmentId: shipmentId ?? null }, tx)) as FreightQuote;
      await audit(tx, ctx, 'FreightQuote', id, 'ACCEPT', snapshot(quote), snapshot(updated), correlationId, 'FREIGHT_QUOTE_ACCEPTED', { quoteId: id, shipmentId: shipmentId ?? null } as Prisma.InputJsonValue);
      return updated;
    });
    await flushOutbox();
    return result;
  },

  // ── Shipments ────────────────────────────────────────────────────────────────
  async createShipment(ctx: ActorContext, input: CreateShipmentInput): Promise<LogisticsShipment> {
    if (input.reference) {
      const existing = await logisticsShipmentRepository.findByReference(ctx.organizationId, input.reference);
      if (existing) return existing; // idempotent
    }
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await logisticsShipmentRepository.create(
        {
          organizationId: ctx.organizationId,
          reference: input.reference ?? null,
          tradeId: input.tradeId ?? null,
          carrierId: input.carrierId ?? null,
          freightQuoteId: input.freightQuoteId ?? null,
          mode: input.mode,
          status: 'CREATED',
          trackingNumber: input.trackingNumber ?? null,
          originWarehouseId: input.originWarehouseId ?? null,
          destWarehouseId: input.destWarehouseId ?? null,
          originLocation: input.originLocation ?? null,
          destinationLocation: input.destinationLocation ?? null,
          incoterm: input.incoterm ?? null,
          etd: input.etd ? new Date(input.etd) : null,
          eta: input.eta ? new Date(input.eta) : null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as LogisticsShipment;
      await audit(tx, ctx, 'LogisticsShipment', row.id, 'CREATE', undefined, snapshot(row), correlationId, 'SHIPMENT_CREATED', { shipmentId: row.id, mode: row.mode } as Prisma.InputJsonValue);
      return row;
    });
    await flushOutbox();
    return created;
  },
  listShipments(ctx: ActorContext, filter: ShipmentFilter, page: Page) {
    return logisticsShipmentRepository.listScoped(ctx.organizationId, filter, page);
  },
  async getShipment(ctx: ActorContext, id: string): Promise<LogisticsShipment> {
    const row = await logisticsShipmentRepository.findScopedById(id, ctx.organizationId);
    if (!row) throw new NotFoundError('LogisticsShipment', id);
    return row;
  },

  /** Operator-driven shipment status transition (guarded by the transition graph). */
  async transitionShipment(ctx: ActorContext, id: string, input: ShipmentTransitionInput): Promise<LogisticsShipment> {
    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const before = await logisticsShipmentRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('LogisticsShipment', id);
      try {
        assertTransition(before.status as ShipmentStatus, input.status as ShipmentStatus);
      } catch (err) {
        if (err instanceof ShipmentTrackingError) throw new ValidationError(err.message);
        throw err;
      }
      const data: Record<string, unknown> = { status: input.status, lastLocation: input.location ?? before.lastLocation };
      if (input.status === 'DELIVERED') data.deliveredAt = new Date();
      const after = (await logisticsShipmentRepository.updateWithLock(id, before.version, data, tx)) as LogisticsShipment;
      await audit(tx, ctx, 'LogisticsShipment', id, `TRANSITION_${input.status}`, snapshot(before), snapshot(after), correlationId, 'SHIPMENT_TRANSITIONED', { shipmentId: id, fromStatus: before.status, toStatus: input.status, reason: input.reason ?? null } as Prisma.InputJsonValue);
      return after;
    });
    await flushOutbox();
    return result;
  },

  // ── Tracking ─────────────────────────────────────────────────────────────────
  async addTrackingEvent(ctx: ActorContext, shipmentId: string, input: TrackingEventInput): Promise<{ shipment: LogisticsShipment; event: ShipmentTrackingEvent; statusChanged: boolean }> {
    const correlationId = randomUUID();
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const result = await withTransaction(async (tx) => {
      const shipment = await logisticsShipmentRepository.findScopedById(shipmentId, ctx.organizationId, tx);
      if (!shipment) throw new NotFoundError('LogisticsShipment', shipmentId);

      const resolution = resolveTrackingStatus(shipment.status as ShipmentStatus, input.type);
      const seq = (await shipmentTrackingEventRepository.maxSequence(shipmentId, tx)) + 1;
      const event = await shipmentTrackingEventRepository.create(
        {
          organizationId: ctx.organizationId,
          shipmentId,
          sequence: seq,
          type: input.type,
          status: input.status ?? resolution.status,
          location: input.location ?? null,
          description: input.description ?? null,
          occurredAt,
          source: input.source ?? 'system',
          data: input.data ? asJson(input.data) : undefined,
          correlationId,
        },
        tx,
      );

      const updateData: Record<string, unknown> = { lastEventAt: occurredAt, lastLocation: input.location ?? shipment.lastLocation };
      if (resolution.changed) {
        updateData.status = resolution.status;
        if (resolution.status === 'DELIVERED') updateData.deliveredAt = occurredAt;
      }
      const updated = (await logisticsShipmentRepository.updateWithLock(shipmentId, shipment.version, updateData, tx)) as LogisticsShipment;

      await audit(tx, ctx, 'LogisticsShipment', shipmentId, 'TRACKING_EVENT', snapshot(shipment), snapshot(updated), correlationId, 'SHIPMENT_TRACKING_EVENT', { shipmentId, type: input.type, status: updated.status, statusChanged: resolution.changed, sequence: seq } as Prisma.InputJsonValue);
      return { shipment: updated, event, statusChanged: resolution.changed };
    });
    await flushOutbox();
    return result;
  },
  async listTracking(ctx: ActorContext, shipmentId: string, page: Page) {
    await this.getShipment(ctx, shipmentId); // tenant assertion
    return shipmentTrackingEventRepository.listByShipment(ctx.organizationId, shipmentId, page);
  },

  // ── Containers ─────────────────────────────────────────────────────────────────
  async createContainer(ctx: ActorContext, input: CreateContainerInput): Promise<Container> {
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await containerRepository.create(
        {
          organizationId: ctx.organizationId,
          containerNo: input.containerNo,
          type: input.type,
          sealNo: input.sealNo ?? null,
          status: input.warehouseId ? 'EMPTY' : 'EMPTY',
          warehouseId: input.warehouseId ?? null,
          grossWeightKg: input.grossWeightKg ?? null,
          tareWeightKg: input.tareWeightKg ?? null,
          cargoDescription: input.cargoDescription ?? null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as Container;
      await audit(tx, ctx, 'Container', row.id, 'CREATE', undefined, snapshot(row), correlationId, 'CONTAINER_CREATED', { containerId: row.id, containerNo: row.containerNo } as Prisma.InputJsonValue);
      return row;
    });
    await flushOutbox();
    return created;
  },
  /** Allocate/move a container to a shipment and/or warehouse and set its status. */
  async allocateContainer(ctx: ActorContext, id: string, input: AllocateContainerInput): Promise<Container> {
    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const before = await containerRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('Container', id);
      if (input.shipmentId) {
        const shipment = await logisticsShipmentRepository.findScopedById(input.shipmentId, ctx.organizationId, tx);
        if (!shipment) throw new NotFoundError('LogisticsShipment', input.shipmentId);
      }
      const data: Record<string, unknown> = {
        ...(input.shipmentId !== undefined ? { shipmentId: input.shipmentId ?? null } : {}),
        ...(input.warehouseId !== undefined ? { warehouseId: input.warehouseId ?? null } : {}),
        ...(input.sealNo !== undefined ? { sealNo: input.sealNo } : {}),
        status: input.status ?? (input.shipmentId ? 'ALLOCATED' : before.status),
      };
      const after = (await containerRepository.updateWithLock(id, before.version, data, tx)) as Container;
      await audit(tx, ctx, 'Container', id, 'ALLOCATE', snapshot(before), snapshot(after), correlationId, 'CONTAINER_ALLOCATED', { containerId: id, shipmentId: input.shipmentId ?? null, status: after.status } as Prisma.InputJsonValue);
      return after;
    });
    await flushOutbox();
    return result;
  },
  listContainers(ctx: ActorContext, filter: ContainerFilter, page: Page) {
    return containerRepository.listScoped(ctx.organizationId, filter, page);
  },
  async getContainer(ctx: ActorContext, id: string): Promise<Container> {
    const row = await containerRepository.findScopedById(id, ctx.organizationId);
    if (!row) throw new NotFoundError('Container', id);
    return row;
  },
};
