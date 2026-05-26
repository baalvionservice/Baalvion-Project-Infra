
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Plus, 
  Play, 
  Trash2, 
  Settings2, 
  Zap, 
  ToggleRight,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/**
 * @fileOverview AutomationBuilder
 * No-code operational logic engine for system administrators.
 */
export default function AutomationBuilder() {
  const [rules, setRules] = useState([
    { id: 1, trigger: "Risk Score > 80", action: "Lock Account", active: true, priority: "High" },
    { id: 2, trigger: "Dispute Rate > 5%", action: "Flag Profile", active: true, priority: "Medium" },
    { id: 3, trigger: "Elite User Verified", action: "Notify Concierge", active: false, priority: "Low" },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
            <Cpu className="w-6 h-6 text-blue-600" /> Operational Automation Engine
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Configure event-driven protocols for network management.</p>
        </div>
        
        <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Define New Rule
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="bg-white border-slate-200 executive-card group overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  
                  <div className="flex items-center gap-8 flex-1">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol Trigger</p>
                      <p className="text-sm font-bold text-slate-900 italic">IF {rule.trigger}</p>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-slate-200" />
                    
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Action Executed</p>
                      <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">THEN {rule.action}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                  <div className="text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                    <Badge variant="outline" className={`text-[8px] uppercase font-bold py-0.5 ${
                      rule.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {rule.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Operational</span>
                    <Switch checked={rule.active} className="data-[state=checked]:bg-blue-600" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Play className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Engine Simulation</h4>
            <p className="text-xs text-slate-500 italic font-medium">Verify your automation rules against the sandbox ledger before deployment.</p>
          </div>
        </div>
        <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl px-8 h-11 font-bold uppercase text-[10px] tracking-widest">
          Initialize Sandbox Test
        </Button>
      </div>
    </div>
  );
}
