
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { NotificationPopover } from "@/components/dashboard/NotificationPopover";
import { Search, Globe, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar className="hidden lg:flex" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 max-w-md flex-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Access platform modules and trade tools</SheetDescription>
                <DashboardSidebar className="flex h-full w-full" isMobile />
              </SheetContent>
            </Sheet>

            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Search orders, products, or logistics..." 
                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                aria-label="Search trade records"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">Global Marketplace</span>
            </div>
            <div className="h-6 w-px bg-border hidden md:block" />
            
            <NotificationPopover />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">Global Mining Inc.</p>
                <p className="text-[10px] text-muted-foreground">Johannesburg, ZA</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 shrink-0" aria-label="User profile">
                GM
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
