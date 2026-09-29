
import { notFound } from 'next/navigation';
import { Breadcrumbs, ButtonLink, Container, ErrorState } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { cases, communities, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { CaseDetail } from '@/lib/api/types';
import { EditCaseForm } from './edit-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Edit case');
export const dynamic = 'force-dynamic';

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const options = await serverOptions();

  const [result, meResult] = await Promise.all([cases.get(id, options), identityApi.me(options)]);
  if (!result.ok && result.error.status === 404) notFound();

  if (!result.ok || !meResult.ok) {
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={meResult.ok ? 'Could not load this case' : 'You are not signed in'}
          message={meResult.ok ? 'Please try again.' : 'Sign in to edit a case you opened.'}
          action={<ButtonLink href={meResult.ok ? `/cases/${id}` : '/login'} variant="secondary">
            {meResult.ok ? 'Back to the case' : 'Sign in'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  const c = result.data;
  // The server refuses the PATCH regardless; this only avoids showing a form that cannot save.
  const isOwner = c.viewLevel !== 'SUMMARY' && (c as CaseDetail).ownerId === meResult.data.userId;
  if (!isOwner) {
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          title="You cannot edit this case"
          message="Only the person who opened a case can change it."
          action={<ButtonLink href={`/cases/${id}`} variant="secondary">Back to the case</ButtonLink>}
        />
      </Container>
    );
  }

  const communityResult = await communities.list({ pageSize: 100 }, options);
  const mine = communityResult.ok ? communityResult.data.filter((x) => x.isMember) : [];

  return (
    <>
      <PageHeader title="Edit case" lead={c.reference} />
      <Container width="prose" className="py-10">
        <Breadcrumbs items={[
          { href: '/', label: 'Home' },
          { href: '/my-cases', label: 'My cases' },
          { href: `/cases/${id}`, label: c.reference },
          { label: 'Edit' },
        ]} />
        <EditCaseForm case={c as CaseDetail} communities={mine} />
      </Container>
    </>
  );
}