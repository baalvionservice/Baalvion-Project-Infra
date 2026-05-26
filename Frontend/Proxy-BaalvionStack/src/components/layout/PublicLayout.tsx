import { Outlet } from "react-router-dom";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { PageTransition } from "@/components/PageTransition";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <PublicFooter />
    </div>
  );
}
