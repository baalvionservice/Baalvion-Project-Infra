
import { Breadcrumbs, ButtonLink, Container, ErrorState } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { communities, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { CaseForm } from './case-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Open a case');
export const dynamic = 'force-dynamic';

export default async function CreateCasePage() {
  const options = await serverOptions();
  const meResult = await identityApi.me(options);

  if (!meResult.ok) {
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title="You are not signed in"
          message="Opening a case needs an account, so that only you can reach what you write."
          action={<ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>}
        />
      </Container>
    );
  }

  // Only communities the person actually belongs to can scope a case — the service refuses
  // any other, so offering them in the picker would produce an error the reader cannot fix.
  const communityResult = await communities.list({ pageSize: 100 }, options);
  const mine = communityResult.ok ? communityResult.data.filter((c) => c.isMember) : [];

  return (
    <>
      <PageHeader
        title="Open a case"
        lead="Nothing is shared with anyone until you decide to share it. A new case is saved as a private draft."
      />
      <Container width="prose" className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/cases', label: 'Cases' }, { label: 'Open a case' }]} />
        <CaseForm communities={mine} />
      </Container>
    </>
  );
}