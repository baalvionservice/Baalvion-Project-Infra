import { Users, BarChart3, MessageSquare, DollarSign, Crown, Video, Package, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  type: "users" | "chart" | "message" | "dollar" | "crown" | "video" | "package" | "default";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  users: Users,
  chart: BarChart3,
  message: MessageSquare,
  dollar: DollarSign,
  crown: Crown,
  video: Video,
  package: Package,
  default: AlertCircle,
};

const EmptyState = ({ type, title, description, action }: EmptyStateProps) => {
  const Icon = iconMap[type] || iconMap.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center protocol-glow">
          <Icon className="w-10 h-10 text-primary/60" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
      </div>
      <h3 className="text-xl font-light text-foreground mb-2 tracking-wide">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
