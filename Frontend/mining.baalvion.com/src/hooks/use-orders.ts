"use client"

import { useState, useEffect } from "react";
import { OrderService, type Order } from "@/services/order-service";

export type { Order };

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, setOrders, loading, refreshOrders: fetchOrders };
}
