import { Mail, MapPin, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ContactFormClient from "./contact-form-client";

/**
 * Server-side rendered contact page component
 * Optimized for SEO and Google indexing
 */
export default function ContactPageServer() {
  return (
    <main className="flex-1 pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-24 lg:pb-32">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-start">
          <div className="space-y-12 sm:space-y-16 animate-fade-in">
            <div className="space-y-4 sm:space-y-6">
              <span className="section-label">Strategic Communications</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary tracking-tighter leading-tight">
                Establish <br />
                <span className="gradient-text">
                  Baalvion Operating System (BOS) Link
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Initiate a strategic partnership or project briefing. Our global
                trade specialists are ready to architect your integration.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {[
                {
                  icon: Mail,
                  value: "intel@baalvion.nexus",
                  label: "Email Protocol",
                },
                {
                  icon: MapPin,
                  value: "New Delhi, NCR, IN",
                  label: "Physical Node",
                },
                {
                  icon: ShieldCheck,
                  value: "PGP: BAAL-2024-NX",
                  label: "Encryption Key",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-4 sm:gap-6 items-center p-6 sm:p-8 glass-card border-white/5 card-hover group opacity-0 animate-fade-in fill-mode-forwards",
                    i === 0 ? "stagger-1" : i === 1 ? "stagger-2" : "stagger-3"
                  )}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500 text-primary group-hover:text-white border border-primary/10">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">
                      {item.label}
                    </p>
                    <h4 className="text-white font-bold text-base sm:text-lg">
                      {item.value}
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl bg-primary/[0.02] border border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent animate-pulse" />
                  <h4 className="text-white font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">
                    Response Protocol
                  </h4>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic font-light">
                  "Our strategic response team typically reviews all inbound
                  Baalvion Operating System (BOS) links within 4-6 operational
                  hours. Global trade never sleeps."
                </p>
              </div>
            </div>
          </div>

          <ContactFormClient />
        </div>
      </div>
    </main>
  );
}
