
import Link from 'next/link';
import {
  Avatar, Badge, Breadcrumbs, ButtonLink, Card, CardBody, Container,
  EmptyState, ErrorState, RelativeTime, Section, VisibilityBadge,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { VerificationCard } from '@/components/site/verification-card';
import { cases, communities, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Your profile');
export const dynamic = 'force-dynamic';

const ROLE_BLURB: Record<string, string> = {
  USER: 'Member',
  SUPPORTER: 'Can offer support on cases',
  VOLUNTEER: 'Curates the resource directory and can create communities',
  MODERATOR: 'Reviews reports and moderates content',
  ADMIN: 'Platform administrator',
};

export default async function ProfilePage() {
  const options = await serverOptions();
  const meResult = await identityApi.me(options);

  if (!meResult.ok) {
    const signedOut = meResult.error.status === 401;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Could not load your profile'}
          message={signedOut ? 'Sign in to see and edit your profile.' : meResult.error.message}
          action={<ButtonLink href={signedOut ? '/login' : '/profile'} variant="secondary">
            {signedOut ? 'Sign in' : 'Try again'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  const identity = meResult.data;
  const profile = identity.profile;

  const [ownCases, myCommunities, supportingCases] = await Promise.all([
    cases.list({ mine: true, pageSize: 6 }, options),
    communities.list({ pageSize: 100 }, options),
    cases.list({ supporting: true, pageSize: 1 }, options),
  ]);

  const joined = myCommunities.ok ? myCommunities.data.filter((c) => c.isMember) : [];
  const supportCount = supportingCases.ok ? supportingCases.meta.pagination?.total ?? 0 : 0;

  return (
    <>
      <PageHeader
        title="Your profile"
        lead="What other members can see about you — and only when you have chosen to be discoverable."
        actions={<ButtonLink href="/settings" variant="secondary">Edit profile</ButtonLink>}
      />

      <Container className="space-y-10 py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Profile' }]} />

        {!profile ? (
          <EmptyState
            title="You have not set up a profile"
            description="A profile is optional. You can open cases and take part without one; it exists so people you work with can recognise you."
            action={<ButtonLink href="/settings">Set one up</ButtonLink>}
          />
        ) : (
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={profile.displayName ?? profile.handle} src={profile.avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="heading text-xl">{profile.displayName ?? profile.handle}</h2>
                  <p className="text-sm text-muted">@{profile.handle}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={profile.isDiscoverable ? 'accent' : 'ok'}>
                      {profile.isDiscoverable ? 'Discoverable' : 'Not discoverable'}
                    </Badge>
                    <Badge>New cases: {profile.defaultCaseVisibility.toLowerCase()}</Badge>
                    {profile.showLocation && (profile.region || profile.countryCode) && (
                      <Badge>{[profile.region, profile.countryCode].filter(Boolean).join(', ')}</Badge>
                    )}
                  </div>
                </div>
              </div>
              {profile.bio && <p className="mt-5 whitespace-pre-line leading-relaxed">{profile.bio}</p>}
              {profile.isDiscoverable && (
                <p className="mt-5 text-sm text-muted">
                  Other members can find you at{' '}
                  <Link href={`/profiles/${profile.handle}`} className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
                    /profiles/{profile.handle}
                  </Link>. That page shows only your handle, name, bio and — if you allowed it — your location.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* A real indicator now: auth-service signs `email_verified` and the service reads
            it off the token. UNKNOWN still says so rather than guessing either way. */}
        {identity.emailVerification && (
          <VerificationCard state={identity.emailVerification.state} />
        )}

        <Section title="Your standing" description="What your account can do here. A moderator can grant supporter or volunteer standing.">
          <ul className="flex flex-wrap gap-2">
            {identity.roles.map((r) => (
              <li key={r}>
                <span className="inline-flex flex-col rounded-card border border-line bg-surface px-4 py-3">
                  <span className="text-sm font-medium">{r.toLowerCase()}</span>
                  <span className="mt-0.5 text-xs text-muted">{ROLE_BLURB[r] ?? ''}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Your activity" description="Only you see this.">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card border border-line bg-surface px-5 py-4">
              <dt className="text-sm text-muted">Cases opened</dt>
              <dd className="mt-1 font-display text-2xl">{ownCases.ok ? ownCases.meta.pagination?.total ?? 0 : '—'}</dd>
            </div>
            <div className="rounded-card border border-line bg-surface px-5 py-4">
              <dt className="text-sm text-muted">Cases you support</dt>
              <dd className="mt-1 font-display text-2xl">{supportCount}</dd>
            </div>
            <div className="rounded-card border border-line bg-surface px-5 py-4">
              <dt className="text-sm text-muted">Communities joined</dt>
              <dd className="mt-1 font-display text-2xl">{joined.length}</dd>
            </div>
          </dl>
        </Section>

        {joined.length > 0 && (
          <Section title="Your communities">
            <ul className="flex flex-wrap gap-2">
              {joined.map((c) => (
                <li key={c.id}>
                  <Link href={`/community/${c.slug}`} className="focus-ring rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm hover:bg-surface-2">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Your recent cases" action={<ButtonLink href="/my-cases" size="sm" variant="ghost">See all</ButtonLink>}>
          {!ownCases.ok || ownCases.data.length === 0 ? (
            <EmptyState title="Nothing yet" description="Cases you open appear here. They stay private unless you decide otherwise." />
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface px-5">
              {ownCases.data.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/cases/${c.id}`} className="focus-ring rounded-sm font-medium hover:text-accent-strong">{c.title}</Link>
                    <p className="mt-1 text-xs text-muted-2">Updated <RelativeTime value={c.updatedAt} /></p>
                  </div>
                  <VisibilityBadge visibility={c.visibility} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </Container>
    </>
  );
}