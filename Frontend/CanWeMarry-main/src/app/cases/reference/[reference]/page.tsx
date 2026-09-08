
import { redirect } from 'next/navigation';
import { ButtonLink, Container, ErrorState } from '@/components/ui';
import { cases } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Find a case');
export const dynamic = 'force-dynamic';

/**
 * Reaching a case by the short reference printed on it (CWM-XXXXXX).
 *
 * A reference is a convenience for someone who was given one — it grants nothing. The
 * server resolves it under exactly the same visibility rules as the id, so a reference for
 * a case the caller may not see answers 404, the same as one that does not exist. That
 * matters more here than elsewhere: references are short and typed by hand, so this is the
 * endpoint somebody would guess at.
 */
export default async function CaseReferencePage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const result = await cases.byReference(reference, await serverOptions());

  if (result.ok) redirect(`/cases/${result.data.id}`);

  return (
    <Container width="prose" className="py-20">
      <ErrorState
        as="h1"
        title="We could not find that case"
        message="Either no case has that reference, or it is not shared with you. Check the reference was typed correctly — they look like CWM-7K3P2Q."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/cases" variant="secondary">Explore cases</ButtonLink>
            <ButtonLink href="/">Go to the home page</ButtonLink>
          </div>
        }
      />
    </Container>
  );
}