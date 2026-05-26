import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Terms of Service | Baalvion Mining Inc.',
  description: 'Legal terms and conditions for using the Baalvion Mining Inc. global mineral trading platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="container px-4 md:px-8 max-w-4xl mx-auto py-16 prose prose-slate flex-1">
        <h1 className="text-4xl font-headline font-bold text-primary mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8 font-medium italic uppercase tracking-widest border-b pb-4">Last Updated: May 20, 2024</p>
        
        <div className="space-y-10 text-slate-600 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Acceptable Use</h2>
            <p>Baalvion Mining Inc. is a professional industrial marketplace intended solely for verified business entities engaged in the legal extraction, trading, and logistics of minerals and commodities. Any unauthorized use of the platform for fraudulent activity will result in immediate termination.</p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Compliance & Verification</h2>
            <p>Users must provide accurate and verifiable business documentation, including mining licenses and tax registrations. Our AI compliance system monitors these documents for authenticity under the governance of Baalvion Industries Private Limited.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Escrow & Payments</h2>
            <p>All large-scale transactions must proceed through our secure milestone-based escrow system to ensure the safety of both buyers and sellers across the global Baalvion network. Funds are released only upon successful third-party inspection.</p>
          </section>

          <div className="pt-12 border-t mt-12 bg-slate-50 p-8 rounded-3xl">
            <p className="text-xs text-slate-500 font-bold leading-relaxed italic uppercase tracking-tight">
              "Baalvion Mining Inc. is a global mining and commodity brand operated by Baalvion Industries Private Limited, a company incorporated in India with Corporate Identification Number (CIN) U43121OD2025PTC048479."
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
