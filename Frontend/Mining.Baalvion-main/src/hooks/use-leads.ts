"use client"

import { useState, useEffect } from "react";
import { LeadService, type Lead } from "@/services/lead-service";

export type { Lead };

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await LeadService.getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return { leads, setLeads, loading, refreshLeads: fetchLeads };
}
