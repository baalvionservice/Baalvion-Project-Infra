import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import MarketplaceSidebar from "./components/marketplace-sidebar";

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col">
          <HeaderWrapper />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-1">
                <MarketplaceSidebar />
              </div>
              <div className="lg:col-span-4">{children}</div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
