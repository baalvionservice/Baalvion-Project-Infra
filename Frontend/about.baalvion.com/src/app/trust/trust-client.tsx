"use client"

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShieldCheck, Lock, FileText, Scale, CheckCircle2, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TrustClient() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 sm:pt-40 lg:pt-56 pb-24 sm:pb-32 lg:pb-48">
        <div className="section-container">
          <div className="max-w-5xl mb-24 sm:mb-32 lg:mb-48 animate-fade-in">
            <span className="section-label">Governance & Compliance</span>
            <h1 className="text-gray-900 mb-8 sm:mb-12 font-bold leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Built on <br/>Unwavering <span className="text-primary">Trust</span></h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 max-w-4xl leading-relaxed font-medium">
              Security, transparency, and international law are at the core of the Baalvion Nexus infrastructure. We architect for the highest global standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 mb-24 sm:mb-32 lg:mb-56">
            {[
              { icon: ShieldCheck, title: "AES-256 Encryption", desc: "Military-grade encryption for all data in transit and at rest." },
              { icon: Lock, title: "Zero-Knowledge", desc: "Your trade data is private by design, visible only to authorized nodes." },
              { icon: Scale, title: "Global Compliance", desc: "Real-time mapping of trade laws across 180+ jurisdictions." },
              { icon: Activity, title: "Immutable Audit", desc: "Transparent, cryptographically signed logs for every transaction." }
            ].map((item, i) => (
              <Card key={i} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-500 rounded-xl group">
                <CardContent className="p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-primary/10">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed text-gray-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 sm:gap-24 lg:gap-32 items-center">
            <div className="space-y-12 sm:space-y-16">
              <div className="space-y-4 sm:space-y-6">
                <span className="section-label">Standardization</span>
                <h2 className="text-gray-900 font-bold text-2xl sm:text-3xl lg:text-4xl">Adhering to the world's strictest protocols.</h2>
              </div>
              <div className="grid gap-4 sm:gap-6">
                {[
                  "GDPR & Data Privacy Excellence",
                  "SOC2 Type II Compliant Architecture",
                  "ISO 27001 Information Security",
                  "KYC/AML Global Standards"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl hover:border-primary/20 transition-all duration-500">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary flex-shrink-0" />
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/[0.03] p-8 sm:p-12 md:p-16 lg:p-24 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] border border-primary/10 text-center space-y-8 sm:space-y-12">
              <FileText className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-primary mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">Security & Compliance Documentation</h3>
              <p className="text-base sm:text-lg lg:text-xl mx-auto text-gray-600 font-medium">
                Request our complete security whitepaper and compliance certificates for your strategic audit and due diligence process.
              </p>
              <button className="btn-primary w-full h-14 sm:h-16 lg:h-20 rounded-xl text-base sm:text-lg lg:text-xl font-bold shadow-xl shadow-primary/20">
                Download Trust Bundle
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
