import { Metadata } from "next";
import { EliteHostAdminClient } from "./elite-host-admin-client";

export const metadata: Metadata = {
  title: "Admin | Elite Hosted Parties",
  description: "Manage elite host parties, applications, and banners",
};

export default function EliteHostAdminPage() {
  return <EliteHostAdminClient />;
}
