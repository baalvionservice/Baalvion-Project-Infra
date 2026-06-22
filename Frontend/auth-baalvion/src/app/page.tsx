import { resolveBrand } from '@/lib/brand';
import { AuthExperience } from '@/components/AuthExperience';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

// Server component: resolves the brand theme + validated return target from the URL, then hands a
// plain theme token object to the client experience. Theme resolution stays on the server so the
// first paint is already branded (no flash of default theme).
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const { theme, returnTo } = resolveBrand({
    brand: pick(params.brand),
    return_to: pick(params.return_to) ?? pick(params.returnTo),
  });

  return (
    <main className="stage" style={theme.vars as unknown as CSSProperties} data-mode={theme.mode}>
      <AuthExperience
        brandName={theme.brandName}
        tagline={theme.tagline}
        mode={theme.mode}
        returnTo={returnTo}
      />
    </main>
  );
}
