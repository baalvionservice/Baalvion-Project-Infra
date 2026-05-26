
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata = {
  title: "Working at Baalvion | Careers",
  description: "Join the team architecting the future of global trade.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://about.baalvion.com/careers",
  },
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category="Talent" title="Working at Baalvion" />
        <SubPageContent>
          <div className="max-w-3xl mx-auto text-center space-y-8 py-20">
            <p className="text-xl text-gray-600 leading-relaxed">
              We are looking for visionaries, architects, and engineers to build the global trade infrastructure of tomorrow.
            </p>
            <div className="pt-10">
              <span className="inline-block px-8 py-4 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold text-gray-400 uppercase tracking-widest">
                0 Open Roles • Q1 2026
              </span>
            </div>
          </div>
        </SubPageContent>
      </main>
      <Footer />
    </div>
  );
}
