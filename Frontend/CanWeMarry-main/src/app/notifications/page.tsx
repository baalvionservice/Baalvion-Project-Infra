
import { Breadcrumbs, ButtonLink, Container, ErrorState } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { NotificationList } from './notification-list';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Notifications');
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const result = await me.notifications({ pageSize: 50 }, await serverOptions());

  if (!result.ok) {
    const signedOut = result.error.status === 401;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Could not load your notifications'}
          message={signedOut ? 'Sign in to see what has happened on your cases.' : result.error.message}
          action={<ButtonLink href={signedOut ? '/login' : '/notifications'} variant="secondary">
            {signedOut ? 'Sign in' : 'Try again'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        lead="Everything reaches you here rather than by email — nothing about your case is sent to an inbox somebody else might open."
      />
      <Container width="prose" className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Notifications' }]} />
        <NotificationList initial={result.data} />
      </Container>
    </>
  );
}