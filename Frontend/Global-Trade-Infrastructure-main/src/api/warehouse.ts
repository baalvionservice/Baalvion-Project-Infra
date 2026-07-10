/**
 * @file src/api/warehouse.ts
 * @description Warehouse Management System, Phase A — location hierarchy (zones/bins), receiving +
 * Goods Receipt Notes, and the rule-based putaway engine. Talks to trade-service's `/warehouse_zones`,
 * `/warehouse_bins`, `/goods_receipt_notes`, and `/putaway_tasks` via the real `tradeApi` path (same
 * `/trade-bff` -> auth-gateway -> trade-service `:3025` route every other domain in this file uses).
 *
 * Note: there is a separate, unrelated `src/app/api/logistics/warehouses/**` + `src/server/services/
 * logistics-service.ts` layer backed by this app's own local Prisma schema. It is unreferenced by any
 * page (confirmed dead scaffold) — this module intentionally does not use it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi, type Paginated } from './client';
import { qk } from './keys';

export type ZoneType = 'storage' | 'receiving' | 'staging' | 'packing' | 'hazmat' | 'cold_storage' | 'quarantine' | 'cross_dock';
export type TemperatureZone = 'ambient' | 'chilled' | 'frozen' | 'controlled';
export type BinType = 'aisle' | 'rack' | 'shelf' | 'bin';
export type AbcClass = 'A' | 'B' | 'C';
export type PutawayStrategy = 'fifo' | 'fefo' | 'abc' | 'capacity_first';
export type PutawayTaskStatus = 'pending' | 'suggested' | 'assigned' | 'completed' | 'cancelled';
export type GrnStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type GrnLineCondition = 'good' | 'damaged' | 'partial' | 'rejected';

export interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  warehouseType: string;
  status: string;
  capacityUnits: number | null;
  usedUnits: number;
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  code: string | null;
  name: string;
  zoneType: ZoneType;
  temperatureZone: TemperatureZone | null;
  hazardClass: string | null;
  capacityUnits: number | null;
  usedUnits: number;
  sequenceOrder: number;
  status: string;
  barcode: string | null;
  qrPayload: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseBin {
  id: string;
  warehouseId: string;
  zoneId: string;
  parentBinId: string | null;
  binType: BinType;
  code: string | null;
  name: string | null;
  path: string | null;
  capacityWeightKg: number | null;
  capacityVolumeCbm: number | null;
  capacityUnits: number | null;
  usedWeightKg: number;
  usedVolumeCbm: number;
  usedUnits: number;
  temperatureZone: TemperatureZone | null;
  hazardClass: string | null;
  abcClass: AbcClass | null;
  status: string;
  barcode: string | null;
  qrPayload: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLine {
  id: string;
  grnId: string;
  packageId: string | null;
  putawayTaskId: string | null;
  sku: string | null;
  description: string | null;
  expectedQuantity: number | null;
  receivedQuantity: number;
  unit: string;
  condition: GrnLineCondition;
  lotNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  weightKg: number | null;
  volumeCbm: number | null;
  hazardClass: string | null;
  temperatureRequirement: string | null;
  metadata: Record<string, unknown>;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  warehouseId: string;
  purchaseOrderId: string | null;
  shipmentId: string | null;
  supplierReference: string | null;
  status: GrnStatus;
  receivedBy: string | null;
  receivedAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lines?: GoodsReceiptLine[];
}

export interface PutawayTask {
  id: string;
  warehouseId: string;
  grnLineId: string | null;
  packageId: string | null;
  suggestedBinId: string | null;
  assignedBinId: string | null;
  status: PutawayTaskStatus;
  strategy: 'rule_based' | 'manual_override';
  quantity: number;
  unit: string;
  reasonCodes: string[];
  overrideReason: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PutawaySuggestion {
  binId: string;
  score: number;
  scoreBreakdown: { capacityFit: number; affinity: number };
  reasonCodes: string[];
}

export interface SuggestPutawayBody {
  warehouseId: string;
  grnLineId?: string;
  packageId?: string;
  zoneId?: string;
  quantity: number;
  unit?: string;
  weightKg?: number;
  volumeCbm?: number;
  hazardClass?: string;
  temperatureRequirement?: string;
  abcClass?: AbcClass;
  lotNumber?: string;
  expiryDate?: string;
  strategy?: PutawayStrategy;
}

export interface CreateZoneBody {
  warehouseId: string;
  name: string;
  code?: string;
  zoneType?: ZoneType;
  temperatureZone?: TemperatureZone;
  hazardClass?: string;
  capacityUnits?: number;
}

export interface CreateBinBody {
  warehouseId: string;
  zoneId: string;
  parentBinId?: string;
  binType?: BinType;
  code?: string;
  name?: string;
  capacityWeightKg?: number;
  capacityVolumeCbm?: number;
  capacityUnits?: number;
  temperatureZone?: TemperatureZone;
  hazardClass?: string;
  abcClass?: AbcClass;
}

/** Same-origin URL for an <img>/<embed> to render a zone/bin's QR label — a raw image/svg+xml
 * response, not the JSON envelope, so it is fetched directly rather than through `tradeApi`. */
