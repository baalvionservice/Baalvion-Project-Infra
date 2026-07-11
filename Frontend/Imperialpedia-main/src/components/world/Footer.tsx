import { ImperialpediaMark } from "@/components/icons/ImperialpediaMark";

export default function Footer() {
  const links = [
    ["News", "World Markets", "Business", "Tech", "Politics"],
    ["Investing", "Personal Finance", "Watchlist", "Premium", "Screener"],
    ["About Imperialpedia", "Advertise", "Careers", "Privacy Policy", "Terms"],
    ["Contact", "Newsletters", "Podcasts", "RSS Feeds", "Apps"],
  ];

  return (
    <footer className="bg-black text-gray-400 mt-8">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="world-kicker flex items-center gap-2 bg-[#ce2b2b] text-white font-black text-xl px-3 py-1 tracking-tight">
            <ImperialpediaMark className="h-5 w-5 text-white" />
            IMPERIALPEDIA
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            Markets, business, and personal-finance news &amp; analysis.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {links.map((col, i) => (
            <div key={i} className="space-y-2">
              {col.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-gray-600">
            © 2026 Imperialpedia. All Rights Reserved.
          </p>
          <p className="text-[10px] text-gray-600">
            Market data may be delayed. For informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
