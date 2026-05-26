import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function EquityLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col">
          <HeaderWrapper />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
