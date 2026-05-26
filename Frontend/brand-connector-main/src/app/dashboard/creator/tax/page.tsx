"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileBadge,
  Download,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  FileDown,
  ExternalLink,
  Zap,
  Clock,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const TAX_SUMMARY = {
  totalIncome: 1245000,
  tdsDeducted: 124500, // 10%
  gstCollected: 224100, // 18%
  netPayout: 1120500,
};

const CERTIFICATES = [
  {
    id: "1",
    title: "Form 16A - Q1",
    period: "Apr - Jun 2024",
    status: "AVAILABLE",
    date: "2024-07-15",
  },
  {
    id: "2",
    title: "Form 16A - Q4",
    period: "Jan - Mar 2024",
    status: "AVAILABLE",
    date: "2024-04-15",
  },
  {
    id: "3",
    title: "Form 16A - Q3",
    period: "Oct - Dec 2023",
    status: "AVAILABLE",
    date: "2024-01-15",
  },
];

const INVOICE_HISTORY = [
  {
    id: "INV-4921",
    brand: "Lumina Tech",
    amount: 45000,
    gst: 8100,
    date: "2024-07-10",
    status: "PAID",
  },
  {
    id: "INV-4882",
    brand: "EcoVibe",
    amount: 12500,
    gst: 2250,
    date: "2024-06-28",
    status: "PAID",
  },
  {
    id: "INV-4751",
    brand: "FitFlow",
    amount: 22000,
    gst: 3960,
    date: "2024-06-15",
    status: "PAID",
  },
  {
    id: "INV-4620",
    brand: "Velvet Moon",
    amount: 35000,
    gst: 6300,
    date: "2024-05-20",
    status: "PAID",
  },
];

export default function CreatorTaxPage() {
  const { toast } = useToast();
  const [fy, setFy] = useState("2024-25");

  const handleDownload = (title: string) => {
    toast({
      title: "Downloading...",
      description: `Your ${title} is being generated.`,
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileBadge className="h-8 w-8 text-primary" />
            Tax & Compliance
          </h1>
          <p className="text-slate-500 font-medium">
            Download certificates, track TDS deductions and manage GST invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={fy} onValueChange={setFy}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-white font-bold border-slate-200">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Financial Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-25" className="font-bold">
                FY 2024 - 25
              </SelectItem>
              <SelectItem value="2023-24" className="font-bold">
                FY 2023 - 24
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-white h-11 border-slate-200"
            onClick={() => handleDownload("Tax Statement")}
          >
            <Download className="mr-2 h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-orange-50 border-orange-100 rounded-3xl p-6">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-900 font-black uppercase text-xs tracking-widest ml-2">
          Compliance Disclaimer
        </AlertTitle>
        <AlertDescription className="text-orange-700 font-medium text-sm mt-1 ml-2">
          All values shown are estimates based on platform transactions. TDS
          certificates are mock placeholders for this prototype. Please consult
          a qualified tax professional for official filings.
        </AlertDescription>
      </Alert>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Taxable Income",
            value: `₹${(TAX_SUMMARY.totalIncome / 100000).toFixed(2)}L`,
            icon: IndianRupee,
            color: "text-slate-900",
            bg: "bg-slate-100",
          },
          {
            label: "TDS Deducted",
            value: `₹${(TAX_SUMMARY.tdsDeducted / 100000).toFixed(2)}L`,
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "GST Collected",
            value: `₹${(TAX_SUMMARY.gstCollected / 100000).toFixed(2)}L`,
            icon: Zap,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Net Payouts",
            value: `₹${(TAX_SUMMARY.netPayout / 100000).toFixed(2)}L`,
            icon: CheckCircle2,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-2xl p-6 bg-white group hover:shadow-md transition-shadow">
              <div
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
                  stat.bg,
                  stat.color
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">
                {stat.value}
              </h3>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Documents & Certificates */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tax Certificates</CardTitle>
                <CardDescription>
                  Download your Form 16A and other quarterly tax artifacts.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px] uppercase">
                Synced with TDS Ledger
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-14">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Certificate
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Period
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                      Status
                    </TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CERTIFICATES.map((cert) => (
                    <TableRow
                      key={cert.id}
                      className="group hover:bg-slate-50 transition-colors border-slate-50 h-16"
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-bold text-slate-900">
                            {cert.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-500">
                        {cert.period}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase">
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl font-bold h-9 px-4 hover:bg-primary hover:text-white transition-all"
                          onClick={() => handleDownload(cert.title)}
                        >
                          <FileDown className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">GST Invoice Ledger</CardTitle>
              <CardDescription>
                Archive of tax invoices issued to brand partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-14">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Invoice ID
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Brand
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                      Amount
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                      GST (18%)
                    </TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                      View
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICE_HISTORY.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="group hover:bg-slate-50 transition-colors border-slate-50 h-16"
                    >
                      <TableCell className="pl-8 font-bold text-slate-900">
                        {inv.id}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-600">
                        {inv.brand}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        ₹{inv.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-emerald-600 font-bold">
                        ₹{inv.gst.toLocaleString()}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-slate-300 hover:text-primary transition-all"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right: Insights & Tools */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Filing Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                {
                  label: "Verified PAN Linked",
                  status: "DONE",
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                },
                {
                  label: "GSTIN Registered",
                  status: "ACTIVE",
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                },
                {
                  label: "Bank Acc Verified",
                  status: "DONE",
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                },
                {
                  label: "Digital Signature",
                  status: "PENDING",
                  icon: Clock,
                  color: "text-slate-300",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-sm font-bold text-slate-600">
                      {item.label}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black text-slate-400"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <FileBadge className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Audit Protection</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Baalvion automatically archives all campaign contracts and
                  payment receipts for 7 years to protect you during tax audits.
                </p>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg">
                View Audit Vault
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">
                Need Tax Help?
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                We've partnered with expert CAs to help creators file their
                returns at discounted rates.
              </p>
            </div>
            <Button
              variant="link"
              className="text-xs font-bold text-primary h-auto p-0"
            >
              Contact Tax Support
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
