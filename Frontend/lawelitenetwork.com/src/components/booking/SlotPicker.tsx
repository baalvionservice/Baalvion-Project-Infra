"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import { getAvailabilityByLawyer } from '@/services/availabilityService';

interface SlotPickerProps {
  selectedSlot: string;
  onSelect: (slot: string) => void;
  lawyerId?: string;
  date?: string;
}

/**
 * @fileOverview SlotPicker
 * Professional time selection component. Dynamically syncs with practitioner schedules.
 */
export default function SlotPicker({ selectedSlot, onSelect, lawyerId, date }: SlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  useEffect(() => {
    const loadSlots = async () => {
      if (lawyerId && date) {
        setLoading(true);
        try {
          const availability = await getAvailabilityByLawyer(lawyerId);
          const dateMatch = availability.find((a) => a.date === date);
          setAvailableSlots(dateMatch ? dateMatch.slots : []);
        } catch (e) {
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableSlots(defaultSlots);
      }
    };

    loadSlots();
  }, [lawyerId, date]);

  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-3 glass-panel rounded-2xl border-white/5">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Availability Ledger...</p>
      </div>
    );
  }

  if (lawyerId && date && availableSlots.length === 0) {
    return (
      <div className="py-8 text-center glass-panel rounded-2xl border-accent/20 bg-accent/5">
        <AlertCircle className="w-6 h-6 text-accent mx-auto mb-2 opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">No Active Slots Defined</p>
        <p className="text-[9px] text-muted-foreground italic mt-1">Please select another date for this practitioner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Clock className="w-3 h-3 text-accent" />
        Available Executive Slots
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {availableSlots.map((slot) => (
          <Button
            key={slot}
            variant={selectedSlot === slot ? "default" : "outline"}
            onClick={() => onSelect(slot)}
            className={`h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              selectedSlot === slot 
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-[1.02]" 
                : "glass-panel border-white/5 hover:bg-white/5"
            }`}
          >
            {slot}
          </Button>
        ))}
      </div>
    </div>
  );
}
