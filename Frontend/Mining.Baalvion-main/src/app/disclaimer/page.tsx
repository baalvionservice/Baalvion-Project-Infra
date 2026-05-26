import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";
import { AlertTriangle, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: 'Disclaimer | Baalvion Mining Inc.',
  description: 'Legal disclaimers for Baalvion Mining Inc. global industrial network.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="container px-4 md:px-8 max-w-4xl mx-auto py-16 flex-1">
        <div className="bg-white p-8 md:p-12 lg:p-16 rounded-[2.5rem] shadow-sm space-y-12">
          <header className="space-y-4 border-b pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-100">
              <AlertTriangle className="h-4 w-4" /> Legal Governance
            </div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Legal Disclaimer</h1>
            <p className="text-sm text-slate-500 font-medium italic uppercase tracking-widest">Effective Date: May 20, 2024</p>
          </header>
          
          <div className="space-y-10 text-slate-600 leading-relaxed">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><FileText className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Market Information</h2>
              </div>
              <p>The market data, pricing indices, and intelligence reports provided by Baalvion Mining Inc. are for informational purposes only. While we strive for absolute accuracy, commodity prices are subject to extreme volatility and external market forces. Past performance is not indicative of future results.</p>
            </section>
            
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><Scale className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trade Responsibility</h2>
              </div>
              <p>Baalvion Mining Inc. facilitates connections between verified buyers and sellers but does not assume liability for the commercial performance of trade contracts outside of its verified escrow and compliance protocols. Each entity is responsible for its own due diligence and adherence to international trade laws.</p>
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
