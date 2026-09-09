import { Skeleton } from '@/components/ui/skeleton';

// Route-level loading state. Mirrors the Hero block's paddings and measures
// (bg-white, px-6 pt-24 pb-20, max-w-[860px] headline over a max-w-[920px]
// preview) so the marketing page swaps in without shifting.
export default function Loading() {
  return (
    <div
      className="bg-white px-6 pt-24 pb-20 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>

      <Skeleton className="h-7 w-52 rounded-full mx-auto mb-6" />

      <div className="max-w-[860px] mx-auto space-y-4 mb-5">
        <Skeleton className="h-12 sm:h-16 w-full" />
        <Skeleton className="h-12 sm:h-16 w-4/5 mx-auto" />
      </div>

      <div className="max-w-[520px] mx-auto space-y-3 mb-9">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4 mx-auto" />
      </div>

      <div className="flex gap-3 justify-center flex-wrap mb-11">
        <Skeleton className="h-[52px] w-48 rounded-[14px]" />
        <Skeleton className="h-[52px] w-48 rounded-[14px]" />
      </div>

      <Skeleton className="max-w-[920px] h-64 sm:h-80 mx-auto mt-12 rounded-2xl" />
    </div>
  );
}
