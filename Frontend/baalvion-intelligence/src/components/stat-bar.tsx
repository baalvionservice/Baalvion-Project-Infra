interface Stat {
  value: string;
  label: string;
}

export function StatBar({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="border-l border-border pl-4">
          <dd className="metric text-3xl font-semibold text-foreground md:text-4xl">{stat.value}</dd>
          <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}
