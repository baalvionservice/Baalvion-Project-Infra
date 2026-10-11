// The whole intermediary flow in five plain lines, shown on the directory and on each profile.
const STEPS = [
  ["Choose", "Pick an intermediary and press Request a trade."],
  ["Agree", "In the trade chat, agree the amount and their fee."],
  ["Pay", "Scan their QR, pay them directly, and attach your payment screenshot."],
  ["They do the work", "The intermediary buys the USDT or does the job you asked for."],
  ["Confirm", "You confirm it is done. If something goes wrong, press Dispute and an admin decides."],
];

export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8 text-sm" aria-label="How an intermediary trade works">
      {STEPS.map(([title, text], i) => (
        <li key={title} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="text-red-400 font-bold">{i + 1}. {title}</div>
          <p className="text-zinc-400 text-xs mt-1 leading-snug">{text}</p>
        </li>
      ))}
    </ol>
  );
}
