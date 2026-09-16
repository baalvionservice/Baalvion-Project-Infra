import { Container, SkeletonList } from '@/components/ui';

export default function Loading() {
  return (
    <Container className="py-10">
      <SkeletonList count={4} label="Loading" />
    </Container>
  );
}
