import { Card, CardBody, CardTitle } from '@/components/ui';
import { admin } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';
import type { HealthState } from '@/lib/api/types';

export const metadata = privateMetadata('Platform state');
export const dynamic = 'force-dynamic';

/**
 * Meaning first, colour second.
 *
 * Each state carries a word and a symbol as text, so it survives greyscale, colour-blindness
 * and a screen reader. The tint only reinforces what is already written.
 */
const STATE_STYLE: Record<HealthState, { label: string; mark: string; className: string }> = {
  HEALTHY: { label: 'Healthy', mark: '●', className: 'text-ok' },
  DEGRADED: { label: 'Slow', mark: '▲', className: 'text-warn' },
  UNAVAILABLE: { label: 'Not answering', mark: '■', className: 'text-danger' },
  UNKNOWN: { label: 'Not checked', mark: '–', className: 'text-muted-2' },
};

/**
 * Dependencies and configuration.
 *
 * Two rules hold this page together.
 *
 * Every state below was MEASURED — each check is a real round trip, and a check that could
 * not be performed says "not checked" rather than guessing. Reporting a dependency as
 * healthy because nothing proved otherwise is how an outage goes unnoticed.
 *
 * And the configuration list is READ-ONLY on purpose. These values come from the environment
 * and are read at start-up; a switch here would either do nothing after a restart or would
 * mean the service rewriting its own environment. Showing the true state and where it is
 * changed is more useful than a control that lies.
 */
export default async function PlatformPage() {
  const options = await serverOptions();
  const [healthResult, configResult] = await Promise.all([
    admin.health(options),
    admin.configuration(options),
  ]);

  if (!healthResult.ok) return <StaffBoundary error={healthResult.error}>{null}</StaffBoundary>;

  const health = healthResult.data;
  const configuration = configResult.ok ? configResult.data.items : [];
  const overall = STATE_STYLE[health.overall];

  return (
    <div className="space-y-10">
      <section aria-labelledby="ps-health">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id="ps-health" className="heading text-lg">Dependencies</h2>
          <p className={`text-ui ${overall.className}`}>
            <span aria-hidden="true">{overall.mark}</span> {overall.label} overall
          </p>
          <p className="ml-auto text-xs text-muted-2">
            Checked {new Date(health.checkedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
          </p>
        </div>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {health.checks.map((c) => {
            const style = STATE_STYLE[c.state];
            return (
              <li key={c.key} className="rounded-card border border-line bg-surface px-5 py-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className={style.className}>{style.mark}</span>
                  <span className="font-medium">{c.label}</span>
                  <span className={`ml-auto text-sm ${style.className}`}>{style.label}</span>
                </div>
                {c.latencyMs !== null && (
                  <p className="mt-1 text-xs tabular-nums text-muted-2">answered in {c.latencyMs} ms</p>
                )}
                {c.detail && <p className="mt-2 text-xs leading-relaxed text-muted">{c.detail}</p>}
              </li>
            );
          })}
        </ul>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          Each check is a real request made just now. Nothing here reports a host, a
          connection string, a credential or an environment variable — a failure is logged
          server-side, where the detail belongs.
        </p>
      </section>

      <section aria-labelledby="ps-config">
        <h2 id="ps-config" className="heading text-lg">Configuration</h2>
        <ul className="mt-4 space-y-4">
          {configuration.map((item) => (
            <li key={item.key}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-base">{item.label}</CardTitle>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        item.enabled ? 'border-ok text-ok' : 'border-line-strong text-muted'
                      }`}
                    >
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <code className="ml-auto text-xs text-muted-2">{item.key}</code>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-2">{item.changedBy}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
