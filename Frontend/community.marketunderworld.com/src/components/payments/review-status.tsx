"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import type { CategoryPayment } from "@/lib/api/seller-access"

/**
 * What a payer sees after sending proof: that it is with the admin, how long review takes and by when it
 * should be done. Re-checks the payment every 20 seconds so a confirmation shows up without a reload.
 */
export function ReviewStatus({ payment, onRefresh }: { payment: CategoryPayment; onRefresh: () => void | Promise<void> }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(() => { void onRefresh() }, 20000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [onRefresh])

  const review = payment.review
  const by = review?.reviewBy ? new Date(review.reviewBy) : null
  const left = by ? Math.max(0, Math.round((by.getTime() - now) / 1000)) : null
  const mm = left !== null ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : null
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3"><Clock className="w-6 h-6 text-amber-400" /><h2 className="text-xl font-bold">With the admin for review</h2></div>
      <p className="text-sm text-gray-400">
        We received your payment proof{payment.proofCount ? ` (${payment.proofCount} screenshot${payment.proofCount > 1 ? "s" : ""})` : ""}
        {payment.txHash ? <> and reference <code className="text-white">{payment.txHash}</code></> : null}.
        {review ? <> An admin checks payments within about <strong className="text-white">{review.waitMinutes} minutes</strong>.</> : null}
      </p>
      {by && (
        <p className="text-sm text-gray-400">
          {left && left > 0
            ? <>Expected by <strong className="text-white">{by.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong> — about <span className="font-mono text-white">{mm}</span> left.</>
            : <>It is taking a little longer than usual. Your payment is still in the queue and you will see it here as soon as it is confirmed.</>}
        </p>
      )}
    </div>
  )
}
