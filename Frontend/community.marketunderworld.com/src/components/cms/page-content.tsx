import { getPage } from "@/lib/cms"

// Plain text becomes paragraphs, "## " headings and "- " lists. No HTML is accepted, so nothing a writer types can run as code.
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h3 key={i} className="text-xl font-bold mt-2">{b.slice(3)}</h3>
        const lines = b.split("\n")
        if (lines.every((l) => /^[-*] /.test(l))) return <ul key={i} className="list-disc pl-6 space-y-1">{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>
        return <p key={i} className="whitespace-pre-line">{b}</p>
      })}
    </div>
  )
}

// What staff wrote for this page in the admin panel: intro, benefits, body and questions. Renders nothing until something is written.
export async function PageContent({ slug, heading, tone = "light" }: { slug: string; heading?: string; tone?: "light" | "dark" }) {
  const p = await getPage(slug)
  if (!p || (!p.intro && !p.body && !p.benefits.length && !p.faqs.length)) return null
  const dark = tone === "dark"
  const faqLd = p.faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null
  return (
    <section className={`max-w-[900px] mx-auto px-4 py-10 ${dark ? "text-gray-200" : "text-[#222]"}`} aria-label={heading || p.title || "About this page"}>
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      {(heading || p.title) && <h2 className="text-2xl font-bold mb-3">{heading || p.title}</h2>}
      {p.intro && <p className={`text-lg leading-relaxed mb-6 ${dark ? "text-gray-300" : "text-[#444]"}`}>{p.intro}</p>}
      {p.benefits.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3">What you get</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {p.benefits.map((b, i) => (
              <li key={i} className={`rounded-xl border p-4 ${dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                <div className="font-semibold">{b.title}</div>
                {b.text && <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-600"}`}>{b.text}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {p.body && <div className="leading-relaxed mb-8"><Body text={p.body} /></div>}
      {p.faqs.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">Questions</h3>
          <div className="space-y-3">
            {p.faqs.map((f, i) => (
              <details key={i} className={`rounded-xl border p-4 ${dark ? "border-white/10" : "border-gray-200 bg-white"}`}>
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className={`mt-2 text-sm whitespace-pre-line ${dark ? "text-gray-300" : "text-gray-600"}`}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
