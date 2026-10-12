import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PageContent } from "@/components/cms/page-content"
import { getClubs, getEvents, getListings } from "@/lib/api/nightlife"
import { getDraws } from "@/lib/api/draws-server"
import { countryOf } from "@/lib/club-geo"

type Door = { numeral: string; title: string; text: string; access: string; href: string; cta: string }
const CHAPTERS: { id: string; numeral: string; name: string; line: string; doors: Door[] }[] = [
  {
    id: "nights", numeral: "I", name: "The Nights", line: "Where the evening is decided.",
    doors: [
      { numeral: "i", title: "The directory", text: "Pubs, bars and nightclubs across India and Dubai. Filter by country, city, area and type, then ask for the guest list or a VIP table.", access: "Open to all", href: "/clubs", cta: "Find a venue" },
      { numeral: "ii", title: "Events and DJ nights", text: "Upcoming nights at listed venues. Organisers post their own event with a poster and ticket link, and the events team checks it before it goes live.", access: "Open to all, posting needs an account", href: "/clubs/events", cta: "See the nights" },
      { numeral: "iii", title: "The ticket draw", text: "A monthly draw for a free VIP club ticket. Each draw has its own entry price, winner count and closing time. Winners are picked at random and the seed is published.", access: "Members, 18 and over", href: "/clubs/lottery", cta: "Read the draws" },
      { numeral: "iv", title: "Demand your DJ", text: "Pledge points toward a DJ you want at a club. If the target is met the booking is confirmed.", access: "Members with points", href: "/clubs/dj-demand", cta: "Make a demand" },
    ],
  },
  {
    id: "circle", numeral: "II", name: "The Circle", line: "Who you meet, and how you get in.",
    doors: [
      { numeral: "i", title: "Elite parties", text: "Parties hosted by members. Paying members can ask to join; women guests can ask for a free invitation where the host offers one. Every host approves each request.", access: "Verified members", href: "/clubs/elite-host", cta: "Enter the circle" },
      { numeral: "ii", title: "Forum communities", text: "Moderated communities by interest. Some open at once, others ask to approve you.", access: "Members", href: "/forum", cta: "Join a community" },
      { numeral: "iii", title: "Dating and founders", text: "Profiles of verified adults, with founders listed apart. You can message someone only when you both like each other. Nobody pays for a date.", access: "Verified, 18 and over", href: "/dating", cta: "Meet someone" },
      { numeral: "iv", title: "Membership tiers", text: "Three paid tiers that open more of the platform. Pay, send a screenshot, and an admin confirms within 5 to 30 minutes.", access: "$100, $250 or $1,000", href: "/access", cta: "Choose a tier" },
    ],
  },
  {
    id: "work", numeral: "III", name: "The Work", line: "Earn, learn, and be found.",
    doors: [
      { numeral: "i", title: "Local jobs and gigs", text: "Casting calls, dance shows and event work. Candidates and employers are reviewed before they can contact each other.", access: "Members, reviewed", href: "/locals", cta: "Find work" },
      { numeral: "ii", title: "Hire people", text: "Register a business or venue and post local jobs. See who applies.", access: "Employers, reviewed", href: "/nightlife/employer", cta: "Post a job" },
      { numeral: "iii", title: "Education", text: "Live sessions with approved teachers. Browse by subject, request a place, and keep your classes in one classroom.", access: "Members", href: "/education", cta: "Start learning" },
      { numeral: "iv", title: "Bounty tasks", text: "Listed security tasks with their rewards. You are paid only for reports the team accepts, after review.", access: "Verified members", href: "/bounty", cta: "See the tasks" },
    ],
  },
  {
    id: "exchange", numeral: "IV", name: "The Exchange", line: "Value moves here, in the open.",
    doors: [
      { numeral: "i", title: "The marketplace", text: "Buy from sellers the team has reviewed. A one-time buyer pass opens every category.", access: "Buyer pass", href: "/marketplace", cta: "Enter the market" },
      { numeral: "ii", title: "Sell here", text: "Apply once in a single page. Approved sellers unlock a category with a payment and list their products.", access: "By application", href: "/seller/onboarding", cta: "Apply to sell" },
      { numeral: "iii", title: "Wallet points", text: "Load your wallet with crypto and it becomes points (100 points = $1) that pay for draws, pledges and the marketplace.", access: "Members", href: "/wallet", cta: "Open your wallet" },
      { numeral: "iv", title: "Intermediaries", text: "Pick a listed intermediary to help with a crypto trade. Disputes are decided by the team.", access: "Members", href: "/escrow/intermediaries", cta: "Find an intermediary" },
      { numeral: "v", title: "Gift cards", text: "Send a gift card to anyone by email.", access: "Open to all", href: "/gift-cards", cta: "Send a card" },
    ],
  },
  {
    id: "watch", numeral: "V", name: "The Watch", line: "What keeps the doors safe.",
    doors: [
      { numeral: "i", title: "Identity check", text: "Every member verifies once with an ID and a selfie. Documents are encrypted and only reviewers can open them. You have 7 days from joining.", access: "Every member", href: "/kyc", cta: "Verify" },
      { numeral: "ii", title: "Support", text: "Open a ticket and the team answers you in the site. Your replies and notifications stay in your dashboard.", access: "Members", href: "/support", cta: "Ask the team" },
    ],
  },
]

