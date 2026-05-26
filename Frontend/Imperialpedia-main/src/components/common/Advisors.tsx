import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const advisorCategories = [
  {
    id: "1",
    title: "Advisor Council",
    description: "Independent financial advisors offer insights and expertise",
    href: "#",
  },
  {
    id: "2",
    title: "Practice Management",
    description: "Excel as financial advisor and business owner",
    href: "#",
  },
  {
    id: "3",
    title: "Portfolio Construction",
    description: "Build wealth with a balanced, diversified portfolio",
    href: "#",
  },
  {
    id: "4",
    title: "Financial Planning",
    description:
      "The ins and outs of building a flexible plan that works for your client's needs.",
    href: "#",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ImperialpediaForAdvisors() {
  return (
    <section className="relative w-full overflow-hidden bg-[#eef0f8] py-14">
      {/* ── Decorative line pattern (SVG background) ── */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 320"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left swoosh lines */}
          {[0, 18, 36, 54, 72, 90, 108, 126].map((offset, i) => (
            <path
              key={`l${i}`}
              d={`M${-60 + offset},320 Q${180 + offset},120 ${
                360 + offset
              },-20`}
              stroke="#c5cadf"
              strokeWidth="1"
              fill="none"
            />
          ))}
          {/* Right swoosh lines */}
          {[0, 18, 36, 54, 72, 90, 108, 126].map((offset, i) => (
            <path
              key={`r${i}`}
              d={`M${1500 - offset},0 Q${1260 - offset},160 ${
                1080 - offset
              },340`}
              stroke="#c5cadf"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-[1320px] mx-auto px-4 flex flex-col items-center gap-10">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-serif text-[1.9rem] font-bold text-gray-900 mb-2">
            Imperialpedia for Advisors
          </h2>
          <p className="text-[14px] text-gray-600">
            The resources you need to become the best financial advisor you can
            be.
          </p>
        </div>

        {/* 4-column cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {advisorCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white/80 backdrop-blur-sm border border-white p-6 flex flex-col gap-3 shadow-sm"
            >
              {/* Title */}
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug">
                {cat.title}
              </h3>

              {/* Blue underline bar */}
              <div className="w-7 h-[3px] bg-blue-700" />

              {/* Description + arrow link */}
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {cat.description}{" "}
                <Link
                  href={cat.href}
                  className="text-blue-700 hover:underline font-medium whitespace-nowrap"
                >
                  →
                </Link>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
