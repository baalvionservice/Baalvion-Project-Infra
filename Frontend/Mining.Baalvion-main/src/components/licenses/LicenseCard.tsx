import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileBadge } from "lucide-react";
import type { License } from "@/lib/content/types";
import { LicenseStatusBadge } from "./LicenseStatusBadge";

/** Days until expiry, or null when no genuine expiry date is on record. */
function expiryIndicator(expiresOn?: string): { text: string; cls: string } | null {
  if (!expiresOn) return null;
  const end = new Date(expiresOn).getTime();
  if (Number.isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: "Expired", cls: "text-rose-600" };
  if (days <= 90) return { text: `Expires in ${days} day${days === 1 ? "" : "s"}`, cls: "text-amber-600" };
  return { text: `Valid until ${new Date(expiresOn).toLocaleDateString()}`, cls: "text-emerald-600" };
}

export function LicenseCard({ license }: { license: License }) {
  const expiry = expiryIndicator(license.expiresOn);
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/5 p-2.5 text-primary">
              <FileBadge className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">{license.title}</h3>
          </div>
          <LicenseStatusBadge status={license.status} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authority</dt>
            <dd className="text-slate-700 font-medium">{license.authority ?? "Pending disclosure"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference</dt>
            <dd className="text-slate-700 font-medium">{license.number ?? "On request"}</dd>
          </div>
        </dl>

        {expiry && <p className={`text-xs font-bold ${expiry.cls}`}>{expiry.text}</p>}

        {license.document ? (
          <a href={license.document.url} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gap-2 font-bold">
              <Download className="h-4 w-4" /> Download document
            </Button>
          </a>
        ) : (
          <Link href="/contact" className="block">
            <Button variant="outline" className="w-full gap-2 font-bold border-slate-200 text-slate-600">
              Documentation available on request
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