export const zoneLabelUrl = (id: string) => `/trade-bff/warehouse_zones/${id}/label`;
export const binLabelUrl = (id: string) => `/trade-bff/warehouse_bins/${id}/label`;

export const warehouseApi = {
  // Pre-existing trade-service resource (Logistics Core Foundation, Phase 2) — the parent
  // record every zone/bin/GRN below belongs to. Included here (not a separate api file)
  // since Phase A's UI is the first frontend surface to need a warehouse picker.
  listWarehouses: (params: { status?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<Warehouse>('/warehouses', params),

  listZones: (params: { warehouseId?: string; zoneType?: string; status?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<WarehouseZone>('/warehouse_zones', params),
  getZone: (id: string) => tradeApi.get<WarehouseZone>(`/warehouse_zones/${id}`),
  createZone: (body: CreateZoneBody) => tradeApi.post<WarehouseZone>('/warehouse_zones', body),
  updateZone: (id: string, body: Partial<CreateZoneBody>) => tradeApi.patch<WarehouseZone>(`/warehouse_zones/${id}`, body),

  listBins: (params: { warehouseId?: string; zoneId?: string; parentBinId?: string; binType?: string; status?: string; page?: number; limit?: number } = {}) =>
    tradeApi.list<WarehouseBin>('/warehouse_bins', params),
  getBin: (id: string) => tradeApi.get<WarehouseBin>(`/warehouse_bins/${id}`),
  createBin: (body: CreateBinBody) => tradeApi.post<WarehouseBin>('/warehouse_bins', body),
  updateBin: (id: string, body: Partial<CreateBinBody>) => tradeApi.patch<WarehouseBin>(`/warehouse_bins/${id}`, body),

  listGrns: (params: { warehouseId?: string; status?: GrnStatus; page?: number; limit?: number } = {}) =>
    tradeApi.list<GoodsReceiptNote>('/goods_receipt_notes', params),
  getGrn: (id: string) => tradeApi.get<GoodsReceiptNote>(`/goods_receipt_notes/${id}`),
  createGrn: (body: { warehouseId: string; purchaseOrderId?: string; shipmentId?: string; supplierReference?: string }) =>
    tradeApi.post<GoodsReceiptNote>('/goods_receipt_notes', body),
  addGrnLine: (grnId: string, body: Partial<GoodsReceiptLine>) =>
    tradeApi.post<GoodsReceiptLine>(`/goods_receipt_notes/${grnId}/lines`, body),
  updateGrnLine: (grnId: string, lineId: string, body: Partial<GoodsReceiptLine>) =>
    tradeApi.patch<GoodsReceiptLine>(`/goods_receipt_notes/${grnId}/lines/${lineId}`, body),
  completeGrn: (id: string) => tradeApi.post<GoodsReceiptNote>(`/goods_receipt_notes/${id}/complete`),
  cancelGrn: (id: string) => tradeApi.post<GoodsReceiptNote>(`/goods_receipt_notes/${id}/cancel`),

  listPutawayTasks: (params: { warehouseId?: string; status?: PutawayTaskStatus; page?: number; limit?: number } = {}) =>
    tradeApi.list<PutawayTask>('/putaway_tasks', params),
  getPutawayTask: (id: string) => tradeApi.get<PutawayTask>(`/putaway_tasks/${id}`),
  suggestPutaway: (body: SuggestPutawayBody) =>
    tradeApi.post<{ task: PutawayTask; suggestions: PutawaySuggestion[]; warnings: string[] }>('/putaway_tasks/suggest', body),
  assignPutaway: (id: string, body: { binId: string; overrideReason?: string }) =>
    tradeApi.post<PutawayTask>(`/putaway_tasks/${id}/assign`, body),
  completePutaway: (id: string) => tradeApi.post<PutawayTask>(`/putaway_tasks/${id}/complete`),
};

export function useWarehouses(params: Parameters<typeof warehouseApi.listWarehouses>[0] = {}) {
  return useQuery<Paginated<Warehouse>>({
    queryKey: [...qk.warehouse.all, 'warehouses', params],
    queryFn: () => warehouseApi.listWarehouses(params),
  });
}

// ── Zones ─────────────────────────────────────────────────────────────────
export function useZones(params: Parameters<typeof warehouseApi.listZones>[0] = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<WarehouseZone>>({
    queryKey: qk.warehouse.zones(params),
    queryFn: () => warehouseApi.listZones(params),
    enabled: opts.enabled ?? true,
  });
}

export function useZone(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.warehouse.zoneDetail(id), queryFn: () => warehouseApi.getZone(id), enabled: (opts.enabled ?? true) && !!id });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneBody) => warehouseApi.createZone(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.warehouse.all }),
  });
}

