export default function Footer() {
  const links = [
    ["News", "World Markets", "Business", "Tech", "Politics"],
    ["Investing", "Personal Finance", "Watchlist", "PRO", "Screener"],
    ["About CNBC", "Advertise", "Careers", "Privacy Policy", "Terms"],
    ["Contact", "Newsletters", "Podcasts", "TV Schedule", "Apps"],
  ];

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 mt-8">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#CC0000] text-white font-black text-xl px-3 py-1 tracking-tight">CNBC</div>
          <p className="text-xs text-gray-500 max-w-sm">
            First in Business Worldwide — Market data, news, analysis and more.
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
            © 2026 CNBC LLC. All Rights Reserved. A Division of NBCUniversal.
          </p>
          <p className="text-[10px] text-gray-600">
            Data is a real-time snapshot. Data provided by Refinitiv.
          </p>
        </div>
      </div>
    </footer>
  );
}
