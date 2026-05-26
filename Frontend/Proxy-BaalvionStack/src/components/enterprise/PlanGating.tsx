import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEnterprise, PlanType } from "@/contexts/EnterpriseContext";
import { useState } from "react";
import {
  Lock,
  Sparkles,
  Check,
  X,
  Zap,
  Crown,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const planDetails: Record<PlanType, { name: string; price: string; color: string; features: string[] }> = {
  free: {
    name: "Free",
    price: "$0",
    color: "text-muted-foreground",
    features: ["1 GB bandwidth", "10 proxies", "Community support"],
  },
  starter: {
    name: "Starter",
    price: "$49",
    color: "text-primary",
    features: ["10 GB bandwidth", "100 proxies", "1 sub-user", "Email support", "Basic presets"],
  },
  pro: {
    name: "Pro",
    price: "$199",
    color: "text-accent",
    features: ["100 GB bandwidth", "1,000 proxies", "5 sub-users", "Priority support", "Advanced analytics", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    color: "text-warning",
    features: ["Unlimited bandwidth", "Unlimited proxies", "Unlimited users", "24/7 support", "Custom integrations", "SLA guarantee"],
  },
};

interface PlanGatedFeatureProps {
  feature: string;
  requiredPlan: PlanType;
  children: ReactNode;
  showUpgrade?: boolean;
}

export function PlanGatedFeature({ feature, requiredPlan, children, showUpgrade = true }: PlanGatedFeatureProps) {
  const { isPlanFeatureAvailable, currentPlan, getUpgradeMessage } = useEnterprise();
  const [showModal, setShowModal] = useState(false);

  const planOrder: PlanType[] = ["free", "starter", "pro", "enterprise"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);
  const hasAccess = currentPlanIndex >= requiredPlanIndex;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <div className="opacity-50 pointer-events-none blur-[1px]">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowModal(true)}
              >
                <Lock className="w-4 h-4" />
                {planDetails[requiredPlan].name} Feature
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getUpgradeMessage(feature)}</p>
        </TooltipContent>
      </Tooltip>

      {showUpgrade && (
        <ComparePlansModal
          open={showModal}
          onOpenChange={setShowModal}
          highlightPlan={requiredPlan}
        />
      )}
    </>
  );
}

interface LockedButtonProps {
  requiredPlan: PlanType;
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function LockedButton({
  requiredPlan,
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
}: LockedButtonProps) {
  const { currentPlan } = useEnterprise();
  const [showModal, setShowModal] = useState(false);

  const planOrder: PlanType[] = ["free", "starter", "pro", "enterprise"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);
  const hasAccess = currentPlanIndex >= requiredPlanIndex;

  if (hasAccess && onClick) {
    return (
      <Button variant={variant} size={size} onClick={onClick} className={className}>
        {children}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => setShowModal(true)}
        className={`gap-2 border-dashed ${className}`}
      >
        <Lock className="w-4 h-4" />
        {children}
        <Badge variant="secondary" className="ml-1 text-xs">
          {planDetails[requiredPlan].name}
        </Badge>
      </Button>
      <ComparePlansModal
        open={showModal}
        onOpenChange={setShowModal}
        highlightPlan={requiredPlan}
      />
    </>
  );
}

interface ComparePlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightPlan?: PlanType;
}

export function ComparePlansModal({ open, onOpenChange, highlightPlan }: ComparePlansModalProps) {
  const { currentPlan, setCurrentPlan } = useEnterprise();

  const handleSelectPlan = (plan: PlanType) => {
    setCurrentPlan(plan);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock more features and scale your proxy network.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {(Object.keys(planDetails) as PlanType[]).map((plan) => {
            const details = planDetails[plan];
            const isCurrentPlan = currentPlan === plan;
            const isHighlighted = highlightPlan === plan;

            return (
              <Card
                key={plan}
                className={`relative ${
                  isHighlighted
                    ? "border-primary ring-2 ring-primary/20"
                    : isCurrentPlan
                    ? "border-accent"
                    : ""
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-primary">
                      Recommended
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {plan === "enterprise" && <Crown className="w-4 h-4 text-warning" />}
                    <CardTitle className={`text-lg ${details.color}`}>
                      {details.name}
                    </CardTitle>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{details.price}</span>
                    {plan !== "enterprise" && plan !== "free" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {details.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isHighlighted ? "hero" : "outline"}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : `Select ${details.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          * This is a demo. In production, you would be redirected to the billing page.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function UsageWarningBanner() {
  const { usage, getUsageWarningLevel, currentPlan } = useEnterprise();
  const warningLevel = getUsageWarningLevel();

  if (warningLevel === "normal") return null;

  const percentage = Math.min((usage.bandwidthUsed / usage.bandwidthLimit) * 100, 100);

  const config = {
    warning: {
      icon: AlertTriangle,
      color: "bg-warning/10 border-warning/30 text-warning",
      message: `You've used ${percentage.toFixed(0)}% of your bandwidth. Consider upgrading.`,
    },
    critical: {
      icon: AlertTriangle,
      color: "bg-destructive/10 border-destructive/30 text-destructive",
      message: `Critical: ${percentage.toFixed(0)}% bandwidth used. Upgrade now to avoid interruption.`,
    },
    exceeded: {
      icon: X,
      color: "bg-destructive/20 border-destructive/50 text-destructive",
      message: "You've exceeded your bandwidth limit. Service may be throttled.",
    },
  };

  const current = config[warningLevel];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-3 rounded-lg border ${current.color} mb-4`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{current.message}</span>
      </div>
      <Link to="/app/billing">
        <Button variant="outline" size="sm" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Upgrade Plan
        </Button>
      </Link>
    </motion.div>
  );
}

export function PlanBadge() {
  const { currentPlan } = useEnterprise();
  const details = planDetails[currentPlan];

  return (
    <Badge variant="secondary" className={`${details.color} gap-1`}>
      {currentPlan === "enterprise" && <Crown className="w-3 h-3" />}
      {details.name}
    </Badge>
  );
}