// ── Bins ──────────────────────────────────────────────────────────────────
export function useBins(params: Parameters<typeof warehouseApi.listBins>[0] = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<WarehouseBin>>({
    queryKey: qk.warehouse.bins(params),
    queryFn: () => warehouseApi.listBins(params),
    enabled: opts.enabled ?? true,
  });
}

export function useBin(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.warehouse.binDetail(id), queryFn: () => warehouseApi.getBin(id), enabled: (opts.enabled ?? true) && !!id });
}

export function useCreateBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBinBody) => warehouseApi.createBin(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.warehouse.all }),
  });
}

// ── Receiving / GRN ───────────────────────────────────────────────────────
export function useGrns(params: Parameters<typeof warehouseApi.listGrns>[0] = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<GoodsReceiptNote>>({
    queryKey: qk.warehouse.grns(params),
    queryFn: () => warehouseApi.listGrns(params),
    enabled: opts.enabled ?? true,
  });
}

export function useGrn(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: qk.warehouse.grnDetail(id), queryFn: () => warehouseApi.getGrn(id), enabled: (opts.enabled ?? true) && !!id });
}

export function useCreateGrn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof warehouseApi.createGrn>[0]) => warehouseApi.createGrn(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.warehouse.all }),
  });
}

export function useAddGrnLine(grnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<GoodsReceiptLine>) => warehouseApi.addGrnLine(grnId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.warehouse.grnDetail(grnId) }),
  });
}

export function useCompleteGrn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseApi.completeGrn(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: qk.warehouse.grnDetail(id) });
      void qc.invalidateQueries({ queryKey: qk.warehouse.all });
    },
  });
}

export function useCancelGrn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseApi.cancelGrn(id),
    onSuccess: (_data, id) => void qc.invalidateQueries({ queryKey: qk.warehouse.grnDetail(id) }),
  });
}

// ── Putaway ───────────────────────────────────────────────────────────────
export function usePutawayTasks(params: Parameters<typeof warehouseApi.listPutawayTasks>[0] = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<PutawayTask>>({
    queryKey: qk.warehouse.putawayTasks(params),
    queryFn: () => warehouseApi.listPutawayTasks(params),
    enabled: opts.enabled ?? true,
  });
}

export function usePutawayTask(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.warehouse.putawayDetail(id),
    queryFn: () => warehouseApi.getPutawayTask(id),
    enabled: (opts.enabled ?? true) && !!id,
  });
}

export function useSuggestPutaway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SuggestPutawayBody) => warehouseApi.suggestPutaway(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.warehouse.all }),
  });
}

export function useAssignPutaway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; binId: string; overrideReason?: string }) =>
      warehouseApi.assignPutaway(vars.id, { binId: vars.binId, overrideReason: vars.overrideReason }),
    onSuccess: (_data, vars) => void qc.invalidateQueries({ queryKey: qk.warehouse.putawayDetail(vars.id) }),
  });
}

export function useCompletePutaway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseApi.completePutaway(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: qk.warehouse.putawayDetail(id) });
      void qc.invalidateQueries({ queryKey: qk.warehouse.all });
    },
  });
}
