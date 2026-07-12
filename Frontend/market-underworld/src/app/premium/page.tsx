import { Navbar } from "@/components/layout/navbar";
import { ListingCard } from "@/components/ui/listing-card";
import { AppButton } from "@/components/ui/app-button";
import { Check, ShieldCheck, Zap, Globe, Lock } from "lucide-react";
import { PREMIUM_PLANS } from "@/lib/api-mock";
import { cn } from "@/lib/utils";

export default async function PremiumPage() {
  const plans = PREMIUM_PLANS;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-40 pb-20">
        <header className="text-center max-w-3xl mx-auto space-y-6 mb-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black">
            Elite Access
          </h1>
          <p className="text-xl text-gray-500 font-medium leading-relaxed">
            Access specialized intelligence channels, priority visibility, and dedicated professional nodes within the network.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {plans.map((plan, i) => (
            <div 
              key={plan.id} 
              className={cn(
                "bg-white border border-black/[0.05] shadow-sm transition-all duration-300 hover:shadow-md rounded-3xl p-12 flex flex-col h-full",
                plan.recommended ? "border-blue-600/20 ring-1 ring-blue-600/10 shadow-lg" : "bg-gray-50"
              )}
            >
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-black mb-4 uppercase tracking-tighter">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-black">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="text-xs text-gray-400 font-bold uppercase">/ month</span>}
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-500 font-medium">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <AppButton 
                variant={plan.recommended ? 'primary' : 'outline'} 
                className="w-full h-14"
              >
                Choose {plan.name}
              </AppButton>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center p-12 md:p-20 bg-gray-50 rounded-[3rem]">
          <div className="space-y-10">
            <h2 className="text-4xl font-bold tracking-tight text-black">Built for serious players.</h2>
            <div className="space-y-8">
              {[
                { icon: Lock, title: 'Private Market Access', desc: 'Unlock unlisted project collaborations and verified trade signals.' },
                { icon: Zap, title: 'Network Acceleration', desc: 'Your intelligence reports receive prioritized visibility across all nodes.' },
                { icon: Globe, title: 'Global Node Roaming', desc: 'Move beyond regional locks and access the entire global network seamlessly.' }
              ].map(item => (
                <div key={item.title} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-black">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-black/[0.05] shadow-sm transition-all duration-300 hover:shadow-md p-10 rounded-[2.5rem] bg-white border-none">
            <p className="text-lg text-gray-600 font-medium italic mb-10">"Professional status on Market Underworld reduced my deal negotiation time by 65%. The high-quality discourse is unmatched."</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-black">Node #8472</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Strategic Researcher</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
