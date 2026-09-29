import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersApi } from '@/lib/api/orders';
import type { PaginationParams } from '@/lib/types/common.types';
import type { Order, OrderCustomer } from '@/lib/types/order.types';

export const orderKeys = {
  orders: {
    all: (storeId: string) => ['orders', storeId, 'orders'] as const,
    list: (storeId: string, p?: Record<string, unknown>) => ['orders', storeId, 'orders', 'list', p] as const,
    detail: (storeId: string, id: string) => ['orders', storeId, 'orders', 'detail', id] as const,
  },
  customers: {
    all: (storeId: string) => ['orders', storeId, 'customers'] as const,
    list: (storeId: string, p?: Record<string, unknown>) => ['orders', storeId, 'customers', 'list', p] as const,
    detail: (storeId: string, id: string) => ['orders', storeId, 'customers', 'detail', id] as const,
  },
  returns: {
    all: (storeId: string) => ['orders', storeId, 'returns'] as const,
    list: (storeId: string, p?: Record<string, unknown>) => ['orders', storeId, 'returns', 'list', p] as const,
  },
};

// Orders

export const useOrders = (
  storeId: string,
  params?: PaginationParams & { status?: string; paymentStatus?: string; customerId?: string }
) =>
  useQuery({
    queryKey: orderKeys.orders.list(storeId, params),
    queryFn: () => ordersApi.orders.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useOrder = (storeId: string, orderId: string) =>
  useQuery({
    queryKey: orderKeys.orders.detail(storeId, orderId),
    queryFn: () => ordersApi.orders.get(storeId, orderId).then((r) => r.data.data),
    enabled: !!storeId && !!orderId,
  });

export const useUpdateOrderStatus = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      ordersApi.orders.updateStatus(storeId, orderId, status),
    onSuccess: (res, { orderId }) => {
      qc.setQueryData(orderKeys.orders.detail(storeId, orderId), res.data.data);
      qc.invalidateQueries({ queryKey: orderKeys.orders.all(storeId) });
      toast.success('Order status updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useCancelOrder = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      ordersApi.orders.cancel(storeId, orderId, reason),
    onSuccess: (res, { orderId }) => {
      qc.setQueryData(orderKeys.orders.detail(storeId, orderId), res.data.data);
      qc.invalidateQueries({ queryKey: orderKeys.orders.all(storeId) });
      toast.success('Order cancelled');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRecordPayment = (storeId: string, orderId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      ordersApi.orders.recordPayment(storeId, orderId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.orders.detail(storeId, orderId) });
      toast.success('Payment recorded');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Customers

export const useCustomers = (storeId: string, params?: PaginationParams & { isActive?: boolean }) =>
  useQuery({
    queryKey: orderKeys.customers.list(storeId, params),
    queryFn: () => ordersApi.customers.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useCustomer = (storeId: string, customerId: string) =>
  useQuery({
    queryKey: orderKeys.customers.detail(storeId, customerId),
    queryFn: () => ordersApi.customers.get(storeId, customerId).then((r) => r.data.data),
    enabled: !!storeId && !!customerId,
  });

export const useUpdateCustomer = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, payload }: { customerId: string; payload: Partial<OrderCustomer> }) =>
      ordersApi.customers.update(storeId, customerId, payload),
    onSuccess: (res, { customerId }) => {
      qc.setQueryData(orderKeys.customers.detail(storeId, customerId), res.data.data);
      qc.invalidateQueries({ queryKey: orderKeys.customers.all(storeId) });
      toast.success('Customer updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Returns

export const useReturns = (
  storeId: string,
  params?: PaginationParams & { status?: string; orderId?: string }
) =>
  useQuery({
    queryKey: orderKeys.returns.list(storeId, params),
    queryFn: () => ordersApi.returns.list(storeId, params).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useCreateReturn = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => ordersApi.returns.create(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.returns.all(storeId) });
      toast.success('Return created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateReturnStatus = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ returnId, status }: { returnId: string; status: 'approved' | 'rejected' | 'received' | 'refunded' | 'closed' }) =>
      ordersApi.returns.updateStatus(storeId, returnId, status as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.returns.all(storeId) });
      toast.success('Return status updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
