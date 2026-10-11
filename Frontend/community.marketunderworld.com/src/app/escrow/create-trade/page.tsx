import React from "react";
import Link from "next/link";

// A trade is always started with a specific intermediary, from their page.
export default function CreateTradePage() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen text-center py-24">
      <h1 className="text-3xl font-bold mb-3">Start a trade</h1>
      <p className="text-zinc-400 mb-8">Choose an intermediary, open their page and press &ldquo;Request a trade&rdquo;. You agree the amount and fee with them in the trade chat before you pay.</p>
      <Link href="/escrow/intermediaries" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl">Browse intermediaries</Link>
    </div>
  );
}
