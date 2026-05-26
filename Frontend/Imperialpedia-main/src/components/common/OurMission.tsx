import Link from "next/link";
import Image from "next/image";
import { reviewBoardMembers } from "@/app/imperialpedia-review-board/components/data.reviewboards";

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "30+ Million", label: "Monthly Readers" },
  { value: "25+ Years", label: "Serving Readers" },
  { value: "25,000+", label: "Educational Articles" },
  { value: "40+", label: "Daily News/Analysis" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OurMission() {
  return (
    <section className="w-full bg-background py-12">
      <div className="max-w-[1320px] mx-auto px-4">
        {/* Two-column: left content + right sidebar */}
        <div className="flex flex-col md:flex-row gap-0 md:divide-x md:divide-gray-300">
          {/* ── Left column ── */}
          <div className="flex-1 md:pr-12">
            {/* Heading */}
            <h2 className="font-serif text-[1.6rem] font-bold text-foreground mb-4">
              Our Mission
            </h2>

            {/* Body paragraph */}
            <p className="text-[14.5px] text-foreground/80 leading-relaxed mb-8">
              Imperialpedia was founded in 1999 with the mission of helping
              people improve their financial outcomes. Our readers come to us
              from all over the world and from all walks of life. Some are
              learning about money and investing for the first time, while
              others are experienced investors, business owners, professionals,
              financial advisors, and executives looking to improve their
              knowledge and skills. No matter who you are, we are here to help.
            </p>

            {/* Stats + Inclusive Content side by side */}
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Stats column */}
              <div className="flex flex-col gap-4 min-w-[160px]">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[1.15rem] font-bold text-blue-700 leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-500 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Inclusive Content */}
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-foreground mb-2">
                  Inclusive Content
                </h3>
                <p className="text-[13.5px] text-foreground/70 leading-relaxed">
                  Financial education needs to serve readers of all backgrounds.
                  We aspire for our content, staff, contributors, and partner
                  organizations to further the financial empowerment of those
                  from all ethnicities, genders, generations, sexual
                  orientations, abilities, and socioeconomic backgrounds,
                  particularly those who may be disadvantaged.{" "}
                  <Link
                    href="#"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    Read more details
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* ── Right sidebar: Financial Review Board ── */}
          <aside className="md:pl-10 mt-10 md:mt-0 md:w-[300px] shrink-0">
            <h3 className="font-serif text-[1.1rem] font-bold text-foreground mb-3">
              Financial Review Board
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-5">
              Our financial experts offer more than 250 years+ of combined
              experience to ensure we're giving readers the most accurate
              information. Meet a few of our reviewers:
            </p>

            {/* Reviewer list */}
            <div className="flex flex-col divide-y divide-gray-200">
              {reviewBoardMembers.slice(0,3).map((reviewer) => (
                <Link
                  key={reviewer.name}
                  href={`/imperialpedia-review-board/${reviewer.slug}`}
                  className="flex items-center gap-3 py-3 group"
                >
                  {/* Headshot */}
                  <div className="relative shrink-0 w-[52px] h-[52px] overflow-hidden bg-gray-200 grayscale">
                    <Image
                      src={reviewer.image}
                      alt={reviewer.name}
                      fill
                      className="object-cover"
                      sizes="52px"
                    />
                  </div>

                  {/* Name + credentials */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13.5px] font-bold text-foreground group-hover:text-blue-700 leading-snug transition-colors">
                      {reviewer.name}
                    </span>
                    <span className="text-[12px] text-gray-500">
                      {reviewer.role}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Meet the board link */}
            <p className="mt-4 text-[13px] text-foreground/70">
              Meet the{" "}
              <Link
                href="/imperialpedia-review-board"
                className="text-blue-700 font-medium hover:underline"
              >
                Financial Review Board →
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
