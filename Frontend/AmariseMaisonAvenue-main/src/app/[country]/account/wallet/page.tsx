"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Wallet,
  Plus,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * Maison Treasury: Institutional Digital Wallet.
 * Handles deposits, artifact payments, and service fee deductions.
 * Optimized with Fintech-grade tabular typography.
 */
export default function MaisonWalletPage() {
  const { country } = useParams();
  const countryCode = (country as string) || "us";
  const { activeVip, topUpWallet } = useAppStore();
  const { toast } = useToast();

  const [topUpAmount, setTopUpAmount] = useState("5000");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Payment Processing
    setTimeout(() => {
      topUpWallet(parseFloat(topUpAmount));
      setIsProcessing(false);
      toast({
        title: "Treasury Funding Successful",
        description: `$${topUpAmount} has been settled into your Maison balance.`,
      });
    }, 1500);
  };

  if (!activeVip) return null;

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
            <Link href={`/${countryCode}/account`}>Dashboard</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-plum">Maison Treasury</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
            Treasury
          </h1>
          <p className="text-sm text-gray-500 font-light italic">
            Managing your institutional available liquidity.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Wallet View */}
        <div className="lg:col-span-8 space-y-12">
          <Card className="bg-black text-white p-12 shadow-2xl relative overflow-hidden rounded-none border-none">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Wallet className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col md:row justify-between items-center gap-12">
              <div className="space-y-4 text-center md:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">
                  Available Liquidity
                </p>
                <div className="text-7xl font-body font-semibold tracking-tighter tabular">
                  $
                  {activeVip.walletBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="flex items-center space-x-2 text-[9px] font-bold uppercase text-white/40 tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-gold" />
                    <span>FCA Regulated Escrow</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[9px] font-bold uppercase text-white/40 tracking-widest">
                    <Zap className="w-3 h-3 text-gold" />
                    <span>Instant Settlement</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <form
                  onSubmit={handleTopUp}
                  className="bg-white/5 backdrop-blur-md p-8 border border-white/10 space-y-6 max-w-sm"
                >
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold text-white/40 tracking-widest">
                      Add Funds
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gold">
                        $
                      </span>
                      <Input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="bg-black/40 border-white/10 h-14 pl-10 text-xl font-bold text-white rounded-none focus:border-gold outline-none tabular"
                      />
                    </div>
                  </div>
                  <Button
                    disabled={isProcessing}
                    className="w-full h-14 bg-gold text-black hover:bg-white rounded-none text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
                  >
                    {isProcessing ? "PROCESSING..." : "FUND TREASURY"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
              TRANSACTIONAL LEDGER
            </h3>
            <Card className="bg-white border-border shadow-sm overflow-hidden rounded-none">
              <Table>
                <TableHeader className="bg-ivory/50">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold pl-8">
                      Activity
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Category
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                      Yield Delta
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeVip.walletHistory.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-ivory/30 transition-colors"
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center space-x-4">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              tx.amount > 0
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            )}
                          >
                            {tx.amount > 0 ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight text-gray-900">
                              {tx.description}
                            </p>
                            <p className="text-[8px] text-gray-400 font-mono uppercase">
                              REF: {tx.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[8px] uppercase tracking-widest font-bold border-none bg-slate-50 text-slate-500"
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-gray-400 font-medium font-mono">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <span
                          className={cn(
                            "text-sm font-bold tabular",
                            tx.amount > 0 ? "text-green-600" : "text-gray-900"
                          )}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>

        {/* Informational Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-ivory border-border p-8 space-y-8 rounded-none">
            <div className="flex items-center space-x-3 text-plum">
              <Info className="w-5 h-5" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em]">
                Maison Protocol
              </h4>
            </div>
            <div className="space-y-6">
              <ProtocolItem
                title="Instant Settlement"
                desc="Available funds are used for immediate artifact reservations."
              />
              <ProtocolItem
                title="Escrow Security"
                desc="All deposits are held in tiered institutional-grade accounts."
              />
              <ProtocolItem
                title="Service Billing"
                desc="Live viewing fees and curatorial consulting are billed here."
              />
            </div>
          </Card>

          <Card className="bg-plum/5 border-plum/10 p-8 space-y-6 rounded-none">
            <div className="flex items-center space-x-3 text-plum">
              <CreditCard className="w-5 h-5" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                Saved Methods
              </h4>
            </div>
            <div className="p-4 bg-white border border-border flex items-center justify-between group cursor-pointer hover:border-plum transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-6 bg-slate-900 rounded-sm flex items-center justify-center text-[6px] font-bold text-white italic">
                  VISA
                </div>
                <span className="text-xs font-bold tracking-tighter tabular">
                  •••• 1924
                </span>
              </div>
              <Badge className="bg-green-50 text-green-600 text-[7px] uppercase border-none">
                Primary
              </Badge>
            </div>
            <Button
              variant="outline"
              className="w-full border-dashed border-border h-12 text-[9px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3 h-3 mr-2" /> ADD INSTITUTIONAL CARD
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProtocolItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-tight text-gray-900">
        {title}
      </p>
      <p className="text-[11px] text-gray-500 italic font-light leading-relaxed">
        "{desc}"
      </p>
    </div>
  );
}

function ProtocolRow({
  label,
  desc,
  enabled = false,
}: {
  label: string;
  desc: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="space-y-1">
        <p className="text-sm font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-400 font-light italic">{desc}</p>
      </div>
      <Switch
        defaultChecked={enabled}
        className="data-[state=checked]:bg-plum"
      />
    </div>
  );
}
