import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@/components/ui';
import type { RelatedContent } from '@/lib/api/types';

const CATEGORY_LABEL: Record<string, string> = {
  LEGAL: 'Legal', MEDIATION: 'Mediation', COUNSELLING: 'Counselling',
  SAFETY: 'Safety', RIGHTS: 'Rights', FINANCIAL: 'Practical', OTHER: 'General',
};

/**
 * Things worth looking at alongside a case.
 *
 * Deliberately plain. This is not a recommendation engine and must not read like one: no
 * "because you viewed", no match strength, no ranking. Why two things sit next to each other
 * can be as revealing as either of them, so the page shows what, never why.
 *
 * Everything here arrives already filtered by the caller's own visibility rules, so this
 * component renders what it is given without deciding anything about access.
 */
export function RelatedPanel({ related }: { related: RelatedContent }) {
  const { resources, communities, cases } = related;
  if (resources.length === 0 && communities.length === 0 && cases.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="border-t border-line pt-8">
      <h2 id="related-heading" className="heading text-xl">Elsewhere on CanWeMarry</h2>
      <p className="mt-2 text-sm text-muted">
        Information and places that may be useful. Nothing here is tailored to anyone in
        particular.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {resources.length > 0 && (
          <Card>
            <CardBody>
              <CardTitle className="text-base">Guidance</CardTitle>
              <ul className="mt-3 space-y-3">
                {resources.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/resources/${r.slug}`}
                      className="focus-ring block rounded-sm text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {r.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-2">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                      {r.providerName ? ` · ${r.providerName}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {communities.length > 0 && (
          <Card>
            <CardBody>
              <CardTitle className="text-base">Communities</CardTitle>
              <ul className="mt-3 space-y-3">
                {communities.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/community/${c.slug}`}
                      className="focus-ring block rounded-sm text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.purpose && <p className="mt-0.5 line-clamp-2 text-xs text-muted-2">{c.purpose}</p>}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {cases.length > 0 && (
          <Card className="sm:col-span-2">
            <CardBody>
              <CardTitle className="text-base">Other people’s situations</CardTitle>
              <p className="mt-1 text-xs text-muted-2">
                Shared openly by the people who wrote them.
              </p>
              <ul className="mt-3 space-y-3">
                {cases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      className="focus-ring block rounded-sm text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-2">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}
