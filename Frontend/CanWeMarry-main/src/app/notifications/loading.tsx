import { Container, Skeleton, SkeletonList } from '@/components/ui';

export default function Loading() {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container className="py-section"><Skeleton className="h-9 w-48" /></Container>
      </div>
      <Container width="prose" className="py-10"><SkeletonList count={5} label="Loading notifications" /></Container>
    </>
  );
}
