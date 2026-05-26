"use client";

import React, { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark, Smartphone, ShieldCheck } from "lucide-react";

interface PaymentMethodsProps {
  onSelect: (method: any) => void;
}

/**
 * @fileOverview PaymentMethods
 * Professional selection UI for authorized payment protocols.
 */
export default function PaymentMethods({ onSelect }: PaymentMethodsProps) {
  const [selected, setSelected] = useState("upi");

  const handleChange = (value: string) => {
    setSelected(value);
    onSelect(value);
  };

  const methods = [
    { id: "upi", label: "Unified Payments (UPI)", icon: <Smartphone className="w-4 h-4" /> },
    { id: "card", label: "Credit / Debit Card", icon: <CreditCard className="w-4 h-4" /> },
    { id: "netbanking", label: "Executive Netbanking", icon: <Landmark className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Select Settlement Protocol
        </h3>
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Encrypted E2E
        </span>
      </div>

      <RadioGroup defaultValue="upi" onValueChange={handleChange} className="grid gap-3">
        {methods.map((m) => (
          <div key={m.id}>
            <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
            <Label
              htmlFor={m.id}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                selected === m.id
                  ? "bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5"
                  : "glass-panel border-white/5 hover:bg-white/5 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected === m.id ? "bg-accent/20" : "bg-white/5"}`}>
                  {m.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">{m.label}</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected === m.id ? "border-accent" : "border-muted-foreground/20"}`}>
                {selected === m.id && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
