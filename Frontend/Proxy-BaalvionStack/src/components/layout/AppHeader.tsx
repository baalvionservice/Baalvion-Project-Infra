import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { OrgSwitcher } from "./OrgSwitcher";
import { StatusBar } from "./StatusBar";
import { RoleSwitcher } from "@/components/enterprise/RoleSwitcher";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <OrgSwitcher />
        <StatusBar />
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search... (⌘K)"
            className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
            onFocus={(e) => {
              e.target.blur();
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <RoleSwitcher />
        <ThemeToggle />
        <NotificationCenter />
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="ghost" className="gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">John Doe</span>
        </Button>
      </div>
    </header>
  );
}