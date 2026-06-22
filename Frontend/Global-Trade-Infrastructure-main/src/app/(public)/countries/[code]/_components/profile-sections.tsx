/**
 * @file profile-sections.tsx
 * @description Server presentational pieces for the public country profile —
 * policy-group sections, authority/port/agreement directories, and the key-facts
 * panel. Pure rendering over the `public-read` view shapes; no client state.
 */
import {
  ArrowLeftRight, Percent, Calculator, FileBadge, BadgeCheck, Ban, ClipboardCheck,
  FileText, Plug, ShieldCheck, AlertTriangle, ShieldAlert, Building2, Anchor, Handshake,
  type LucideIcon,
} from 'lucide-react';
import type { PolicyGroup } from '@/server/gckb/policy-forms';
import type { PolicyView, AuthorityView, PortView, AgreementView, CountryDetail } from '@/server/gckb/public-read';

const GROUP_META: Record<PolicyGroup, { label: string; icon: LucideIcon }> = {
  trade_policy: { label: 'Import / Export Policy', icon: ArrowLeftRight },
  tax: { label: 'Taxes', icon: Percent },
  tariff: { label: 'Tariffs & Duties', icon: Calculator },
  license: { label: 'Licenses', icon: FileBadge },
  certificate: { label: 'Certificates', icon: BadgeCheck },
  restriction: { label: 'Restricted & Prohibited Goods', icon: Ban },
  standards: { label: 'Inspection, Packaging & Labeling', icon: ClipboardCheck },
  documents: { label: 'Documents & Government Forms', icon: FileText },
  integration: { label: 'Digital Government APIs', icon: Plug },
  compliance: { label: 'Compliance Requirements', icon: ShieldCheck },
  risk: { label: 'Risk', icon: AlertTriangle },
  sanctions: { label: 'Sanctions', icon: ShieldAlert },
};

/** Stable display order of policy groups on the profile. */
export const GROUP_ORDER: PolicyGroup[] = [
  'trade_policy', 'tax', 'tariff', 'license', 'certificate', 'restriction',
  'standards', 'documents', 'integration', 'compliance', 'risk', 'sanctions',
];

export function groupLabel(group: PolicyGroup): string {
  return GROUP_META[group]?.label ?? group;
}

function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatValue).join(', ') || '—';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if ('amount' in o && 'currency' in o) return `${formatValue(o.amount)} ${formatValue(o.currency)}`;
    return Object.entries(o)
      .map(([k, v]) => `${humanize(k)}: ${formatValue(v)}`)
      .join('; ');
  }
  return String(value);
}

const HIDDEN_ATTR_KEYS = new Set(['hsCodes', 'productCategories']);

