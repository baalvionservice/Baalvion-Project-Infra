"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  Globe,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { companyApi, type MiningCompany } from "@/lib/api-client";

function SupplierComparisonContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  const [suppliers, setSuppliers] = useState<MiningCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await companyApi.compare(ids);

      if (cancelled) return;

      if (result.ok) {
        setSuppliers(result.data);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("ids")]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="bg-white border-b py-8">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/directory"
              className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline mb-2"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Directory
            </Link>
            <h1 className="text-3xl font-headline font-bold text-slate-900">
              Supplier Comparison
            </h1>
            <p className="text-sm text-slate-500">
              Evaluating weighted trade metrics across {ids.length} industrial{" "}
              {ids.length === 1 ? "supplier" : "suppliers"}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="font-bold">
              Export PDF
            </Button>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
              Invite All to RFQ
            </Button>
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium">Loading supplier data…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 text-slate-500 py-12">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p>
              Failed to load supplier comparison: {error}.{" "}
              <Link href="/directory" className="text-primary font-bold hover:underline">
                Return to Directory
              </Link>
            </p>
          </div>
        )}

        {!loading && !error && suppliers.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <p className="font-medium">No suppliers selected for comparison.</p>
            <Link href="/directory" className="text-primary font-bold hover:underline mt-2 inline-block">
              Browse the Directory
            </Link>
          </div>
        )}

        {!loading && !error && suppliers.length > 0 && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[200px] font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                      Trade Metric
                    </TableHead>
                    {suppliers.map((s) => (
                      <TableHead
                        key={s.id}
                        className="min-w-[250px] p-6 text-center"
                      >
                        <div className="space-y-3">
                          <div className="h-16 w-16 bg-primary/5 rounded-2xl mx-auto flex items-center justify-center border border-slate-100">
                            <Globe className="h-8 w-8 text-primary opacity-20" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {s.name}
                          </h3>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i <= Math.floor(s.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Operational Region
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center font-medium">
                        {s.country}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Years Active
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center font-medium">
                        {s.yearsActive} Years
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Mining License
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center">
                        <div className="flex justify-center">
                          {s.verifiedMiner ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Export Permit
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center">
                        <div className="flex justify-center">
                          {s.verifiedExporter ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Fulfillment Rate
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center">
                        <span className="text-emerald-600 font-bold">
                          {s.fulfillmentRate}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-slate-600 bg-slate-50/20">
                      Avg. Lead Time
                    </TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="text-center font-medium">
                        {s.avgLeadTime}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="border-t-2 border-slate-100">
                    <TableCell className="bg-slate-50/50"></TableCell>
                    {suppliers.map((s) => (
                      <TableCell key={s.id} className="p-6">
                        <div className="flex flex-col gap-2">
                          <Button className="w-full bg-primary text-white font-bold gap-2">
                            <MessageSquare className="h-4 w-4" /> Message
                          </Button>
                          <Link href={`/directory/${s.id}`} className="w-full">
                            <Button
                              variant="outline"
                              className="w-full font-bold border-slate-200"
                            >
                              Full Profile
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function SupplierComparisonPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>}>
      <SupplierComparisonContent />
    </Suspense>
  );
}
