"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronDown, KeyRound, Lock } from "lucide-react"

const CODE = "UNDERGROUND"
const MAX_TRIES = 5
const COOKIE_DAYS = 30

// The access code step, built for thumbs: one big field, a big button, no hidden terminal. Works the same on a phone, a tablet and a computer.
function CodeForm() {
  const params = useSearchParams()
  const raw = params.get("next") || "/auth/signin"
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/access-code") ? raw : "/auth/signin"
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const [tries, setTries] = useState(0)
  const [locked, setLocked] = useState(0)
  const [shake, setShake] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    if (locked <= 0) return
    const t = setInterval(() => setLocked((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [locked])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locked > 0) return
    if (value.trim().toUpperCase() === CODE) {
      document.cookie = `underground_unlocked=1; path=/; max-age=${COOKIE_DAYS * 86400}; samesite=lax`
      window.location.href = next
      return
    }
    const n = tries + 1
    setTries(n); setValue(""); setShake(true); setTimeout(() => setShake(false), 500)
    if (n >= MAX_TRIES) { setError("That was not the code. Wait a moment, then try again."); setLocked(30); setTries(0) }
    else setError(`That is not the code. ${MAX_TRIES - n} ${MAX_TRIES - n === 1 ? "try" : "tries"} left before a short wait.`)
    input.current?.focus()
  }

  return (
    <main className="min-h-[100dvh] bg-[#0A0A0F] text-white flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-600/50 flex items-center justify-center"><KeyRound className="w-8 h-8 text-red-400" /></div></div>
        <h1 className="text-3xl font-bold text-center">Enter your access code</h1>
        <p className="text-gray-400 text-center mt-2">Hell Road members get in with a code. Type it below to reach sign in.</p>

        <form onSubmit={submit} className={`mt-8 space-y-4 ${shake ? "animate-[shake_0.4s]" : ""}`} noValidate>
          <label htmlFor="code" className="sr-only">Access code</label>
          <input
            id="code" ref={input} value={value} onChange={(e) => { setValue(e.target.value); setError("") }}
            type="text" inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="go"
            disabled={locked > 0} placeholder="ACCESS CODE" aria-invalid={!!error} aria-describedby={error ? "code-error" : undefined}
            className="w-full h-16 px-4 rounded-xl bg-black border border-white/15 text-white text-xl tracking-[0.25em] text-center uppercase focus:outline-none focus:border-red-500 disabled:opacity-50"
            style={{ fontSize: 20 }}
          />
          {error && <p id="code-error" role="alert" className="text-sm text-red-300 text-center">{error}</p>}
          {locked > 0 && <p className="text-sm text-gray-400 text-center">Try again in {locked} seconds.</p>}
          <button type="submit" disabled={!value.trim() || locked > 0} className="w-full h-14 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-lg font-semibold flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" /> Continue
          </button>
        </form>

        <details className="mt-8 group rounded-xl border border-white/10 bg-white/[0.02]">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-4 text-sm font-semibold">
            Where do I find the code? <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-4 pb-4 text-sm text-gray-300 space-y-2">
            <p>Open the <Link href="/" className="underline">home page</Link> and read the big headline. The word right before &ldquo;Market&rdquo; is the code.</p>
            <p className="text-gray-500">Your device remembers the code for {COOKIE_DAYS} days. After you create an account, the welcome guide shows you how to sign in next time.</p>
          </div>
        </details>

        <p className="mt-6 text-center text-xs text-gray-500">Hell Road is for adults, 18 and over.</p>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </main>
  )
}

export default function AccessCodePage() {
  return <Suspense fallback={null}><CodeForm /></Suspense>
}
