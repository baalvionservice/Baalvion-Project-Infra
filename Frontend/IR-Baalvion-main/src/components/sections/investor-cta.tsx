import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Investor CTA — compact dark band that closes the investor narrative with a
// clear path to engage. Access is gated to qualified and institutional investors.
export default function InvestorCta({ id }: { id: string }) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Investor Relations
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Engage with Baalvion Investor Relations.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Request access, speak with our team, or review our latest materials to
            evaluate the opportunity in depth.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/onboarding">
              Request investor access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/resources/contact-ir">Contact IR</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/resources">Download materials</Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-white/40">
          For qualified and institutional investors.{" "}
          <a
            href="mailto:invrel@baalvion.com"
            className="text-white/60 underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            invrel@baalvion.com
          </a>
        </p>
      </div>
    </section>
  );
}
