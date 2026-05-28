interface StatusDotProps {
  status: "online" | "offline" | "pending" | "active" | "inactive" | "live" | "upcoming" | "expired";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  online: { color: "bg-green-400", label: "Online", animate: true },
  live: { color: "bg-green-400", label: "Live", animate: true },
  active: { color: "bg-green-400", label: "Active", animate: false },
  offline: { color: "bg-muted-foreground/50", label: "Offline", animate: false },
  inactive: { color: "bg-muted-foreground/50", label: "Inactive", animate: false },
  pending: { color: "bg-amber-400", label: "Pending", animate: true },
  upcoming: { color: "bg-blue-400", label: "Upcoming", animate: false },
  expired: { color: "bg-red-400", label: "Expired", animate: false },
};

const sizeConfig = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

const StatusDot = ({ status, showLabel = false, size = "md" }: StatusDotProps) => {
  const config = statusConfig[status] || statusConfig.offline;
  const sizeClass = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClass} rounded-full ${config.color}`} />
        {config.animate && (
          <div className={`absolute inset-0 ${sizeClass} rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className={`text-sm ${status === "online" || status === "live" || status === "active" ? "text-green-400" : status === "pending" ? "text-amber-400" : "text-muted-foreground"}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default StatusDot;
