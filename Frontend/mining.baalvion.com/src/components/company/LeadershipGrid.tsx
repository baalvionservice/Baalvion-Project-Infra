import { ExecutiveProfileCard, type ExecutiveProfile } from "./ExecutiveProfileCard";

interface LeadershipGridProps {
  profiles: ExecutiveProfile[];
}

/**
 * Responsive grid of executive leadership slots. Profiles are passed in by the
 * page; this component owns layout only, not data fabrication.
 */
export function LeadershipGrid({ profiles }: LeadershipGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <ExecutiveProfileCard key={profile.id} {...profile} />
      ))}
    </div>
  );
}
