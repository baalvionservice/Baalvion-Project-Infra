import BaalvionLoader from '@/components/brand/BaalvionLoader';

// Route-level fallback: every console page that suspends shows the branded mark
// instead of a frozen screen while its segment loads.
export default function DashboardLoading() {
  return <BaalvionLoader full />;
}
