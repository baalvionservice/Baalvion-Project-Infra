
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  ShieldAlert, 
  Activity, 
  DollarSign, 
  Globe, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Settings,
  LayoutDashboard,
  Box,
  Scale,
  MoreVertical,
  PlusCircle,
  Trash2,
  Eye,
  Check,
  Cpu,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_CATEGORIES, COUNTRY_MARKETPLACE_CONFIGS, MARKETPLACE_MODULES } from '@/data/mockData';

export default function AdminMarketplace() {
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'hubs' | 'categories' | 'disputes'>('modules');
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="p-10 pb-32 max-w-7xl mx-auto space-y-12">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-brand-green" />
            <h1 className="text-4xl font-bold tracking-tight uppercase font-display italic leading-none text-white">
              Plugin <span className="text-brand-green">Engine.</span>
            </h1>
          </div>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Global Node Administration • Modular Protocol</p>
        </div>
        <div className="flex gap-2 p-1 bg-brand-surface border border-brand-border rounded-lg overflow-x-auto no-scrollbar">
          {['modules', 'hubs', 'categories', 'disputes'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap", 
                activeTab === tab ? "bg-brand-green text-black" : "text-text-muted hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'modules' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-green" /> Global Industry Modules
            </h3>
            <AppButton size="sm" className="h-9 font-mono text-[9px] uppercase"><Plus className="w-3 h-3 mr-2" /> Add Industry Protocol</AppButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETPLACE_MODULES.map((module) => (
              <ListingCard key={module.id} className="p-8 bg-brand-surface border-brand-border group relative overflow-hidden">
                <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-6xl", module.color.split(' ')[0].replace('from-', 'text-'))}>
                  {module.icon}
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={cn("w-12 h-12 rounded-2xl bg-brand-void border border-brand-border flex items-center justify-center text-xl shadow-xl", module.status === 'enabled' ? 'text-brand-green' : 'text-text-ghost')}>
                      {module.icon}
                    </div>
                    <Badge variant={module.status === 'enabled' ? 'success' : 'default'}>{module.status.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1 uppercase italic font-display">{module.name}</h4>
                    <p className="text-xs text-text-muted font-mono leading-relaxed">{module.description}</p>
                  </div>
                  <div className="pt-6 border-t border-brand-border flex gap-2">
                    <AppButton variant={module.status === 'enabled' ? 'secondary' : 'primary'} size="sm" className="flex-1 text-[9px] uppercase font-mono h-9">
                      {module.status === 'enabled' ? 'Disable Protocol' : 'Enable Protocol'}
                    </AppButton>
                    <button className="p-2.5 rounded bg-brand-void border border-brand-border text-text-ghost hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'hubs' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-green" /> Local Hub Handshakes
            </h3>
            <AppButton size="sm" className="h-9 font-mono text-[9px] uppercase"><RefreshCcw className="w-3 h-3 mr-2" /> Sync Node Cluster</AppButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(COUNTRY_MARKETPLACE_CONFIGS).map(([id, config]) => (
              <ListingCard key={id} className="p-6 bg-brand-surface border-brand-border hover:border-brand-green transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-lg">{config.country}</h4>
                    <div className="text-[10px] font-mono text-text-muted">{config.payoutKey}</div>
                  </div>
                  <Badge variant="success">NODE: ONLINE</Badge>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="text-[9px] font-bold text-text-muted uppercase">Active Plugins ({config.modules.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {config.modules.map(modId => {
                      const mod = MARKETPLACE_MODULES.find(m => m.id === modId);
                      return (
                        <span key={modId} className="text-[8px] px-2 py-0.5 rounded bg-brand-void border border-white/5 text-text-secondary">
                          {mod?.name || modId}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <AppButton variant="secondary" size="sm" className="flex-1 text-[9px] uppercase font-mono h-10">Configure Plugins</AppButton>
                  <AppButton variant="ghost" size="sm" className="px-3 border border-white/5"><Settings className="w-4 h-4" /></AppButton>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-green" /> Global Category Protocol
            </h3>
            <AppButton onClick={() => setShowAddCategory(true)} size="sm" className="h-9 font-mono text-[9px] uppercase"><PlusCircle className="w-3 h-3 mr-2" /> Define Sector Node</AppButton>
          </div>

          <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
            <table className="w-full text-left font-mono">
              <thead className="bg-brand-void border-b border-brand-border text-text-muted text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-6">Sector Identity</th>
                  <th className="p-6">Parent Module</th>
                  <th className="p-6">Path</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs text-white">
                {ALL_CATEGORIES.map((cat) => (
                  <tr key={cat.id} className="hover:bg-brand-elevated transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeof cat.icon === 'string' ? cat.icon : <cat.icon className="w-6 h-6" />}</span>
                        <div>
                          <div className="font-bold">{cat.name}</div>
                          <div className="text-[9px] text-text-muted line-clamp-1">{cat.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant="info" className="text-[8px]">{MARKETPLACE_MODULES.find(m => m.id === cat.moduleId)?.name || 'GENERIC'}</Badge>
                    </td>
                    <td className="p-6 text-text-muted">/{cat.slug}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-text-ghost hover:text-brand-green"><Eye className="w-4 h-4" /></button>
                        <button className="p-2 text-text-ghost hover:text-semantic-warning"><Settings className="w-4 h-4" /></button>
                        <button className="p-2 text-text-ghost hover:text-semantic-error"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListingCard>
        </div>
      )}

      {/* Add Category Modal Placeholder */}
      <AnimatePresence>
        {showAddCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-[2rem] p-10 relative"
            >
              <button onClick={() => setShowAddCategory(false)} className="absolute top-8 right-8 text-text-ghost hover:text-white"><XCircle size={24} /></button>
              <h3 className="text-2xl font-bold mb-8 uppercase italic font-display">Define <span className="text-brand-green">New Sector Node.</span></h3>
              
              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Sector Name</label>
                  <input className="w-full bg-brand-void border border-brand-border h-12 rounded px-4 text-sm font-mono text-white outline-none focus:border-brand-green" placeholder="e.g. YouTube Alpha" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parent Module</label>
                  <select className="w-full bg-brand-void border border-brand-border h-12 rounded px-4 text-sm font-mono text-white outline-none focus:border-brand-green">
                    {MARKETPLACE_MODULES.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <AppButton className="w-full h-14 font-mono text-xs uppercase tracking-widest" onClick={() => setShowAddCategory(false)}>
                  Publish Protocol Identifier
                </AppButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
