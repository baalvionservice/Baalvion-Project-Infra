
"use client";

import React, { useState } from "react";
import { 
  Users, 
  Briefcase, 
  ShieldAlert, 
  ShieldCheck, 
  History,
  Settings2,
  Cpu,
  Fingerprint,
  BookOpen,
  LayoutGrid,
  Radio,
  LifeBuoy,
  Link as LinkIcon
} from "lucide-react";

interface AdminTabsProps {
  children: (tab: string) => React.ReactNode;
}

/**
 * @fileOverview AdminTabs V4
 * Updated with Link Intelligence Hub for managing SEO mappings.
 */
export default function AdminTabs({ children }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Members", icon: <Users className="w-4 h-4" /> },
    { id: "lawyers", label: "Verifications", icon: <Fingerprint className="w-4 h-4" /> },
    { id: "content", label: "Dossier Registry", icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { id: "links", label: "Link Intelligence", icon: <LinkIcon className="w-4 h-4 text-blue-600" /> },
    { id: "catalog", label: "Hierarchy", icon: <LayoutGrid className="w-4 h-4 text-purple-500" /> },
    { id: "broadcast", label: "Broadcast", icon: <Radio className="w-4 h-4 text-red-500" /> },
    { id: "support", label: "Support Hub", icon: <LifeBuoy className="w-4 h-4 text-amber-500" /> },
    { id: "cases", label: "Matters", icon: <Briefcase className="w-4 h-4" /> },
    { id: "risk", label: "Risk Perimeter", icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
    { id: "automation", label: "Automation", icon: <Cpu className="w-4 h-4 text-blue-500" /> },
    { id: "finance", label: "Reconciliation", icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
    { id: "audit", label: "Audit Ledger", icon: <History className="w-4 h-4" /> },
    { id: "settings", label: "Global Params", icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-200 w-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#0B1F3A] text-white shadow-lg shadow-blue-900/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children(activeTab)}
      </div>
    </div>
  );
}
