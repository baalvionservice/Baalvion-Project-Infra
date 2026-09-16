
import { Card, CardBody, Container, ErrorState, ButtonLink, RelativeTime } from '@/components/ui';
import { invitations } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { SITE } from '@/lib/site';
import { InviteActions } from './invite-actions';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('An invitation');
export const dynamic = 'force-dynamic';

const UNAVAILABLE: Record<string, { title: string; message: string }> = {
  EXPIRED: {
    title: 'This invitation has expired',
    message: 'Invitation codes stop working after a while, so an old one cannot be used by whoever happens to find it. Ask the person who invited you for a new code.',
  },
  REVOKED: {
    title: 'This invitation has been withdrawn',
    message: 'The person who created it has withdrawn it. If you think that is a mistake, speak to them directly.',
  },
  ACCEPTED: {
    title: 'This invitation has already been used',
    message: 'Each code works once. If it was you who used it, the case is in your list of cases.',
  },
  DECLINED: {
    title: 'This invitation has already been answered',
    message: 'It was declined, and that answer is final. A new code would be needed to take part.',
  },
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await invitations.preview(token, await serverOptions());

  // A code that was never real and one that has been withdrawn answer identically, so this
  // page cannot be used to work out which codes ever existed.
  if (!result.ok) {
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title="We do not recognise this invitation"
          message="Check the code was copied in full. If it keeps failing, ask the person who invited you to send a new one."
          action={<ButtonLink href="/" variant="secondary">Go to the home page</ButtonLink>}
        />
      </Container>
    );
  }

  const preview = result.data;
  const blocked = UNAVAILABLE[preview.status];

  return (
    <Container width="prose" className="py-16">
      <h1 className="heading text-3xl">You have been invited to a case</h1>
      <p className="mt-3 text-muted">
        Someone using {SITE.name} has asked you to take part in a support case about their
        relationship.
      </p>

      {/* Deliberately no case title, summary or owner. The code may have travelled further
          than the person who created it intended, and none of that should be readable by
          whoever ends up holding it. */}
      <p className="mt-3 text-sm leading-relaxed text-muted">
        We are not showing you what the case says yet — only the person who opened it decides
        who reads it, and that begins when you accept.
      </p>

      <div className="mt-8">
        {blocked ? (
          <ErrorState
            title={blocked.title}
            message={blocked.message}
            action={<ButtonLink href="/" variant="secondary">Go to the home page</ButtonLink>}
          />
        ) : (
          <InviteActions token={token} preview={preview} />
        )}
      </div>

      <Card className="mt-8">
        <CardBody>
          <h2 className="heading text-base">Before you decide</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Taking part is entirely your choice, and there is no penalty for declining. Nobody
            can accept on your behalf — not the person who invited you, not a moderator, not an
            administrator.
          </p>
          {/* What actually changes on accepting. Somebody consenting should know what they
              are consenting to before the fact, not discover it afterwards. */}
          <p className="mt-3 text-sm leading-relaxed text-muted">
            If you accept, you will be able to read the case and take part in its discussion,
            and the person who opened it will see that you accepted and how you are related to
            them. Your email address is never shared with them. You can withdraw later, which
            ends your access.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This invitation was created <RelativeTime value={preview.createdAt} /> and stops
            working <RelativeTime value={preview.expiresAt} />.
          </p>
          <div className="mt-4">
            <ButtonLink href="/safety" variant="ghost" size="sm">How consent and privacy work here</ButtonLink>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}