/**
 * @fileOverview Inventory Service for Baalvion Mining Inc.
 * Manages mineral listings and stock levels.
 */

export interface Listing {
  id: string;
  type: string;
  grade: string;
  quantity: string;
  status: 'Active' | 'Sold Out' | 'Draft' | 'Flagged';
}

const MOCK_INVENTORY: Listing[] = [
  { id: "L-101", type: "Gold Ore", grade: "98%", quantity: "500 MT", status: "Active" },
  { id: "L-102", type: "Iron Ore", grade: "62% Fe", quantity: "2000 MT", status: "Active" },
  { id: "L-103", type: "Lithium", grade: "SC 6.0", quantity: "150 MT", status: "Sold Out" },
];

export class InventoryService {
  static async getInventory(): Promise<Listing[]> {
    // API ENDPOINT: GET /api/inventory/listings
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_INVENTORY), 500);
    });
  }

  static async createListing(data: any): Promise<void> {
    // API ENDPOINT: POST /api/inventory/listings
    console.log(`[Service] Creating listing`, data);
  }
}
