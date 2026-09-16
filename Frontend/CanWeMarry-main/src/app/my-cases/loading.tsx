import { Container, Skeleton, SkeletonList } from '@/components/ui';

export default function Loading() {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container className="py-section"><Skeleton className="h-9 w-44" /></Container>
      </div>
      <Container className="py-10"><SkeletonList count={4} label="Loading your cases" /></Container>
    </>
  );
}
