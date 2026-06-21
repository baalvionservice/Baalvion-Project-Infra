/**
 * @file server/repositories/logistics-repository.ts
 * @description Persistence for the logistics engine: warehouses, carriers,
 * freight_quotes, logistics_shipments, containers and the append-only
 * shipment_tracking_events. All rows are tenant-owned and RLS-scoped.
 */
import {
  Warehouse,
  Carrier,
  FreightQuote,
  LogisticsShipment,
  Container,
  ShipmentTrackingEvent,
  Prisma,
} from '@prisma/client';
import { BaseRepository, client } from './base-repository';
import { prisma } from '../db/prisma';
import {
  ModelDelegate,
  PrismaTransaction,
  Paginated,
  PageRequest,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';

export type WarehouseCreateInput = Omit<Prisma.WarehouseUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type CarrierCreateInput = Omit<Prisma.CarrierUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type FreightQuoteCreateInput = Omit<Prisma.FreightQuoteUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type LogisticsShipmentCreateInput = Omit<Prisma.LogisticsShipmentUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type ContainerCreateInput = Omit<Prisma.ContainerUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type TrackingEventCreateInput = Omit<Prisma.ShipmentTrackingEventUncheckedCreateInput, 'id' | 'createdAt'>;

export interface WarehouseFilter { type?: string; country?: string; status?: string; search?: string }
export interface CarrierFilter { mode?: string; status?: string; search?: string }
export interface FreightQuoteFilter { status?: string; mode?: string; carrierId?: string }
export interface ShipmentFilter { status?: string; mode?: string; carrierId?: string; tradeId?: string }
export interface ContainerFilter { status?: string; shipmentId?: string; warehouseId?: string; search?: string }

function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}
function pageArgs(req: PageRequest): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, req.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export class WarehouseRepository extends BaseRepository<Warehouse> {
  protected readonly entityName = 'Warehouse';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Warehouse> {
    return client(tx).warehouse as unknown as ModelDelegate<Warehouse>;
  }
  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Warehouse | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }
  findByCode(organizationId: string, code: string, tx?: PrismaTransaction): Promise<Warehouse | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, code }) });
  }
  async listScoped(organizationId: string, filter: WarehouseFilter, req: PageRequest = {}): Promise<Paginated<Warehouse>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.WarehouseWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.type ? { type: filter.type as Warehouse['type'] } : {}),
      ...(filter.country ? { country: filter.country } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search ? { OR: [{ name: { contains: filter.search, mode: 'insensitive' } }, { code: { contains: filter.search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.warehouse.findMany({ where, orderBy: { code: 'asc' }, skip, take: pageSize }),
      prisma.warehouse.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export class CarrierRepository extends BaseRepository<Carrier> {
  protected readonly entityName = 'Carrier';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Carrier> {
    return client(tx).carrier as unknown as ModelDelegate<Carrier>;
  }
  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Carrier | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }
  findByCode(organizationId: string, code: string, tx?: PrismaTransaction): Promise<Carrier | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, code }) });
  }
  async listScoped(organizationId: string, filter: CarrierFilter, req: PageRequest = {}): Promise<Paginated<Carrier>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.CarrierWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.mode ? { mode: filter.mode as Carrier['mode'] } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search ? { OR: [{ name: { contains: filter.search, mode: 'insensitive' } }, { code: { contains: filter.search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.carrier.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
      prisma.carrier.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export class FreightQuoteRepository extends BaseRepository<FreightQuote> {
  protected readonly entityName = 'FreightQuote';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<FreightQuote> {
    return client(tx).freightQuote as unknown as ModelDelegate<FreightQuote>;
  }
  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<FreightQuote | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }
  async listScoped(organizationId: string, filter: FreightQuoteFilter, req: PageRequest = {}): Promise<Paginated<FreightQuote>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.FreightQuoteWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as FreightQuote['status'] } : {}),
      ...(filter.mode ? { mode: filter.mode as FreightQuote['mode'] } : {}),
      ...(filter.carrierId ? { carrierId: filter.carrierId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.freightQuote.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.freightQuote.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export class LogisticsShipmentRepository extends BaseRepository<LogisticsShipment> {
  protected readonly entityName = 'LogisticsShipment';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<LogisticsShipment> {
    return client(tx).logisticsShipment as unknown as ModelDelegate<LogisticsShipment>;
  }
  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<LogisticsShipment | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }
  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<LogisticsShipment | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, reference }) });
  }
  async listScoped(organizationId: string, filter: ShipmentFilter, req: PageRequest = {}): Promise<Paginated<LogisticsShipment>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.LogisticsShipmentWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as LogisticsShipment['status'] } : {}),
      ...(filter.mode ? { mode: filter.mode as LogisticsShipment['mode'] } : {}),
      ...(filter.carrierId ? { carrierId: filter.carrierId } : {}),
      ...(filter.tradeId ? { tradeId: filter.tradeId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.logisticsShipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.logisticsShipment.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export class ContainerRepository extends BaseRepository<Container> {
  protected readonly entityName = 'Container';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Container> {
    return client(tx).container as unknown as ModelDelegate<Container>;
  }
  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Container | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }
  async listScoped(organizationId: string, filter: ContainerFilter, req: PageRequest = {}): Promise<Paginated<Container>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.ContainerWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as Container['status'] } : {}),
      ...(filter.shipmentId ? { shipmentId: filter.shipmentId } : {}),
      ...(filter.warehouseId ? { warehouseId: filter.warehouseId } : {}),
      ...(filter.search ? { containerNo: { contains: filter.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.container.findMany({ where, orderBy: { containerNo: 'asc' }, skip, take: pageSize }),
      prisma.container.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export class ShipmentTrackingEventRepository {
  create(input: TrackingEventCreateInput, tx: PrismaTransaction): Promise<ShipmentTrackingEvent> {
    return tx.shipmentTrackingEvent.create({ data: input });
  }
  async maxSequence(shipmentId: string, tx?: PrismaTransaction): Promise<number> {
    const top = await (tx ?? prisma).shipmentTrackingEvent.findFirst({
      where: { shipmentId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return top?.sequence ?? 0;
  }
  async listByShipment(organizationId: string, shipmentId: string, req: PageRequest = {}): Promise<Paginated<ShipmentTrackingEvent>> {
    const { page, pageSize, skip } = pageArgs(req);
    const where: Prisma.ShipmentTrackingEventWhereInput = { organizationId, shipmentId };
    const [items, total] = await Promise.all([
      prisma.shipmentTrackingEvent.findMany({ where, orderBy: { sequence: 'asc' }, skip, take: pageSize }),
      prisma.shipmentTrackingEvent.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }
}

export const warehouseRepository = new WarehouseRepository();
export const carrierRepository = new CarrierRepository();
export const freightQuoteRepository = new FreightQuoteRepository();
export const logisticsShipmentRepository = new LogisticsShipmentRepository();
export const containerRepository = new ContainerRepository();
export const shipmentTrackingEventRepository = new ShipmentTrackingEventRepository();
