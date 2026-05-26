
"use client";

import { CapOpsRole } from "@/lib/capital-ops/types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserCircle } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: CapOpsRole;
  onRoleChange: (role: CapOpsRole) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-3">
      <UserCircle className="h-4 w-4 text-muted-foreground" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity Context:</span>
      <Select value={currentRole} onValueChange={(val) => onRoleChange(val as CapOpsRole)}>
        <SelectTrigger className="h-8 w-[160px] bg-card border-border/50 text-xs font-bold">
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Admin">System Admin</SelectItem>
          <SelectItem value="Investor">Lead Investor</SelectItem>
          <SelectItem value="Board Viewer">Board Viewer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
