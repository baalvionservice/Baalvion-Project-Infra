'use client';

/**
 * @file port-picker.tsx
 * @description Origin/destination selector over the global port registry.
 *
 * With a few hundred ports a flat `<select>` is unusable, so selection is narrowed
 * the way a planner thinks about it: region first, then country, then berth — with
 * free text (port name, UN/LOCODE, IATA, country) cutting across all three.
 */
import { useMemo, useState } from 'react';
import { Anchor, Check, ChevronDown, Loader2, MapPin, Plane, Search, Train, Warehouse } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { groupByRegion, matchesQuery, type NetworkPort } from '@/services/port-network-service';

const ALL_REGIONS = 'ALL';

const KIND_ICON: Record<string, typeof Anchor> = {
  SEAPORT: Anchor,
  AIRPORT: Plane,
  RAIL: Train,
  DRY_PORT: Warehouse,
  ICD: Warehouse,
};

export function portKindIcon(kind?: string) {
  return KIND_ICON[kind ?? ''] ?? MapPin;
}

interface Props {
  label: string;
  ports: NetworkPort[];
  loading?: boolean;
  value: NetworkPort | null;
  onChange: (port: NetworkPort) => void;
  /** Port code that cannot be picked here — the other end of the corridor. */
  excludeCode?: string;
  placeholder?: string;
}

export function PortPicker({ label, ports, loading, value, onChange, excludeCode, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState(ALL_REGIONS);

  const regions = useMemo(() => [...new Set(ports.map((p) => p.region))].sort(), [ports]);

  const groups = useMemo(() => {
    const filtered = ports.filter(
      (p) => p.code !== excludeCode && (region === ALL_REGIONS || p.region === region) && matchesQuery(p, query),
    );
    return groupByRegion(filtered);
  }, [ports, excludeCode, region, query]);

  const total = groups.reduce((n, g) => n + g.portCount, 0);
  const Icon = portKindIcon(value?.kind);

  const select = (port: NetworkPort) => {
    onChange(port);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={loading}
            className={cn(
              'flex h-16 w-full items-center gap-4 rounded-2xl border-2 px-4 text-left transition-colors',
              'hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
              value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Icon className={cn('h-5 w-5 shrink-0', value ? 'text-primary' : 'text-muted-foreground opacity-50')} />
            )}
            <span className="min-w-0 flex-1">
              {value ? (
                <>
                  <span className="block truncate text-sm font-black uppercase tracking-tight">{value.name}</span>
                  <span className="block truncate text-[11px] font-bold text-muted-foreground">
                    {value.flagEmoji ? `${value.flagEmoji} ` : ''}
                    {value.countryName}
                    {value.unlocode ? ` · ${value.unlocode}` : ''}
                    {` · ${value.subregion}`}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {loading ? 'Loading port registry…' : (placeholder ?? 'Select a port')}
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[min(30rem,calc(100vw-2rem))] p-0">
          <div className="space-y-3 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search port, UN/LOCODE, country…"
                className="h-10 pl-9 font-medium"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[ALL_REGIONS, ...regions].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-colors',
                    region === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {r === ALL_REGIONS ? 'All regions' : r}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[22rem]">
            {total === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-muted-foreground">No port matches that search.</p>
            ) : (
              groups.map((group) => (
                <div key={group.region}>
                  <p className="sticky top-0 z-10 bg-muted/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground backdrop-blur">
                    {group.region} · {group.portCount}
                  </p>
                  {group.countries.map((country) => (
                    <div key={country.countryCode}>
                      <p className="px-3 pt-2 text-[10px] font-black uppercase tracking-widest text-foreground/70">
                        {country.flagEmoji ? `${country.flagEmoji} ` : ''}
                        {country.countryName}
                      </p>
                      {country.ports.map((port) => {
                        const PortIcon = portKindIcon(port.kind);
                        return (
                          <button
                            key={port.id}
                            type="button"
                            onClick={() => select(port)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
                          >
                            <PortIcon className="h-4 w-4 shrink-0 text-primary opacity-60" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{port.name}</span>
                              <span className="block font-mono text-[10px] text-muted-foreground">
                                {[port.unlocode, port.iata && `IATA ${port.iata}`, port.kind?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}
                              </span>
                            </span>
                            {value?.code === port.code && <Check className="h-4 w-4 shrink-0 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
