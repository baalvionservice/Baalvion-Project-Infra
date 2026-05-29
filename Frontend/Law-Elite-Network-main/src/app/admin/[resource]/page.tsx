"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/console/AdminShell";
import ResourceTable from "@/components/admin/console/ResourceTable";
import { getConfig } from "@/components/admin/console/registry";

export default function AdminResourcePage() {
  const params = useParams();
  const resource = String(params?.resource || "");
  const config = getConfig(resource);

  return (
    <AdminShell title={config?.title || "Not found"}>
      {config ? (
        <div className="space-y-5">
          {config.subtitle && <p className="text-sm text-muted-foreground -mt-1">{config.subtitle}</p>}
          <ResourceTable key={resource} config={config} />
        </div>
      ) : (
        <div className="text-muted-foreground">Unknown admin section &quot;{resource}&quot;.</div>
      )}
    </AdminShell>
  );
}
