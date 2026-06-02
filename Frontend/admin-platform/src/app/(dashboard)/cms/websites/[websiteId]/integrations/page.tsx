'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Plug, CreditCard, MessageSquare, Sparkles, ShieldCheck, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import {
  useWebsiteIntegrations,
  useUpsertIntegration,
  useTestIntegration,
  useRemoveIntegration,
} from '@/lib/queries/cms-integrations.queries';
import { useUIStore } from '@/lib/store/uiStore';
import {
  PROVIDER_CATALOG,
  CATEGORY_LABELS,
  type ProviderDef,
  type Integration,
  type IntegrationCategory,
} from '@/lib/types/cms-integration.types';

const CATEGORY_ICON: Record<IntegrationCategory, typeof Plug> = {
  api: Plug,
  payment: CreditCard,
  sms: MessageSquare,
  ai: Sparkles,
  webhook: Plug,
  other: Plug,
};

function StatusBadge({ integration }: { integration?: Integration }) {
  if (!integration || integration.status === 'unconfigured') {
    return <Badge variant="outline" className="text-[10px]">Not set</Badge>;
  }
  if (integration.status === 'error') {
    return <Badge variant="destructive" className="text-[10px]">Error</Badge>;
  }
  return (
    <Badge variant="outline" className="gap-1 border-green-500/40 text-[10px] text-green-600">
      <CheckCircle2 className="h-3 w-3" /> Connected
    </Badge>
  );
}

function IntegrationCard({
  websiteId,
  def,
  existing,
}: {
  websiteId: string;
  def: ProviderDef;
  existing?: Integration;
}) {
  const { mutate: save, isPending: saving } = useUpsertIntegration(websiteId);
  const { mutate: test, isPending: testing } = useTestIntegration(websiteId);
  const { mutate: remove } = useRemoveIntegration(websiteId);

  const [config, setConfig] = useState<Record<string, string>>({ ...(existing?.config ?? {}) });
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<boolean>(existing?.enabled ?? false);

  // Re-sync local form when server data arrives/changes.
  useEffect(() => {
    setConfig({ ...(existing?.config ?? {}) });
    setEnabled(existing?.enabled ?? false);
    setSecrets({});
  }, [existing?.id, existing?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const Icon = CATEGORY_ICON[def.category];

  const handleSave = () => {
    const cleanSecrets: Record<string, string> = {};
    for (const [k, v] of Object.entries(secrets)) if (v.trim()) cleanSecrets[k] = v.trim();
    save({
      provider: def.provider,
      payload: { category: def.category, label: def.label, config, secrets: cleanSecrets, enabled },
    });
    setSecrets({});
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3 pt-4 px-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{def.label}</h3>
              <StatusBadge integration={existing} />
            </div>
            <p className="text-xs text-muted-foreground">{def.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Label className="text-[11px] text-muted-foreground">Enabled</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {def.fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.type === 'select' ? (
                <Select
                  value={config[f.key] ?? ''}
                  onValueChange={(v) => setConfig((c) => ({ ...c, [f.key]: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder={f.placeholder}
                  value={config[f.key] ?? ''}
                  onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {def.secretFields.map((f) => {
            const hint = existing?.secretHints?.[f.key];
            return (
              <div key={f.key} className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  <KeyRound className="h-3 w-3 text-muted-foreground" />
                  {f.label}
                  {hint && <span className="font-mono text-[10px] text-muted-foreground">({hint})</span>}
                </Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-8 text-xs"
                  placeholder={hint ? 'Leave blank to keep current' : (f.placeholder ?? 'Enter key')}
                  value={secrets[f.key] ?? ''}
                  onChange={(e) => setSecrets((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>

        {existing?.lastTestMessage && (
          <p className={`flex items-center gap-1.5 text-[11px] ${existing.lastTestOk ? 'text-green-600' : 'text-destructive'}`}>
            {existing.lastTestOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {existing.lastTestMessage}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => test(def.provider)} disabled={testing || !existing}>
            {testing ? 'Testing…' : 'Test connection'}
          </Button>
          {existing && (
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => remove(def.provider)}
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WebsiteIntegrationsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const { data: website } = useWebsite(websiteId);
  const { data: integrations, isLoading } = useWebsiteIntegrations(websiteId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Integrations & Keys' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const byProvider = new Map((integrations ?? []).map((i) => [i.provider, i]));
  const categories = [...new Set(PROVIDER_CATALOG.map((p) => p.category))] as IntegrationCategory[];

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Integrations & Keys"
          description={`Connect ${website?.name ?? 'this website'} to its backend API, payment gateway, and other services`}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <p>
          Keys are <strong>encrypted at rest</strong> and only ever shown masked. Once saved, the
          platform&apos;s services read them <strong>live</strong> — paste a key here and it takes effect
          immediately, no redeploy.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid gap-3">
              {PROVIDER_CATALOG.filter((p) => p.category === cat).map((def) => (
                <IntegrationCard
                  key={def.provider}
                  websiteId={websiteId}
                  def={def}
                  existing={byProvider.get(def.provider)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
