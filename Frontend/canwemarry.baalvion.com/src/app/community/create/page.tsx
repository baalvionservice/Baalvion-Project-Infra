
import { Breadcrumbs, ButtonLink, Container, ErrorState } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { CreateCommunityForm } from './create-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Create a community');
export const dynamic = 'force-dynamic';

export default async function CreateCommunityPage() {
  const meResult = await identityApi.me(await serverOptions());
  const canCreate = meResult.ok && meResult.data.permissions.includes('community:create');

  // The server refuses the POST regardless; this only avoids showing a form that cannot save.
  if (!canCreate) {
    const signedOut = !meResult.ok || !meResult.data.authenticated;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Not available to your account'}
          message={
            signedOut
              ? 'Sign in to see whether your account can create a community.'
              : 'Creating a community is open to volunteers and moderators. If you help people through this kind of situation and would like to host a group, ask a moderator about volunteer standing.'
          }
          action={<ButtonLink href={signedOut ? '/login' : '/community'} variant="secondary">
            {signedOut ? 'Sign in' : 'Browse communities'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title="Create a community"
        lead="A group organised around a shared situation or place. Say clearly what it is for — people decide whether to join on the strength of that."
      />
      <Container width="prose" className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/community', label: 'Community' }, { label: 'Create' }]} />
        <CreateCommunityForm />
      </Container>
    </>
  );
}