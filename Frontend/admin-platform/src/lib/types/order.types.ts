export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'closed';

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip?: string;
  countryCode: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  variantId?: string | null;
  sku: string;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
  taxAmount: number;
  fulfillableQuantity: number;
  fulfilledQuantity: number;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  provider: string;
  transactionId?: string;
  amount: number;
  currencyCode: string;
  status: string;
  paidAt?: string | null;
}

export interface Order {
  id: string;
  storeId: string;
  customerId?: string | null;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  currencyCode: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  discountCode?: string | null;
  notes?: string;
  tags: string[];
  shippingAddress?: OrderAddress | null;
  billingAddress?: OrderAddress | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items?: OrderItem[];
  payments?: OrderPayment[];
  customer?: OrderCustomer;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCustomer {
  id: string;
  storeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  customerId?: string | null;
  storeId: string;
  returnNumber: string;
  status: ReturnStatus;
  reason: string;
  notes?: string;
  totalRefund: number;
  processedAt?: string | null;
  items?: Array<{ id: string; orderItemId: string; quantity: number; reason?: string; condition: string; refundAmount: number }>;
  createdAt: string;
}

export interface InventoryWarehouse {
  id: string;
  storeId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  countryCode: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface InventoryStockItem {
  id: string;
  warehouseId: string;
  storeId: string;
  productId: string;
  variantId?: string | null;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  warehouse?: Pick<InventoryWarehouse, 'id' | 'name' | 'code'>;
}
