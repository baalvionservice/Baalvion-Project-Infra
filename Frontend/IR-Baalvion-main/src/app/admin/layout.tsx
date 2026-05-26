import { Sidebar } from "@/components/admin/sidebar";
import { authService } from "@/core/services/auth.service";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In a real Server Component with real auth, we would check the token here.
  // For the mock, we handle redirection in a client-side wrapper if needed, 
  // but we can provide the shell structure here.

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Control Panel</h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold">AD</div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