function AttributeList({ attributes }: { attributes: Record<string, unknown> }) {
  const entries = Object.entries(attributes).filter(([k, v]) => !HIDDEN_ATTR_KEYS.has(k) && v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;
  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">{humanize(key)}</dt>
          <dd className="text-sm text-slate-200">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PolicyCard({ policy }: { policy: PolicyView }) {
  const hsScope = [...(Array.isArray(policy.attributes.hsCodes) ? (policy.attributes.hsCodes as string[]) : []),
    policy.hsCode].filter(Boolean) as string[];
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{policy.name}</h3>
          <p className="mt-0.5 text-[11px] font-black uppercase tracking-widest text-primary">{policy.policyTypeLabel}</p>
        </div>
        {policy.authority ? (
          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{policy.authority}</span>
        ) : null}
      </div>
      <AttributeList attributes={policy.attributes} />
      {(hsScope.length > 0 || policy.effectiveFrom) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          {hsScope.map((hs) => (
            <span key={hs} className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">HS {hs}</span>
          ))}
          {policy.effectiveFrom ? (
            <span className="text-[10px] font-medium text-slate-500">
              Effective {policy.effectiveFrom.slice(0, 10)}
              {policy.effectiveTo ? ` – ${policy.effectiveTo.slice(0, 10)}` : ''}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function PolicyGroupSection({ group, policies }: { group: PolicyGroup; policies: PolicyView[] }) {
  if (policies.length === 0) return null;
  const meta = GROUP_META[group];
  const Icon = meta?.icon ?? FileText;
  return (
    <section id={group} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="text-lg font-black text-white">{meta?.label ?? group}</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-black text-slate-400">{policies.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {policies.map((p) => (
          <PolicyCard key={p.id} policy={p} />
        ))}
      </div>
    </section>
  );
}

function DirectoryHeading({ icon: Icon, label, count }: { icon: LucideIcon; label: string; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <h2 className="text-lg font-black text-white">{label}</h2>
      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-black text-slate-400">{count}</span>
    </div>
  );
}

export function AuthoritiesSection({ authorities }: { authorities: AuthorityView[] }) {
  if (authorities.length === 0) return null;
  return (
    <section id="authorities" className="scroll-mt-24">
      <DirectoryHeading icon={Building2} label="Government & Customs Authorities" count={authorities.length} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {authorities.map((a) => (
          <article key={a.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-white">{a.name}</h3>
              {a.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{a.kind}</span> : null}
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              {a.jurisdiction ? <p className="text-slate-400">{a.jurisdiction}</p> : null}
              {a.website ? <p className="truncate text-primary">{a.website}</p> : null}
              {a.email ? <p>{a.email}</p> : null}
              {a.phone ? <p>{a.phone}</p> : null}
              {a.address ? <p className="text-slate-400">{a.address}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PortsSection({ ports }: { ports: PortView[] }) {
  if (ports.length === 0) return null;
  return (
    <section id="ports" className="scroll-mt-24">
      <DirectoryHeading icon={Anchor} label="Ports & Points of Entry" count={ports.length} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ports.map((p) => (
          <article key={p.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-black text-white">{p.name}</h3>
              {p.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{p.kind.replace(/_/g, ' ')}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] font-bold text-slate-400">
              {p.unlocode ? <span className="rounded bg-white/5 px-2 py-0.5">{p.unlocode}</span> : null}
              {p.iata ? <span className="rounded bg-white/5 px-2 py-0.5">IATA {p.iata}</span> : null}
              {p.icao ? <span className="rounded bg-white/5 px-2 py-0.5">ICAO {p.icao}</span> : null}
            </div>
            {p.capacityNote ? <p className="mt-2 text-xs text-slate-400">{p.capacityNote}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function AgreementsSection({ agreements }: { agreements: AgreementView[] }) {
  if (agreements.length === 0) return null;
  return (
    <section id="agreements" className="scroll-mt-24">
      <DirectoryHeading icon={Handshake} label="Trade Agreements & FTAs" count={agreements.length} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {agreements.map((a) => (
          <article key={a.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-white">{a.name}</h3>
              <div className="flex flex-col items-end gap-1">
                {a.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{a.kind}</span> : null}
                {a.status ? <span className="text-[10px] font-bold text-emerald-400">{a.status}</span> : null}
              </div>
            </div>
            {a.rulesOfOriginSummary ? <p className="mt-3 text-sm text-slate-300">{a.rulesOfOriginSummary}</p> : null}
            {a.dutyPreferenceNote ? <p className="mt-1 text-xs text-slate-400">{a.dutyPreferenceNote}</p> : null}
            {a.memberCountryCodes.length > 0 ? (
              <p className="mt-3 flex flex-wrap gap-1.5">
                {a.memberCountryCodes.map((m) => (
                  <span key={m} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400">{m}</span>
                ))}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function KeyFacts({ country }: { country: CountryDetail }) {
  const facts: Array<{ label: string; value: string }> = [];
  if (country.alpha3) facts.push({ label: 'ISO alpha-3', value: country.alpha3 });
  if (country.numericCode) facts.push({ label: 'ISO numeric', value: country.numericCode });
  if (country.capital) facts.push({ label: 'Capital', value: country.capital });
  if (country.region) facts.push({ label: 'Region', value: [country.subregion, country.region].filter(Boolean).join(' · ') });
  if (country.currencyCodes.length) facts.push({ label: 'Currencies', value: country.currencyCodes.join(', ') });
  if (country.languageCodes.length) facts.push({ label: 'Languages', value: country.languageCodes.join(', ') });
  if (country.timezoneCodes.length) facts.push({ label: 'Timezones', value: country.timezoneCodes.join(', ') });
  if (country.dialingCode) facts.push({ label: 'Dialing code', value: country.dialingCode });
  if (facts.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">{f.label}</dt>
          <dd className="mt-1 text-sm font-bold text-white">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
