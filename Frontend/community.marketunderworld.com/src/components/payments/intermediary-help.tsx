import Link from "next/link"
import { Users } from "lucide-react"

// For people who have no crypto: a listed intermediary buys it for them. Rates and fees are the intermediary's own.
export function IntermediaryHelp({ amountUsd, networkLabel, address, open = false }: { amountUsd: number; networkLabel?: string | null; address?: string | null; open?: boolean }) {
  const usd = `$${amountUsd.toLocaleString()}`
  return (
    <details open={open} className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 group">
      <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-semibold text-sky-200">
        <Users className="w-4 h-4 shrink-0" /> No crypto? Pay through an intermediary
        <span className="ml-auto text-xs font-normal text-sky-300/70 group-open:hidden">Show how</span>
      </summary>
      <div className="mt-3 space-y-3 text-[13px] text-gray-300">
        <p>Intermediaries are listed members who help people buy USDT with the way they already pay. They can send it to us for you.</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Open the intermediary list and pick one who helps with <strong className="text-white">buying USDT</strong>.</li>
          <li>Tell them you need <strong className="text-white">{usd} of USDT</strong> paid{networkLabel ? <> on the <strong className="text-white">{networkLabel}</strong> network</> : ""}{address ? <> to the address shown in this box (it ends in <strong className="font-mono text-white">{address.slice(-6)}</strong>)</> : <> to the address you will be shown here</>}.</li>
          <li>Pay the intermediary directly by scanning their QR. Check the name in your app before you send.</li>
          <li>Come back here, attach the screenshot of the payment they send you, and send it for review.</li>
        </ol>
        <p className="text-[12px] text-gray-400">Each intermediary sets their own rate and fee, and that part is between you and them. If a trade goes wrong, open it under My trades.</p>
        <Link href="/escrow/intermediaries" className="inline-flex items-center h-10 px-5 rounded-lg bg-sky-400 text-black text-sm font-bold hover:bg-sky-300">Find an intermediary</Link>
      </div>
    </details>
  )
}
