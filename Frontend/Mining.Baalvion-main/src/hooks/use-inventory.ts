"use client"

import { useState, useEffect } from "react";
import { InventoryService, type Listing } from "@/services/inventory-service";

export type { Listing };

export function useInventory() {
  const [inventory, setInventory] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await InventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return { inventory, setInventory, loading, refreshInventory: fetchInventory };
}