export default async function ServicesPage() {
  const [clubs, events, draws, listings] = await Promise.all([getClubs(), getEvents().catch(() => []), getDraws(), getListings().catch(() => [])])
  const cities = new Set(clubs.map((c) => c.city)).size
  const uae = clubs.filter((c) => countryOf(c.state) === "United Arab Emirates").length
  const openDraws = draws.filter((d) => d.status === "open").length
  const stats: [string, string][] = [
    [clubs.length.toLocaleString("en-IN"), "venues listed"],
    [String(cities), "cities"],
    [uae ? String(uae) : "0", "in the Emirates"],
    [String(events.length), "upcoming events"],
    [String(openDraws), "draws open"],
    [String(listings.length), "local jobs"],
  ]
  return (
    <div className="min-h-screen text-[#d9cfc0]" style={{ background: "radial-gradient(1200px 600px at 50% -10%, #2a0d10 0%, #0b0709 55%, #060405 100%)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 pt-32 pb-24">
        {/* The seal */}
        <header className="text-center">
          <svg viewBox="0 0 120 120" className="w-28 h-28 mx-auto" role="img" aria-label="Hell Road seal">
            <g fill="none" stroke="#b08d57" strokeWidth="1.2">
              <circle cx="60" cy="60" r="56" /><circle cx="60" cy="60" r="50" strokeDasharray="2 4" /><circle cx="60" cy="60" r="34" />
              <path d="M60 14 L66 54 L106 60 L66 66 L60 106 L54 66 L14 60 L54 54 Z" />
              <circle cx="60" cy="60" r="8" fill="#7a1f26" stroke="#b08d57" />
            </g>
          </svg>
          <p className="mt-8 text-xs tracking-[0.5em] text-[#b08d57] uppercase">By code, by invitation, by trust</p>
          <h1 className="mt-4 text-4xl sm:text-6xl tracking-[0.12em] uppercase text-[#f1e6d3]">What the Road holds</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-[#b9ad9a]">Everything behind the door, written down plainly. Five chapters, every service we actually run, and what it takes to open each one. Members are verified adults, eighteen and over.</p>
          <div className="mt-8 flex items-center justify-center gap-4 text-[#b08d57]" aria-hidden><span className="h-px w-16 bg-[#b08d57]/50" />◆<span className="h-px w-16 bg-[#b08d57]/50" /></div>
        </header>

        <dl className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#b08d57]/25 border border-[#b08d57]/25">
          {stats.map(([n, l]) => (
            <div key={l} className="bg-[#0b0709] py-5 text-center"><dt className="sr-only">{l}</dt><dd className="text-3xl text-[#f1e6d3]">{n}</dd><dd className="text-[10px] tracking-[0.25em] uppercase text-[#8d826f] mt-1">{l}</dd></div>
          ))}
        </dl>

        <nav aria-label="Chapters" className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs tracking-[0.3em] uppercase">
          {CHAPTERS.map((c) => <a key={c.id} href={`#${c.id}`} className="text-[#b08d57] hover:text-[#f1e6d3]">{c.numeral}. {c.name}</a>)}
        </nav>

        {CHAPTERS.map((c) => (
          <section key={c.id} id={c.id} className="mt-20 scroll-mt-28">
            <div className="text-center">
              <div className="text-[#b08d57] text-sm tracking-[0.4em]">CHAPTER {c.numeral}</div>
              <h2 className="mt-2 text-3xl sm:text-4xl tracking-[0.15em] uppercase text-[#f1e6d3]">{c.name}</h2>
              <p className="mt-2 italic text-[#8d826f]">{c.line}</p>
            </div>
            <ul className="mt-8 grid md:grid-cols-2 gap-5">
              {c.doors.map((d) => (
                <li key={d.title} className="group relative border border-[#b08d57]/30 bg-gradient-to-b from-[#140b0d] to-[#0a0607] p-6 transition-colors hover:border-[#b08d57]/70">
                  <span aria-hidden className="absolute top-3 right-4 text-[#b08d57]/40 text-3xl">{d.numeral}</span>
                  <h3 className="text-xl tracking-wide text-[#f1e6d3]">{d.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#b9ad9a]">{d.text}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#b08d57]">{d.access}</span>
                    <Link href={d.href} className="text-sm tracking-widest uppercase text-[#f1e6d3] border-b border-[#b08d57] hover:text-[#b08d57]">{d.cta} →</Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-24 border border-[#b08d57]/30 p-8 sm:p-12 text-center bg-[#0a0607]">
          <h2 className="text-2xl sm:text-3xl tracking-[0.15em] uppercase text-[#f1e6d3]">How you come in</h2>
          <ol className="mt-8 grid sm:grid-cols-4 gap-6 text-left">
            {[
              ["I", "Find the code", "It is written on the home page, in the big headline."],
              ["II", "Make an account", "Email and password. Your device remembers the code for 30 days."],
              ["III", "Be verified", "ID and selfie within 7 days, or you ask for access again."],
              ["IV", "Open your doors", "Tell us who you are on the profile, and the dashboard shows your spaces."],
            ].map(([n, t, x]) => (
              <li key={n}><div className="text-[#b08d57] tracking-[0.3em] text-sm">{n}</div><div className="mt-2 text-lg text-[#f1e6d3]">{t}</div><p className="mt-1 text-sm text-[#b9ad9a]">{x}</p></li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/registration" className="px-8 py-3 bg-[#7a1f26] hover:bg-[#962a32] text-[#f1e6d3] tracking-[0.25em] uppercase text-sm">Request entry</Link>
            <Link href="/auth/signin" className="px-8 py-3 border border-[#b08d57]/60 text-[#f1e6d3] tracking-[0.25em] uppercase text-sm hover:border-[#b08d57]">I have a key</Link>
          </div>
        </section>

        <PageContent slug="services" tone="dark" />
      </main>
      <Footer />
    </div>
  )
}
