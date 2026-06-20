
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Pickaxe, 
  ChevronRight, 
  CheckCircle2, 
  Upload,
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ComplianceOnboarding() {
  const [currentLevel, setCurrentLevel] = useState(2);

  const levels = [
    { 
      id: 1, 
      title: "Level 1: Basic Identity", 
      status: "COMPLETED", 
      desc: "Email, Phone, and User Identity verification.",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    { 
      id: 2, 
      title: "Level 2: Business Verification", 
      status: "PENDING", 
      desc: "Company registration and Tax ID verification.",
      icon: Building2,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    { 
      id: 3, 
      title: "Level 3: Industry Certification", 
      status: "LOCKED", 
      desc: "Mining Licenses and Export Permits.",
      icon: Pickaxe,
      color: "text-slate-400",
      bg: "bg-slate-50"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Compliance Onboarding</h1>
        <p className="text-muted-foreground">Complete tiered verification to unlock full marketplace capabilities.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-bold">Overall Progress: 35%</h3>
                <p className="text-primary-foreground/70 text-sm">Verified company profiles receive 4x more RFQ responses.</p>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <Progress value={35} className="h-2 bg-white/20" />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">
                  <span>Incomplete</span>
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {levels.map((level) => (
            <Card key={level.id} className={cn(
              "border-none shadow-sm transition-all",
              level.status === "LOCKED" ? "opacity-60 grayscale" : "hover:shadow-md"
            )}>
              <CardContent className="p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn("p-4 rounded-2xl", level.bg, level.color)}>
                    <level.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-slate-900">{level.title}</h4>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        level.status === "COMPLETED" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                        level.status === "PENDING" ? "border-amber-200 text-amber-700 bg-amber-50" :
                        "border-slate-200 text-slate-500 bg-slate-50"
                      )}>
                        {level.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{level.desc}</p>
                  </div>
                </div>
                {level.status !== "LOCKED" && (
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Action Required: Level 2
            </CardTitle>
            <CardDescription>Upload these documents to unlock bulk trading.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Business Registration</label>
                  <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50 transition-colors cursor-pointer border-slate-200 group">
                    <Upload className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Click to upload Certificate</p>
                    <p className="text-[9px] text-slate-400">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Tax ID / VAT Certificate</label>
                  <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50 transition-colors cursor-pointer border-slate-200 group">
                    <Upload className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Click to upload Tax Proof</p>
                    <p className="text-[9px] text-slate-400">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
              <Info className="h-6 w-6 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Verification usually takes <strong>24-48 business hours</strong>. Our compliance team will review the documents against global KYC/KYB databases.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" className="font-bold">Save Draft</Button>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-12">Submit for Review</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
