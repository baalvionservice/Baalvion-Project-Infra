"use client"

import { ImageUpload } from "@/components/upload/image-upload"
import type { ApiClub } from "@/lib/api/nightlife"

type Form = Partial<ApiClub>
const box = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm"
const words = (s?: string | null) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

// What a venue page still needs to rank well. Each line is a real check on the saved fields.
export function seoChecks(f: Form) {
  const t = f.seoTitle?.trim().length ?? 0
  const d = f.seoDescription?.trim().length ?? 0
  return [
    { ok: t >= 30 && t <= 60, label: "Meta title is 30 to 60 characters", hint: `${t} now` },
    { ok: d >= 110 && d <= 160, label: "Meta description is 110 to 160 characters", hint: `${d} now` },
    { ok: words(f.about) >= 150, label: "Page content is 150 words or more", hint: `${words(f.about)} now` },
    { ok: !!f.image, label: "Has a main photo", hint: "" },
    { ok: (f.gallery?.length ?? 0) >= 3, label: "Has 3 or more gallery photos with descriptions", hint: `${f.gallery?.length ?? 0} now` },
    { ok: (f.gallery ?? []).every((g) => g.alt && g.alt.trim()) && (f.gallery?.length ?? 0) > 0, label: "Every gallery photo has a description (alt text)", hint: "" },
    { ok: (f.faqs?.length ?? 0) >= 2, label: "Has 2 or more FAQs", hint: `${f.faqs?.length ?? 0} now` },
    { ok: !!f.address, label: "Has a full address", hint: "" },
    { ok: !!f.openingHours, label: "Has opening hours", hint: "" },
    { ok: !!(f.phone || f.website), label: "Has a phone number or website", hint: "" },
    { ok: f.latitude != null && f.longitude != null, label: "Has map coordinates", hint: "" },
  ]
}

export function ClubSeoFields({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  const checks = seoChecks(form)
  const score = checks.filter((c) => c.ok).length
  const set = (patch: Form) => setForm({ ...form, ...patch })
  const gallery = form.gallery ?? []
  const faqs = form.faqs ?? []
  const counter = (n: number, lo: number, hi: number) => <span className={`text-xs ${n >= lo && n <= hi ? "text-emerald-600" : "text-gray-400"}`}>{n} characters (best {lo} to {hi})</span>

  return (
    <div className="space-y-6 border-t pt-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">SEO and content</h3>
        <p className="text-sm text-gray-500">This is what Google shows and what the page says. Write it in your own words, about this venue only.</p>
      </div>

      <div className="rounded-xl border bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">Ranking checklist: {score} of {checks.length}</p>
        <div className="h-2 bg-gray-200 rounded mt-2"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${(score / checks.length) * 100}%` }} /></div>
        <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {checks.map((c) => <li key={c.label} className={c.ok ? "text-emerald-700" : "text-gray-600"}>{c.ok ? "✓" : "○"} {c.label}{!c.ok && c.hint ? ` (${c.hint})` : ""}</li>)}
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-gray-700">Venue type
          <select value={form.venueType ?? ""} onChange={(e) => set({ venueType: e.target.value || null })} className={`${box} mt-1`}>
            <option value="">Not set</option><option value="nightclub">Nightclub</option><option value="pub">Pub</option><option value="bar">Bar</option><option value="biergarten">Beer garden</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">Price range
          <select value={form.priceRange ?? ""} onChange={(e) => set({ priceRange: e.target.value || null })} className={`${box} mt-1`}>
            <option value="">Not set</option><option value="₹">₹ (budget)</option><option value="₹₹">₹₹ (moderate)</option><option value="₹₹₹">₹₹₹ (upscale)</option><option value="₹₹₹₹">₹₹₹₹ (premium)</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">Website
          <input value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} placeholder="https://" className={`${box} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Phone
          <input value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …" className={`${box} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">Opening hours
          <input value={form.openingHours ?? ""} onChange={(e) => set({ openingHours: e.target.value })} placeholder="Mo-Su 18:00-01:30" className={`${box} mt-1`} />
          <span className="text-xs text-gray-400">Use the format Mo-Fr 18:00-01:00; Sa-Su 16:00-02:00. It goes into the search listing as it is.</span>
        </label>
        <label className="block text-sm font-medium text-gray-700">Latitude
          <input type="number" step="any" value={form.latitude ?? ""} onChange={(e) => set({ latitude: e.target.value === "" ? null : Number(e.target.value) })} className={`${box} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Longitude
          <input type="number" step="any" value={form.longitude ?? ""} onChange={(e) => set({ longitude: e.target.value === "" ? null : Number(e.target.value) })} className={`${box} mt-1`} />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Meta title</label>
        <input value={form.seoTitle ?? ""} onChange={(e) => set({ seoTitle: e.target.value })} maxLength={160} placeholder={`${form.name || "Venue"}, ${form.suburb || form.city || "City"}: address, hours and guest list`} className={`${box} mt-1`} />
        {counter(form.seoTitle?.length ?? 0, 30, 60)}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Meta description</label>
        <textarea value={form.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} rows={2} maxLength={320} className={`${box} mt-1 resize-none`} />
        {counter(form.seoDescription?.length ?? 0, 110, 160)}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Page content</label>
        <textarea value={form.about ?? ""} onChange={(e) => set({ about: e.target.value })} rows={9} maxLength={10000} placeholder="Describe the venue: the atmosphere, the music, who goes, what to expect, how to get in. Separate paragraphs with a blank line." className={`${box} mt-1`} />
        <span className={`text-xs ${words(form.about) >= 150 ? "text-emerald-600" : "text-gray-400"}`}>{words(form.about)} words (aim for 150 or more)</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Gallery photos ({gallery.length} of 12)</label>
          {gallery.length < 12 && <button type="button" onClick={() => set({ gallery: [...gallery, { url: "", alt: "" }] })} className="text-sm text-fuchsia-600 font-medium">+ Add photo</button>}
        </div>
        <div className="space-y-4">
          {gallery.map((g, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-3">
              <ImageUpload tone="light" allowLink label={`Photo ${i + 1}`} purpose="club_image" value={g.url} onChange={(url) => set({ gallery: gallery.map((x, idx) => (idx === i ? { ...x, url } : x)) })} />
              <input value={g.alt ?? ""} onChange={(e) => set({ gallery: gallery.map((x, idx) => (idx === i ? { ...x, alt: e.target.value } : x)) })} maxLength={160} placeholder="Describe the photo in a few words (for search engines and screen readers)" className={box} />
              <button type="button" onClick={() => set({ gallery: gallery.filter((_, idx) => idx !== i) })} className="text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">FAQs ({faqs.length} of 12)</label>
          {faqs.length < 12 && <button type="button" onClick={() => set({ faqs: [...faqs, { q: "", a: "" }] })} className="text-sm text-fuchsia-600 font-medium">+ Add question</button>}
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-2">
              <input value={f.q} onChange={(e) => set({ faqs: faqs.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)) })} maxLength={200} placeholder="Question, e.g. Is there a dress code?" className={box} />
              <textarea value={f.a} onChange={(e) => set({ faqs: faqs.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)) })} rows={2} maxLength={1000} placeholder="Answer" className={`${box} resize-none`} />
              <button type="button" onClick={() => set({ faqs: faqs.filter((_, idx) => idx !== i) })} className="text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">The page also publishes these as structured FAQ data. Only add questions you can answer truthfully.</p>
      </div>
    </div>
  )
}
