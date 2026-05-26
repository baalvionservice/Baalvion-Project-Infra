import { Building2, ChevronDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/contexts/OrgContext";

export function OrgSwitcher() {
  const { currentOrg, allOrgs, switchOrg, planLabels, planColors } = useOrg();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-9 px-3">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {currentOrg.logo}
          </div>
          <span className="text-sm font-medium max-w-[120px] truncate">{currentOrg.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${planColors[currentOrg.plan]}`}>
            {planLabels[currentOrg.plan]}
          </Badge>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {allOrgs.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)} className="cursor-pointer">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {org.logo}
                </div>
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 ${planColors[org.plan]}`}>
                      {planLabels[org.plan]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{org.members} members</span>
                  </div>
                </div>
              </div>
              {currentOrg.id === org.id && <Check className="w-4 h-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground cursor-pointer">Manage organizations</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
