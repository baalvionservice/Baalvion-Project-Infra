import React from "react";
import Link from "next/link";

const cards = [
  { href: "/escrow/intermediaries", title: "Find an intermediary", body: "People who help you buy USDT, trade crypto or set up accounts. Pay them directly by QR." },
  { href: "/escrow/my-trades", title: "My trades", body: "Your trade requests, the chat with your intermediary, and your payment screenshots." },
  { href: "/escrow/apply-agent", title: "Become an intermediary", body: "Apply, pay the refundable deposit, and be listed once an admin approves." },
  { href: "/escrow/disputes", title: "Disputes", body: "Something went wrong? See the status of a dispute and the admin's decision." },
];

// Marketplace access (seller category payment, buyer pass, wallet) is handled in /seller/access, /buyer-pass and /wallet.
export default function EscrowHubPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-white min-h-screen">
      <div className="text-center mb-10 mt-8">
        <h1 className="text-4xl font-bold mb-3 text-red-500">Intermediaries</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">An intermediary is a person you pay directly who then completes your request. Baalvion lists them after an admin approves, but does not hold your money in this flow.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/60 rounded-xl p-6 transition-colors">
            <h2 className="font-bold text-lg mb-1">{c.title}</h2>
            <p className="text-sm text-zinc-400">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
