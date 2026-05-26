import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inventoryApi } from '@/lib/api/inventory';
import type { PaginationParams } from '@/lib/types/common.types';
import type { InventoryWarehouse } from '@/lib/types/order.types';

export const inventoryKeys = {
  warehouses: {
    all: (storeId: string) => ['inventory', storeId, 'warehouses'] as const,
    list: (storeId: string, p?: Record<string, unknown>) => ['inventory', storeId, 'warehouses', 'list', p] as const,
    detail: (storeId: string, id: string) => ['inventory', storeId, 'warehouses', 'detail', id] as const,
  },
  stock: {
    all: (storeId: string) => ['inventory', storeId, 'stock'] as const,
    list: (storeId: string, p?: Record<string, unknown>) => ['inventory', storeId, 'stock', 'list', p] as const,
  },
  movements: {
    list: (storeId: string, p?: Record<string, unknown>) => ['inventory', storeId, 'movements', p] as const,
  },
  shipping: {
    zones: (storeId: string) => ['fulfillment', storeId, 'zones'] as const,
    couriers: (storeId: string) => ['fulfillment', storeId, 'couriers'] as const,
    shipments: {
      all: (storeId: string) => ['fulfillment', storeId, 'shipments'] as const,
      list: (storeId: string, p?: Record<string, unknown>) => ['fulfillment', storeId, 'shipments', 'list', p] as const,
      detail: (storeId: string, id: string) => ['fulfillment', storeId, 'shipments', 'detail', id] as const,
    },
  },
};

// Warehouses

export const useWarehouses = (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
  useQuery({
    queryKey: inventoryKeys.warehouses.list(storeId, params),
    queryFn: () => inventoryApi.warehouses.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useWarehouse = (storeId: string, warehouseId: string) =>
  useQuery({
    queryKey: inventoryKeys.warehouses.detail(storeId, warehouseId),
    queryFn: () => inventoryApi.warehouses.get(storeId, warehouseId).then((r) => r.data.data),
    enabled: !!storeId && !!warehouseId,
  });

export const useCreateWarehouse = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InventoryWarehouse>) =>
      inventoryApi.warehouses.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.warehouses.all(storeId) });
      toast.success('Warehouse created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateWarehouse = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, payload }: { warehouseId: string; payload: Partial<InventoryWarehouse> }) =>
      inventoryApi.warehouses.update(storeId, warehouseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.warehouses.all(storeId) });
      toast.success('Warehouse updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteWarehouse = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => inventoryApi.warehouses.delete(storeId, warehouseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.warehouses.all(storeId) });
      toast.success('Warehouse deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Stock

export const useStock = (
  storeId: string,
  params?: PaginationParams & { warehouseId?: string; productId?: string; status?: string; sku?: string }
) =>
  useQuery({
    queryKey: inventoryKeys.stock.list(storeId, params),
    queryFn: () => inventoryApi.stock.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useAdjustStock = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      warehouseId,
      payload,
    }: {
      warehouseId: string;
      payload: { sku: string; productId: string; variantId?: string; quantity: number; type: string; reference?: string; notes?: string };
    }) => inventoryApi.stock.adjust(storeId, warehouseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.stock.all(storeId) });
      qc.invalidateQueries({ queryKey: inventoryKeys.movements.list(storeId) });
      toast.success('Stock adjusted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useStockMovements = (
  storeId: string,
  params?: PaginationParams & { warehouseId?: string; type?: string; sku?: string }
) =>
  useQuery({
    queryKey: inventoryKeys.movements.list(storeId, params),
    queryFn: () => inventoryApi.stock.movements(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

// Shipping

export const useShippingZones = (storeId: string, params?: PaginationParams) =>
  useQuery({
    queryKey: inventoryKeys.shipping.zones(storeId),
    queryFn: () => inventoryApi.shipping.zones.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
  });

export const useCreateShippingZone = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      inventoryApi.shipping.zones.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.shipping.zones(storeId) });
      toast.success('Shipping zone created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateShippingZone = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, payload }: { zoneId: string; payload: Record<string, unknown> }) =>
      inventoryApi.shipping.zones.update(storeId, zoneId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.shipping.zones(storeId) });
      toast.success('Zone updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useAddShippingRate = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, payload }: { zoneId: string; payload: Record<string, unknown> }) =>
      inventoryApi.shipping.zones.addRate(storeId, zoneId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.shipping.zones(storeId) });
      toast.success('Rate added');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useCouriers = (storeId: string) =>
  useQuery({
    queryKey: inventoryKeys.shipping.couriers(storeId),
    queryFn: () => inventoryApi.shipping.couriers.list(storeId).then((r) => r.data.data),
    enabled: !!storeId,
    staleTime: 10 * 60_000,
  });

export const useShipments = (
  storeId: string,
  params?: PaginationParams & { status?: string; orderId?: string }
) =>
  useQuery({
    queryKey: inventoryKeys.shipping.shipments.list(storeId, params),
    queryFn: () => inventoryApi.shipping.shipments.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useShipment = (storeId: string, shipmentId: string) =>
  useQuery({
    queryKey: inventoryKeys.shipping.shipments.detail(storeId, shipmentId),
    queryFn: () => inventoryApi.shipping.shipments.get(storeId, shipmentId).then((r) => r.data.data),
    enabled: !!storeId && !!shipmentId,
  });
