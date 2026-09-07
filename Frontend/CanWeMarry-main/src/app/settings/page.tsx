
import { ButtonLink, Container, ErrorState } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { SettingsForm } from './settings-form';
import { Standing } from './standing';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Settings');
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const options = await serverOptions();
  const [result, requests] = await Promise.all([me.profile(options), me.roleRequests(options)]);

  if (!result.ok && result.error.status === 401) {
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title="You are not signed in"
          message="Sign in to change your profile and privacy settings."
          action={<ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <>
      <PageHeader title="Settings" lead="Your profile, and who can see what." />
      <Container width="prose" className="py-10">
        <SettingsForm profile={result.ok ? result.data : null} />
        {/* A refusal here is not a reason to hide the section — an empty list reads the same
            as "you have never asked", which is true for almost everybody. */}
        <Standing requests={requests.ok ? requests.data : []} />
      </Container>
    </>
  );
}