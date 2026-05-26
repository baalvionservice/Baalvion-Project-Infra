import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEnterprise, UserRole } from "@/contexts/EnterpriseContext";
import { Crown, Shield, BarChart3, Eye, ChevronDown, Lock, HeadphonesIcon, DollarSign, ShieldAlert } from "lucide-react";

const roleConfig: Record<UserRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-warning", description: "Full access to all features" },
  admin: { label: "Admin", icon: Shield, color: "text-primary", description: "Manage users and settings" },
  support: { label: "Support", icon: HeadphonesIcon, color: "text-accent", description: "View proxies & analytics, no billing" },
  finance: { label: "Finance", icon: DollarSign, color: "text-success", description: "Billing only, no proxy editing" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground", description: "Read-only access" },
  restricted: { label: "Restricted", icon: ShieldAlert, color: "text-destructive", description: "Limited proxy types only" },
};

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, demoMode } = useEnterprise();
  const [open, setOpen] = useState(false);
  
  const role = roleConfig[currentRole];
  const RoleIcon = role.icon;

  if (!demoMode.enabled) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RoleIcon className={`w-4 h-4 ${role.color}`} />
          <span className="hidden sm:inline">{role.label}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span>Switch Role (Demo)</span>
          <Badge variant="info" className="text-xs">Simulation</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(roleConfig) as UserRole[]).map((roleKey) => {
          const config = roleConfig[roleKey];
          const Icon = config.icon;
          const isActive = currentRole === roleKey;
          
          return (
            <DropdownMenuItem
              key={roleKey}
              onClick={() => setCurrentRole(roleKey)}
              className={isActive ? "bg-secondary" : ""}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div className="flex-1">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLocked?: boolean;
}

export function PermissionGate({ permission, children, fallback, showLocked = true }: PermissionGateProps) {
  const { hasPermission, currentRole } = useEnterprise();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showLocked) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex">
          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
            <Lock className="w-4 h-4 mr-2" />
            Restricted
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>This action is not available for {roleConfig[currentRole].label} role.</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface RoleRestrictedButtonProps {
  permission: string;
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function RoleRestrictedButton({
  permission,
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
}: RoleRestrictedButtonProps) {
  const { hasPermission, currentRole } = useEnterprise();
  const allowed = hasPermission(permission);
  
  if (allowed) {
    return (
      <Button variant={variant} size={size} onClick={onClick} className={className}>
        {children}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            variant={variant}
            size={size}
            disabled
            className={`opacity-50 cursor-not-allowed ${className}`}
          >
            <Lock className="w-3 h-3 mr-1" />
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Requires higher permission level ({roleConfig[currentRole].label})</p>
      </TooltipContent>
    </Tooltip>
  );
}