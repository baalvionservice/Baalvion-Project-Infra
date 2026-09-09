import { ButtonLink, Container } from '@/components/ui';

export default function NotFound() {
  return (
    <Container width="prose" className="py-24 text-center">
      <h1 className="heading text-3xl">Not found</h1>
      {/* A case you are not entitled to see returns this page too — deliberately
          indistinguishable from one that does not exist. */}
      <p className="mx-auto mt-3 max-w-md text-muted">
        This page does not exist, or it is not shared with you.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/">Go to the home page</ButtonLink>
        <ButtonLink href="/resources" variant="secondary">Browse resources</ButtonLink>
      </div>
    </Container>
  );
}
