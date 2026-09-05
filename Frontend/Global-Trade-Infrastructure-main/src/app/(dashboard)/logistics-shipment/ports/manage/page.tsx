'use client';

/**
 * @file logistics-shipment/ports/manage/page.tsx
 * @description Port registry editor.
 *
 * The corridor planner is only as good as the port data behind it, and a third of the
 * seaports on file have no draft — because a figure nobody can source should not be
 * invented. This is where the people who DO know fill that in. The form is generated
 * from the registry's own `formFields`, so a field added to the point-of-entry schema
 * appears here without touching this file.
 *
 * Every write goes through the GCKB service, which versions the record and keeps the
 * prior revision — an edit is auditable and reversible, not destructive.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Anchor, Check, Loader2, Save, Search, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getEntityDefinition, saveCorrection, searchRecords,
  type EntityDefinition, type FormField, type KbRecord,
} from '@/services/gckb-admin-service';

const ENTITY = 'point_of_entry';
/**
 * Codes identify the facility and the kind decides how it can be routed — both are
 * what the record IS, and editing them here would quietly repoint every corridor
 * already planned through it. Position and the operational fields are ordinary data
 * and stay editable, because a wrong coordinate is exactly the sort of thing this
 * page exists to fix.
 */
const READ_ONLY = new Set(['kind', 'unlocode', 'iata', 'icao']);

function coerce(field: FormField, raw: string): unknown {
  if (raw === '') return undefined;
  if (field.type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  if (field.type === 'boolean') return raw === 'true';
  return raw;
}

function display(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

export default function PortRegistryEditor() {
  const { toast } = useToast();
  const [definition, setDefinition] = useState<EntityDefinition | null>(null);
  const [records, setRecords] = useState<KbRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<KbRecord | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchRecords(ENTITY, { keyword: search || undefined, pageSize: 40 });
      setRecords(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The registry could not be read.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getEntityDefinition(ENTITY)
      .then((def) => setDefinition(def ?? null))
      .catch((err: Error) => setError(err.message));
    void load('');
  }, [load]);

  // The attribute fields, in the order the registry declares them.
  const fields = useMemo(
    () => (definition?.formFields ?? []).filter((f) => f.placement === 'attributes'),
    [definition],
  );

  const select = (record: KbRecord) => {
    setSelected(record);
    setDraft(
      Object.fromEntries(fields.map((f) => [f.name, display(record.attributes[f.name])])),
    );
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Send the whole attribute set: a field cleared in the form must actually clear.
      const attributes: Record<string, unknown> = { ...selected.attributes };
      for (const field of fields) {
        const value = coerce(field, draft[field.name] ?? '');
        if (value === undefined) delete attributes[field.name];
        else attributes[field.name] = value;
      }

      // The country code lives on the record key (`IN:poe:INNSA`), which is what a new
      // override needs to be scoped to the same country as the baseline row.
      const countryCode = selected.recordKey.split(':')[0] || undefined;
      const { record: updated, createdOverride } = await saveCorrection(ENTITY, selected, attributes, countryCode);

      setRecords((current) => current.map((r) => (r.id === selected.id ? updated : r)));
      setSelected(updated);
      toast({
        title: createdOverride ? 'Correction saved for your organization' : 'Port updated',
        description: createdOverride
          ? `${updated.name} now has an organization-level override. The platform baseline is unchanged.`
          : `${updated.name} saved as version ${updated.version}.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'The registry rejected the change.',
      });
    } finally {
      setSaving(false);
    }
  };

  const missingDraft = records.filter((r) => r.attributes.kind === 'SEAPORT' && r.attributes.maxDraftM == null).length;

  return (
    <main className="flex-1 space-y-8 bg-muted/20 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Registry administration</p>
        </div>
        <h1 className="text-4xl font-black uppercase leading-none tracking-tighter">Port registry.</h1>
        <p className="max-w-3xl text-lg font-medium text-muted-foreground">
          Fill in the operational detail the corridor planner checks against. Anything left blank is reported as
          &ldquo;not on file&rdquo; rather than assumed — so a blank field is safe, and a guessed one is not.
        </p>
      </header>

      {error && (
        <Card className="border-2 border-destructive/40">
          <CardContent className="flex items-center gap-4 p-6">
            <TriangleAlert className="h-6 w-6 shrink-0 text-destructive" />
            <div>
              <p className="font-black uppercase tracking-tight">Registry unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="rounded-2xl border-2">
          <CardHeader className="border-b bg-muted/10 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load(keyword)}
                placeholder="Search ports, then press Enter"
                className="h-11 rounded-xl border-2 pl-9 font-medium"
              />
            </div>
            <p className="pt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {loading ? 'Loading…' : `${records.length} of ${total} · ${missingDraft} without a draft`}
            </p>
          </CardHeader>
          <CardContent className="max-h-[36rem] overflow-y-auto p-0">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => select(record)}
                className={cn(
                  'flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted',
                  selected?.id === record.id && 'bg-primary/5',
                )}
              >
                <Anchor className="h-4 w-4 shrink-0 text-primary opacity-60" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{record.name}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {record.code} · {String(record.attributes.kind ?? '')}
                    {record.attributes.maxDraftM != null ? ` · ${record.attributes.maxDraftM} m` : ' · no draft'}
                  </span>
                </span>
                {selected?.id === record.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
            {!loading && records.length === 0 && (
              <p className="p-8 text-center text-sm font-bold text-muted-foreground">No port matches that search.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2">
          {selected ? (
            <>
              <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-lg font-black uppercase tracking-tighter">{selected.name}</CardTitle>
                <CardDescription className="font-medium">
                  {selected.recordKey} · version {selected.version} · {selected.status.toLowerCase()} ·{' '}
                  {selected.organizationId ? 'your override' : 'platform baseline'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => {
                    const locked = READ_ONLY.has(field.name);
                    return (
                      <div key={field.name} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {field.label}
                        </Label>
                        {field.type === 'boolean' ? (
                          <Select
                            value={draft[field.name] || ''}
                            onValueChange={(v) => setDraft((d) => ({ ...d, [field.name]: v }))}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-2 font-bold">
                              <SelectValue placeholder="Not on file" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={draft[field.name] ?? ''}
                            disabled={locked}
                            onChange={(e) => setDraft((d) => ({ ...d, [field.name]: e.target.value }))}
                            placeholder={locked ? '' : 'Not on file'}
                            className="h-11 rounded-xl border-2 font-bold"
                          />
                        )}
                        {field.description && (
                          <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-4 border-t pt-4">
                  <p className="max-w-lg text-[11px] font-medium leading-relaxed text-muted-foreground">
                    {selected.organizationId
                      ? 'This is your organization\u2019s own record. Saving writes a new version and keeps the previous one.'
                      : 'This is the platform baseline, which one tenant cannot rewrite for everyone. Saving creates your organization\u2019s own override of it \u2014 visible to you, leaving the baseline untouched.'}
                  </p>
                  <Button onClick={() => void save()} disabled={saving} className="h-11 gap-2 px-6 text-[11px] font-black uppercase tracking-widest">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save port
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 p-12 text-center">
              <Anchor className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm font-bold text-muted-foreground">Choose a port to edit its operational detail.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}
