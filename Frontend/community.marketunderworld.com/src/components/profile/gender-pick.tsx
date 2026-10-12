"use client"

const OPTIONS = [{ v: "woman", t: "Woman" }, { v: "man", t: "Man" }, { v: "other", t: "Other" }, { v: "", t: "Prefer not to say" }]

// Optional. Used only so hosts can offer free Elite party invitations to women guests.
export function GenderPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm text-gray-300">I am (optional)</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button key={o.t} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}
            className={`h-10 px-4 rounded-lg border text-sm ${value === o.v ? "border-red-500 bg-red-950/30 text-white" : "border-white/10 text-gray-300 hover:border-white/25"}`}>{o.t}</button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">Only used so party hosts can offer free invitations to women guests. It is never shown on your profile.</p>
    </fieldset>
  )
}
