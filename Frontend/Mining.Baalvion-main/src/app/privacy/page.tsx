import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";
import { ShieldCheck, UserCheck, Lock, Globe, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: 'Privacy Policy | Baalvion Mining Inc.',
  description: 'Information about how Baalvion Mining Inc. collects, uses, and protects your business and personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="container px-4 md:px-8 max-w-4xl mx-auto py-16 flex-1">
        <div className="bg-white p-8 md:p-12 lg:p-16 rounded-[2.5rem] shadow-sm space-y-12">
          <header className="space-y-4 border-b pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">
              <ShieldCheck className="h-4 w-4" /> GDPR & CCPA Compliant
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-slate-500 font-medium italic uppercase tracking-widest">Effective Date: May 20, 2024</p>
          </header>
          
          <div className="grid gap-12 text-slate-600 leading-relaxed">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><FileText className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Data Collection & Usage</h2>
              </div>
              <p>Baalvion Mining Inc. collects essential business data, including registration details, contact information, and trade certifications to facilitate a secure marketplace. This data is managed by Baalvion Industries Private Limited and is used solely for verification, trade settlement, and logistics coordination.</p>
            </section>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><Globe className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Global Regulatory Compliance</h2>
              </div>
              <p>Our platform adheres to GDPR (EU), CCPA (US), and India IT Rules 2021. Under these regulations, you have the following rights regarding your data:</p>
              <ul className="list-disc pl-8 space-y-3 text-sm">
                <li><strong>Right to Access:</strong> Request a copy of all data stored on your industrial profile.</li>
                <li><strong>Right to Erasure:</strong> Request the deletion of your account and associated verification data.</li>
                <li><strong>Right to Portability:</strong> Export your transaction and shipment history.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><Lock className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Data Security</h2>
              </div>
              <p>All sensitive documents, including mining licenses and financial records, are encrypted at rest using AES-256 and in transit via TLS 1.3. Access is strictly governed by role-based permissions and monitored by our internal security sentinel.</p>
            </section>

            <div className="pt-12 border-t mt-12 bg-slate-50 p-8 rounded-3xl">
              <p className="text-xs text-slate-500 font-bold leading-relaxed italic uppercase tracking-tight">
                "Baalvion Mining Inc. is a global mining and commodity brand operated by Baalvion Industries Private Limited, a company incorporated in India with Corporate Identification Number (CIN) U43121OD2025PTC048479."
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
