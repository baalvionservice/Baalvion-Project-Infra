/**
 * @fileOverview Order Service for Baalvion Mining Inc.
 * Handles bulk purchase orders and escrow state.
 */

export interface Order {
  id: string;
  product: string;
  seller: string;
  amount: string;
  status: 'SHIPPED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  escrow: 'HELD' | 'RELEASED' | 'DISPUTED';
  escrowProgress: number;
  date: string;
}

const MOCK_ORDERS: Order[] = [
  { 
    id: "ORD-9921", 
    product: "Iron Ore Fine (62% Fe)", 
    seller: "Global Mining Inc.", 
    amount: "$525,000", 
    status: "SHIPPED", 
    escrow: "HELD",
    escrowProgress: 60,
    date: "May 15, 2024" 
  },
  { 
    id: "ORD-9918", 
    product: "Copper Cathodes 99.99%", 
    seller: "Atlas Mining Co", 
    amount: "$1,840,000", 
    status: "PROCESSING", 
    escrow: "HELD",
    escrowProgress: 20,
    date: "May 12, 2024" 
  },
  { 
    id: "ORD-9882", 
    product: "Gold Bullion 1kg", 
    seller: "Blue Ridge Quarry", 
    amount: "$68,500", 
    status: "COMPLETED", 
    escrow: "RELEASED",
    escrowProgress: 100,
    date: "Apr 28, 2024" 
  }
];

export class OrderService {
  static async getOrders(): Promise<Order[]> {
    // API ENDPOINT: GET /api/orders
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_ORDERS), 500);
    });
  }
}
