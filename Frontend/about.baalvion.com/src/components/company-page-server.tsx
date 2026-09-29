import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";
import { Globe, Shield, Target } from "lucide-react";
import { cmsGetSitePage } from "@/lib/cms";

export const dynamic = "force-dynamic";

const ICONS = [Globe, Shield, Target];

const FALLBACK_INTRO =
  "We are architecting the foundational layer for the next century of international commerce, bridging the gap between legacy systems and future automation.";

const FALLBACK_PILLARS = [
  {
    title: "Unmatched Reach",
    desc: "Operating across 180+ jurisdictions with localized intelligence and legal mapping.",
  },
  {
    title: "Integrity First",
    desc: "A culture rooted in transparency, compliance, and absolute accountability.",
  },
  {
    title: "Strategic Scale",
    desc: "Focusing on deep infrastructure that transforms how the world moves value.",
  },
];

/**
 * Server-side rendered company page. Content is managed in the central CMS
 * (admin-platform console) and read from the public delivery API, falling back
 * to the built-in copy if the CMS is unreachable.
 */
export default async function CompanyPageServer() {
  const page = await cmsGetSitePage("company");
  const intro = page?.excerpt || FALLBACK_INTRO;
  const cmsPillars = Array.isArray(page?.custom?.pillars) ? page!.custom.pillars : null;
  const pillars = (cmsPillars && cmsPillars.length ? cmsPillars : FALLBACK_PILLARS).map(
    (p: { title: string; desc: string }, i: number) => ({ ...p, icon: ICONS[i % ICONS.length] }),
  );

  return (
    <main>
      <SubPageHero category="Corporate" title={page?.title || "What We Do"} />
      <SubPageContent>
        <div className="space-y-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-light">
              {intro}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {pillars.map((item, i) => (
              <div
                key={i}
                className="bg-white p-12 rounded-2xl space-y-8 border border-gray-100 group hover:border-primary/20 hover:shadow-xl transition-all duration-500"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-primary/10">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubPageContent>
    </main>
  );
}
