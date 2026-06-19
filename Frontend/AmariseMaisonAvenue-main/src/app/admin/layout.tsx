import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";

/**
 * Amarisé admin console layout.
 *
 * By default this renders the LOCAL admin console (sidebar + top bar + page).
 * If an external console is configured via NEXT_PUBLIC_ADMIN_CONSOLE_URL, every
 * /admin/* hit redirects there instead (opt-in centralization). With no env set,
 * the local console is served — so the live-wired admin surfaces are reachable.
 */
const EXTERNAL_ADMIN_CONSOLE_URL = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (EXTERNAL_ADMIN_CONSOLE_URL) redirect(EXTERNAL_ADMIN_CONSOLE_URL);
  return <AdminShell>{children}</AdminShell>;
}
