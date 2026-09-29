"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import {
  Globe,
  FolderTree,
  Cpu,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { COUNTRY_MARKETPLACE_CONFIGS, MARKETPLACE_MODULES } from '@/data/mockData';
import { listFeatureFlags, createFeatureFlag, setFeatureFlagEnabled, type FeatureFlag } from '@/lib/api/admin-users';

const flagKeyFor = (moduleId: string) => `marketplace_module_${moduleId}`;

export default function AdminMarketplace() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'modules' | 'hubs'>('modules');
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listFeatureFlags({ limit: 200 })
      .then((res) => {
        const byKey: Record<string, FeatureFlag> = {};
        for (const f of res.items) byKey[f.key] = f;
        setFlags(byKey);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (moduleId: string, moduleName: string, moduleDescription: string) => {
    const key = flagKeyFor(moduleId);
    setBusyId(moduleId);
    try {
      const existing = flags[key];
      if (existing) {
        const updated = await setFeatureFlagEnabled(existing.id, !existing.enabled);
        setFlags((prev) => ({ ...prev, [key]: updated }));
      } else {
        // First toggle for this module — create its flag, enabled.
        const created = await createFeatureFlag({ key, name: moduleName, description: moduleDescription, enabled: true });
        setFlags((prev) => ({ ...prev, [key]: created }));
      }
      toast({ title: 'Module updated' });
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't update module", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

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
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Real feature-flag toggles — admin-service&apos;s platform flag store</p>
        </div>
        <div className="flex gap-2 p-1 bg-brand-surface border border-brand-border rounded-lg overflow-x-auto no-scrollbar">
          {(['modules', 'hubs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

      {loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : activeTab === 'modules' ? (
        <div className="space-y-8">
          <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-green" /> Global Industry Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETPLACE_MODULES.map((module) => {
              const flag = flags[flagKeyFor(module.id)];
              const enabled = flag ? flag.enabled : false;
              return (
                <ListingCard key={module.id} className="p-8 bg-brand-surface border-brand-border group relative overflow-hidden">
                  <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-6xl", module.color.split(' ')[0].replace('from-', 'text-'))}>
                    {module.icon}
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className={cn("w-12 h-12 rounded-2xl bg-brand-void border border-brand-border flex items-center justify-center text-xl shadow-xl", enabled ? 'text-brand-green' : 'text-text-ghost')}>
                        {module.icon}
                      </div>
                      <Badge variant={enabled ? 'success' : 'default'}>{enabled ? 'ENABLED' : 'DISABLED'}</Badge>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1 uppercase italic font-display">{module.name}</h4>
                      <p className="text-xs text-text-muted font-mono leading-relaxed">{module.description}</p>
                    </div>
                    <div className="pt-6 border-t border-brand-border">
                      <AppButton
                        onClick={() => handleToggle(module.id, module.name, module.description)}
                        isLoading={busyId === module.id}
                        variant={enabled ? 'secondary' : 'primary'}
                        size="sm"
                        className="w-full text-[9px] uppercase font-mono h-9"
                      >
                        {enabled ? 'Disable Module' : 'Enable Module'}
                      </AppButton>
                    </div>
                  </div>
                </ListingCard>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-green" /> Regional Reference
          </h3>
          <p className="text-xs text-text-muted max-w-2xl -mt-4">
            Which modules each operating region is configured to use. Module state above is global — there is no per-region override in the backend today, so this is read-only reference, not a live per-country config surface.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(COUNTRY_MARKETPLACE_CONFIGS).map(([id, config]) => (
              <ListingCard key={id} className="p-6 bg-brand-surface border-brand-border">
                <div className="space-y-1 mb-6">
                  <h4 className="font-bold text-white text-lg">{config.country}</h4>
                  <div className="text-[10px] font-mono text-text-muted">{config.payoutKey}</div>
                </div>
                <div className="space-y-4">
                  <div className="text-[9px] font-bold text-text-muted uppercase">Configured Modules ({config.modules.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {config.modules.map((modId) => {
                      const mod = MARKETPLACE_MODULES.find((m) => m.id === modId);
                      const isEnabled = flags[flagKeyFor(modId)]?.enabled;
                      return (
                        <span key={modId} className={cn("text-[8px] px-2 py-0.5 rounded border", isEnabled ? "bg-brand-green/10 border-brand-green/20 text-brand-green" : "bg-brand-void border-white/5 text-text-secondary")}>
                          {mod?.name || modId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>
      )}

      <ListingCard className="p-8 border-brand-border bg-brand-surface flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <FolderTree className="w-6 h-6 text-brand-green" />
          <div>
            <h4 className="font-bold text-white">Category Management</h4>
            <p className="text-xs text-text-muted">Full category CRUD across stores lives on its own page.</p>
          </div>
        </div>
        <Link href="/admin/categories">
          <AppButton size="sm" className="h-9 font-mono text-[9px] uppercase">Go to Categories</AppButton>
        </Link>
      </ListingCard>
    </div>
  );
}
