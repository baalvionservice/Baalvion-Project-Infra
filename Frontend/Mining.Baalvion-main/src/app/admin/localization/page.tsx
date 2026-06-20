
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Globe, 
  Languages, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  Download,
  UploadCloud,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLocalizationPage() {
  const [languages] = useState([
    { code: "en", name: "English", native: "English", status: "Active", coverage: 100 },
    { code: "zh", name: "Chinese", native: "中文", status: "Active", coverage: 92 },
    { code: "ar", name: "Arabic", native: "العربية", status: "Active", coverage: 84 },
    { code: "es", name: "Spanish", native: "Español", status: "In Progress", coverage: 45 },
  ]);

  const [translationKeys] = useState([
    { key: "nav.marketplace", namespace: "COMMON", en: "Marketplace", zh: "市场", status: "VERIFIED" },
    { key: "dashboard.total_revenue", namespace: "DASHBOARD", en: "Total Revenue", zh: "总收入", status: "VERIFIED" },
    { key: "error.kyc_rejected", namespace: "COMMON", en: "Your verification was rejected.", zh: "您的验证被拒绝。", status: "MISSING_AR" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Languages className="h-8 w-8 text-primary" />
            Global Localization
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage platform languages, UI translations, and regional data settings.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <UploadCloud className="h-4 w-4" /> Import JSON
          </Button>
          <Button className="bg-primary text-white font-bold gap-2">
            <Plus className="h-4 w-4" /> Add Language
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Locales", val: "06", icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Keys", val: "1,242", icon: Languages, color: "text-primary", bg: "bg-primary/5" },
          { label: "Missing Trans.", val: "142", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Global Coverage", val: "88%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="keys" className="px-8 font-bold">Translation Keys</TabsTrigger>
          <TabsTrigger value="languages" className="px-8 font-bold">Language Registry</TabsTrigger>
          <TabsTrigger value="content" className="px-8 font-bold">Dynamic Content</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search key or base text..." className="pl-10 h-10 border-slate-200" />
                </div>
                <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Namespaces</Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold"><Download className="h-4 w-4" /> Export for Translation</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Key / Namespace</TableHead>
                  <TableHead className="font-bold">Base (English)</TableHead>
                  <TableHead className="font-bold">Comparison (zh)</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translationKeys.map((k) => (
                  <TableRow key={k.key} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{k.namespace}</span>
                        <span className="font-bold text-slate-900 text-sm">{k.key}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{k.en}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{k.zh || "---"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold",
                        k.status === "VERIFIED" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                      )}>
                        {k.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {languages.map((lang) => (
                <Card key={lang.code} className="border-none shadow-sm group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 border group-hover:border-primary/20 transition-colors">
                        {lang.code.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-slate-900">{lang.name}</h4>
                          <span className="text-sm text-slate-400">({lang.native})</span>
                          <Badge className={cn(
                            "text-[9px] font-bold px-2 py-0",
                            lang.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>{lang.status}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${lang.coverage}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{lang.coverage}% Translated</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="font-bold">Edit Details</Button>
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Review Strings <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 p-8 opacity-10">
                  <Languages className="h-48 w-48" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Regional Standards</CardTitle>
                  <CardDescription className="text-slate-400">Define global formatting rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Metric System</span>
                      <Badge className="bg-emerald-500">Global Default</Badge>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Base Currency</span>
                      <span className="text-xs font-bold text-primary">USD ($)</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Date ISO 8601</span>
                      <span className="text-xs font-bold text-slate-400">Enforced</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg">
                    Manage Global Config
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase">Automation Tip</p>
                  <p className="text-xs text-amber-600 leading-relaxed mt-1">
                    Use our AI-assisted machine translation to pre-fill missing strings. Always require human verification for legal terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
