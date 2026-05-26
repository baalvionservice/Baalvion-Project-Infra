"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Download,
  Eye,
  History,
  Zap,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

/**
 * Heritage Bureau: The Issuance Bureau for Digital Certificates.
 * Formalize artifact authenticity and manage the global registry of provenance.
 */
export default function HeritageArchiveBureau() {
  const { scopedCertificates, currentUser } = useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleIssue = (id: string) => {
    toast({
      title: "Certificate Issued",
      description:
        "Institutional provenance has been authorized and dispatched to the client's archive.",
    });
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-plum">
            <Award className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Heritage Bureau
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">
            Provenance registry
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Management of institutional authenticity and archival documentation.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20">
            <Plus className="w-4 h-4 mr-3" /> ISSUE NEW CERTIFICATE
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
            <CardHeader className="border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl text-white">
                  Bureau Registry
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                  Verified artisanal heritage documents
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                  className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-48 focus:border-plum transition-all text-white"
                  placeholder="SEARCH ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Artifact
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Seal ID
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Client
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">
                    Resonance
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedCertificates.map((cert) => (
                  <TableRow
                    key={cert.id}
                    className="hover:bg-white/5 transition-colors border-white/5"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/80 uppercase">
                          {cert.artifactName}
                        </span>
                        <span className="text-[8px] text-white/20 uppercase tracking-tighter">
                          REF: {cert.productId?.toUpperCase() || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[9px] font-mono text-plum">
                      {cert.nfcSealId}
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-white/40 uppercase">
                      {(cert as any).clientName}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-bold text-gold">
                        {cert.provenanceScore}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-400 text-[7px] uppercase border-none"
                      >
                        {cert.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {scopedCertificates.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-40 text-center opacity-20"
                    >
                      <Award className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        Registry currently empty
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-12">
          <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3 text-gold">
                <History className="w-5 h-5" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">
                  Issuance Protocol
                </h4>
              </div>
              <p className="text-xs font-light italic leading-relaxed opacity-70">
                "Institutional documentation is the foundation of ownership.
                Every certificate must pass the curatorial board's heritage
                audit before global issuance."
              </p>
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="opacity-40">Audit accuracy</span>
                  <span className="text-gold">100.0%</span>
                </div>
                <div className="h-0.5 bg-white/5 w-full">
                  <div className="h-full bg-gold w-full" />
                </div>
              </div>
            </div>
          </Card>

          <div className="p-8 border border-white/5 bg-white/[0.02] space-y-6">
            <div className="flex items-center space-x-3 text-plum">
              <Zap className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                Market Integrity
              </h4>
            </div>
            <p className="text-[10px] text-white/40 italic leading-relaxed">
              "Blockchain-backed NFC seals ensure that the Maison's artifacts
              maintain their provenance across jurisdictional transfers."
            </p>
            <Button
              variant="outline"
              className="w-full border-white/10 text-white/60 h-12 rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black"
            >
              GENERATE COMPLIANCE REPORT
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
