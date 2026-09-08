
import { notFoundIfMissing } from '@/lib/api/not-found';
import {
  Avatar, Badge, Breadcrumbs, Card, CardBody, Container, ErrorState,
} from '@/components/ui';
import { profiles } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Member');
export const dynamic = 'force-dynamic';

/**
 * Another member's profile.
 *
 * The server returns a deliberately narrow projection: handle, display name, bio, avatar,
 * languages, and location ONLY when that person opted into showing it. A profile that is
 * not discoverable 404s outright, so a handle cannot be used to confirm an account exists.
 *
 * There is no case list here on purpose. Which cases somebody opened is theirs to share.
 */
export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const result = await profiles.byHandle(handle, await serverOptions());
  if (!result.ok) {
    // A profile that is not discoverable answers 404, so a genuine 404 covers both "no such
    // person" and "not listed" without distinguishing them. Any other failure is ours.
    const failure = notFoundIfMissing(result.error);
    return (
      <Container width="prose" className="py-16">
        <ErrorState as="h1" message={failure.message} />
      </Container>
    );
  }

  const p = result.data;
  const place = [p.region, p.countryCode].filter(Boolean).join(', ');

  return (
    <Container width="prose" className="py-12">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: `@${p.handle}` }]} />

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={p.displayName ?? p.handle} src={p.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="heading text-2xl">{p.displayName ?? p.handle}</h1>
              <p className="text-sm text-muted">@{p.handle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {place && <Badge>{place}</Badge>}
                {(p.languages ?? []).map((l) => <Badge key={l}>{l}</Badge>)}
              </div>
            </div>
          </div>
          {p.bio && <p className="mt-5 whitespace-pre-line leading-relaxed">{p.bio}</p>}
        </CardBody>
      </Card>

      <p className="mt-6 text-sm text-muted">
        Members choose what appears here. Cases and community memberships are never listed on
        someone else&rsquo;s profile.
      </p>
    </Container>
  );
}