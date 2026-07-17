
"use client"

import { useState, useMemo, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { AppButton } from "@/components/ui/AppButton"
import { TeacherCard } from "@/components/education/teacher-card"
import { TEACHERS, REGIONS_DATA } from "@/lib/mock-data"
import { Search, Filter, Globe, Zap, ChevronRight, Star, Users, ShieldAlert, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_INCREMENT = 8;
const WATCHING_BASE = 10;
const WATCHING_RANGE = 50;
const ANIMATION_STAGGER = 0.05;

const FRAUD_CATEGORIES = [
  { icon: "1️⃣", name: "Card-Not-Present (CNP) Fraud", desc: "Card details used for online or phone purchases where physical card is not required." },
  { icon: "2️⃣", name: "Skimming Fraud", desc: "Hidden devices copy data from cards used at ATMs or POS machines." },
  { icon: "3️⃣", name: "Account Takeover", desc: "Unauthorized access to bank or payment accounts for illegal transactions." },
  { icon: "4️⃣", name: "Identity Fraud", desc: "Stolen identity information used to open new fraudulent credit lines." },
  { icon: "5️⃣", name: "Lost or Stolen Card Fraud", desc: "A physical card is compromised and used before it can be neutralized." },
  { icon: "6️⃣", name: "Merchant Data Breach", desc: "Direct theft of cardholder data from vulnerable company databases." },
  { icon: "7️⃣", name: "Social Engineering / Phishing", desc: "Victims tricked into revealing sensitive details via fraudulent comms." },
];

export default function EducationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + LOAD_MORE_INCREMENT);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedSubject("all");
  };

  const filteredTeachers = useMemo(() => {
    return TEACHERS.filter(teacher => {
      const matchesSearch = 
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRegion = selectedRegion === "all" || teacher.regionId === selectedRegion;
      const matchesSubject = selectedSubject === "all" || teacher.subject === selectedSubject;
      
      return matchesSearch && matchesRegion && matchesSubject;
    });
  }, [searchQuery, selectedRegion, selectedSubject]);

  const displayedTeachers = filteredTeachers.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-brand-base text-text-primary selection:bg-brand-green/20 selection:text-brand-green">
      <Navbar />

      <section className="relative pt-44 pb-32 overflow-hidden bg-brand-void">
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <Badge variant="success" className="px-5 py-2">
              Private 1-on-1 Classes · Crypto Payments
            </Badge>

            <h1 className="text-5xl md:text-hero font-bold tracking-tight leading-[1.1] font-display">
              Find your <br />
              <span className="text-brand-green">Private Teacher</span>
            </h1>

            <p className="text-text-secondary text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              343 expert teachers across 7 global regions. Book instantly. Pay in crypto. Learn privately.
            </p>

            <div className="w-full max-w-3xl mt-8">
              <div className="flex flex-col md:flex-row items-center gap-4 bg-brand-surface p-3 border border-brand-border shadow-2xl">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search by subject, teacher, region..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-white placeholder:text-text-ghost font-medium"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial min-w-[160px]">
                    <select 
                      value={selectedRegion}
                      onChange={handleRegionChange}
                      className="w-full bg-brand-elevated border border-brand-border rounded-md px-4 py-3 text-sm font-bold text-text-secondary focus:ring-0 focus:border-brand-green outline-none appearance-none"
                    >
                      <option value="all" className="bg-[#111318] text-white">All Regions</option>
                      {REGIONS_DATA.map(r => (
                        <option key={r.id} value={r.id} className="bg-[#111318] text-white">
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  <AppButton className="px-8 h-12">Search</AppButton>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="border-y border-brand-border bg-brand-void py-6 overflow-hidden relative">
        <div className="flex items-center gap-8 animate-ticker whitespace-nowrap">
          {[...TEACHERS, ...TEACHERS].filter(t => t.is_live).map((t, i) => (
            <div key={`${t.id}-${i}`} className="flex items-center gap-4 px-8 border-r border-brand-border">
              <div className="relative">
                <img src={t.avatar_url} className="w-10 h-10 rounded-md object-cover border border-brand-border" alt={t.name} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-green rounded-full border-2 border-brand-void" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-brand-green uppercase tracking-widest">LIVE NOW</div>
                <div className="text-sm font-bold">{t.name} — {t.subject}</div>
              </div>
              <div className="text-[10px] font-bold text-text-muted uppercase px-2 py-0.5 rounded bg-brand-surface border border-brand-border font-mono">
                {hasMounted ? Math.floor(Math.random() * WATCHING_RANGE) + WATCHING_BASE : '--'} watching
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="py-32 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-32 space-y-12">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Regions
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedRegion("all")}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-md transition-all text-left border",
                      selectedRegion === "all" ? 'bg-brand-surface border-brand-green text-brand-green' : 'bg-transparent border-transparent text-text-muted hover:text-text-primary'
                    )}
                  >
                    <span className="text-sm font-bold">All Regions</span>
                    <span className="text-xs opacity-40 font-mono">343</span>
                  </button>
                  {REGIONS_DATA.map(region => (
                    <button 
                      key={region.id} 
                      onClick={() => setSelectedRegion(region.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-md border transition-all text-left group",
                        selectedRegion === region.id 
                        ? 'bg-brand-surface border-brand-green text-brand-green' 
                        : 'bg-transparent border-transparent text-text-muted hover:text-text-primary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{region.icon}</span>
                        <span className="text-sm font-bold">{region.name}</span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-all", selectedRegion === region.id ? 'opacity-100 translate-x-1' : 'opacity-0 group-hover:opacity-40')} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Subject Filter
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['all', 'Mathematics', 'Physics', 'Coding', 'Arabic', 'Trading'].map(sub => (
                    <button 
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={cn(
                        "px-4 py-2 rounded-md text-[11px] font-bold border transition-all uppercase tracking-widest font-mono",
                        selectedSubject === sub 
                        ? 'bg-brand-green/10 border-brand-green text-brand-green' 
                        : 'bg-brand-surface border-brand-border text-text-muted hover:border-brand-green/40'
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {selectedRegion === "all" ? "All Global Teachers" : REGIONS_DATA.find(r => r.id === selectedRegion)?.name}
                <span className="text-sm font-bold text-text-muted bg-brand-surface px-3 py-1 rounded-md font-mono">{filteredTeachers.length}</span>
              </h2>
              <AppButton variant="secondary" size="sm" className="h-10 px-6">
                <Filter className="w-4 h-4 mr-2" /> Sort by Rating
              </AppButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {displayedTeachers.map((teacher, idx) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * ANIMATION_STAGGER }}
                  >
                    <TeacherCard teacher={teacher} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredTeachers.length > visibleCount && (
              <div className="mt-20 text-center">
                <AppButton 
                  onClick={handleLoadMore}
                  variant="secondary" 
                  className="px-12 h-14 font-bold"
                >
                  Load More Teachers
                </AppButton>
              </div>
            )}

            {filteredTeachers.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-brand-surface rounded-md flex items-center justify-center mx-auto mb-8 border border-brand-border">
                  <Search className="w-10 h-10 text-text-ghost" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-text-primary">No teachers found</h3>
                <p className="text-text-secondary max-w-sm mx-auto">Try adjusting your filters or search query to find more expert operators.</p>
                <AppButton onClick={handleClearFilters} className="mt-8 px-10">Clear All Filters</AppButton>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-32 bg-brand-void border-y border-brand-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 font-display">Common Card-Related Fraud Categories (Awareness)</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Operational intelligence regarding global financial security risks and trade integrity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FRAUD_CATEGORIES.map((fraud, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                className="group h-full"
              >
                <ListingCard className="p-8 h-full bg-brand-surface border-brand-border group-hover:border-semantic-error transition-all flex flex-col space-y-4">
                  <div className="text-4xl mb-2">{fraud.icon}</div>
                  <h4 className="text-lg font-bold text-white group-hover:text-semantic-error transition-colors">{fraud.name}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed flex-1">
                    {fraud.desc}
                  </p>
                  <div className="pt-4 border-t border-brand-border mt-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      <ShieldAlert className="w-3.5 h-3.5" /> Security Protocol Node
                    </div>
                  </div>
                </ListingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
