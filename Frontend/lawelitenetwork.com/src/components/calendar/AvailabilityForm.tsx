"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { setAvailability, getAvailabilityByLawyer } from "@/services/availabilityService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Calendar, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

/**
 * @fileOverview AvailabilityForm
 * High-fidelity scheduling component for elite practitioners.
 */
export default function AvailabilityForm() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const availableSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    if (!date) {
      toast({ 
        title: "Date Required", 
        description: "Please select a calendar date for the executive slots.", 
        variant: "destructive" 
      });
      return;
    }
    if (selectedSlots.length === 0) {
      toast({ 
        title: "No Slots Selected", 
        description: "Please select at least one executive slot.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      await setAvailability({
        lawyerId: user.id,
        date,
        slots: selectedSlots,
      });

      toast({ 
        title: "Chambers Synchronized", 
        description: `Availability for ${new Date(date).toLocaleDateString()} has been updated across the network.` 
      });
    } catch (error) {
      toast({ 
        title: "Protocol Error", 
        description: "Unable to synchronize availability. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        <Label htmlFor="date" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Calendar className="w-3 h-3 text-accent" /> Select Target Date
        </Label>
        <Input
          id="date"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          className="glass-panel border-white/10 h-12 text-white"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Clock className="w-3 h-3 text-accent" /> Executive Time Slots
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => toggleSlot(slot)}
              className={`h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                selectedSlots.includes(slot)
                  ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-[1.02]"
                  : "glass-panel border-white/5 hover:bg-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              {selectedSlots.includes(slot) ? <CheckCircle2 className="w-3 h-3" /> : null}
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-14 rounded-2xl font-bold shadow-xl shadow-accent/10 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              SYNCHRONIZING PROTOCOLS...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              COMMIT AVAILABILITY
            </>
          )}
        </Button>
        <p className="mt-4 text-[9px] text-muted-foreground text-center italic uppercase tracking-tighter flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-accent/50" /> Updates are reflected instantly in the global discovery marketplace.
        </p>
      </div>
    </div>
  );
}
