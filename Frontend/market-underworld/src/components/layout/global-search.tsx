"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingBag, MessageSquare, ArrowRight, Loader2 } from "lucide-react"
import { getStorefrontProducts } from "@/lib/api/commerce"

const slugifyCategory = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";

interface SearchResult {
  type: string;
  name: string;
  sub: string;
  icon: typeof ShoppingBag;
  href: string;
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('open-global-search', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-global-search', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real product search (commerce-service's storefront search param) — debounced. Teacher/forum
  // results are intentionally not included: there's no teacher domain and no cross-community
  // forum search endpoint in the backend (see backlog notes) — showing fake entries for those
  // would be exactly the kind of mock UI this pass is removing.
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const handle = setTimeout(() => {
      getStorefrontProducts(undefined, { search: query, limit: 8 })
        .then((products) => {
          setResults(products.map((p) => ({
            type: 'Product',
            name: p.name,
            sub: `${p.price} ${p.currencyCode}`,
            icon: ShoppingBag,
            href: `/shop/${slugifyCategory(p.categoryName || 'general')}/${p.slug}`,
          })));
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleResultClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-[#0A0A0F]/90 backdrop-blur-xl flex items-start justify-center pt-32 px-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#5A5A7A] group-focus-within:text-[#39FF14] transition-colors" />
              <input 
                autoFocus
                type="text"
                placeholder="Search global nodes, operators, assets..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-20 bg-[#111318] border border-white/10 rounded-[2rem] pl-16 pr-24 text-xl text-white outline-none focus:border-[#39FF14]/50 transition-all shadow-2xl"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="px-2 py-1 bg-white/5 rounded border border-white/10 text-[10px] font-bold text-[#5A5A7A]">ESC</div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {query && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-[#111318] border border-white/10 rounded-[2rem] shadow-3xl overflow-hidden"
                >
                  <div className="text-[10px] font-bold text-[#5A5A7A] uppercase tracking-widest px-4 mb-4 flex items-center gap-2">
                    Product Results ({results.length})
                    {searching && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  <div className="space-y-1">
                    {results.length > 0 ? results.map((res, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleResultClick(res.href)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#5A5A7A] group-hover:text-[#39FF14] transition-colors">
                            <res.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{res.name}</div>
                            <div className="text-[10px] font-bold text-[#5A5A7A] uppercase">{res.sub} • {res.type}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#5A5A7A] opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    )) : (
                      <div className="p-8 text-center text-gray-500 font-mono text-sm">
                        Zero matches detected for this identifier.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!query && (
              <div className="mt-8 grid grid-cols-3 gap-4 px-4">
                {[
                  { label: 'Exchange', icon: ShoppingBag, href: '/marketplace' },
                  { label: 'Intelligence', icon: MessageSquare, href: '/forum' },
                  { label: 'Streams', icon: Search, href: '/live-sessions' }
                ].map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => handleResultClick(item.href)}
                    className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-bold text-[#5A5A7A] uppercase tracking-widest hover:border-[#39FF14]/50 hover:text-white transition-all flex flex-col items-center gap-3"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
