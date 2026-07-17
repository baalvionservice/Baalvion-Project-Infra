'use client';

const CARD = '#181C22';
const BORDER = '#242A33';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

export default function QuoteSkeleton() {
  return (
    <div>
      <Pulse className="mb-4 h-4 w-32" />
      <div className="mb-5 flex items-center gap-3">
        <Pulse className="h-10 w-10 rounded" />
        <div>
          <Pulse className="mb-2 h-5 w-48" />
          <Pulse className="h-3 w-32" />
        </div>
      </div>
      <div className="mb-5 rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
        <Pulse className="mb-2 h-8 w-40" />
        <Pulse className="h-3 w-56" />
      </div>
      <div className="mb-5 rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
        <Pulse className="mb-3 h-6 w-64" />
        <Pulse className="h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Pulse className="h-48 rounded-xl" />
        <Pulse className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
