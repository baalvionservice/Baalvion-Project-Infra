import Link from "next/link";
import { Lock } from "lucide-react";

export function SignInNotice({ next, what }: { next: string; what: string }) {
  return (
    <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-3xl max-w-2xl mx-auto">
      <Lock className="w-10 h-10 text-fuchsia-400 mx-auto mb-4" />
      <h2 className="text-2xl font-black mb-2">Sign in to continue</h2>
      <p className="text-gray-400 mb-6">You need an account to {what}.</p>
      <Link
        href={`/auth/signin?redirect=${encodeURIComponent(next)}`}
        className="inline-block h-12 leading-[3rem] px-8 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-bold transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}

export function ReviewBanner({ status, note, subject }: { status: "pending" | "verified" | "rejected"; note: string | null; subject: string }) {
  const style = {
    pending: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    verified: "bg-green-500/10 border-green-500/20 text-green-300",
    rejected: "bg-red-500/10 border-red-500/20 text-red-300",
  }[status];
  const text = {
    pending: `Your ${subject} is awaiting review. Any edit you make sends it back to review.`,
    verified: `Your ${subject} is verified.`,
    rejected: `Your ${subject} was not approved${note ? `: ${note}` : "."} Update it and resubmit.`,
  }[status];
  return <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${style}`}>{text}</div>;
}
