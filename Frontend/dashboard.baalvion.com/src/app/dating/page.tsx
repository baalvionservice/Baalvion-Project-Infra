'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Star, MapPin, Briefcase, TrendingUp, Clock, Shield, ChevronRight,
  Search, Filter, Grid3x3, LayoutList, Trophy, Flame, Zap, X, CheckCircle,
  DollarSign, Calendar, MessageCircle, Crown, Sparkles, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'grid' | 'deck' | 'leaderboard' | 'saved';
import { FOUNDERS, type Sector, type City, type Founder } from './founders-data';

const CITIES: City[] = ['Mumbai', 'Delhi', 'Bangalore'];
const SECTORS: Sector[] = ['AI/ML', 'FinTech', 'Web3', 'SaaS', 'HealthTech', 'EdTech', 'D2C', 'CleanTech', 'SpaceTech', 'AgriTech'];

const availabilityColor = {
  Available: 'bg-green-500',
  Limited: 'bg-yellow-500',
  Busy: 'bg-red-500',
};

const cityGradient: Record<City, string> = {
  Mumbai: 'from-orange-500/20 to-red-500/20',
  Delhi: 'from-blue-500/20 to-indigo-500/20',
  Bangalore: 'from-purple-500/20 to-pink-500/20',
};

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({
  founder, open, onClose,
}: { founder: Founder | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [hours, setHours] = useState(2);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const total = founder ? founder.hourlyRate * hours : 0;
  const escrowFee = Math.round(total * 0.05);

  const handleBook = () => {
    if (!date) { toast({ title: 'Please select a date', variant: 'destructive' }); return; }
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('success');
    toast({
      title: '✅ Booking Confirmed!',
      description: `Funds locked in escrow. ${founder?.name} will confirm shortly.`,
    });
  };

  const handleClose = () => {
    setStep('details');
    setHours(2);
    setDate('');
    setNote('');
    onClose();
  };

  if (!founder) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{founder.avatar}</span>
                Book {founder.name}
              </DialogTitle>
              <DialogDescription>{founder.title} at {founder.company}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Session Rate</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{founder.hourlyRate.toLocaleString('en-IN')}<span className="text-sm font-normal text-muted-foreground">/hr</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Duration (hours)</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setHours(Math.max(1, hours - 1))}>−</Button>
                  <span className="w-8 text-center font-semibold">{hours}</span>
                  <Button variant="outline" size="sm" onClick={() => setHours(Math.min(8, hours + 1))}>+</Button>
                  <span className="text-sm text-muted-foreground ml-2">(max 8hrs/session)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Preferred Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Note to Founder</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-20"
                  placeholder="What do you want to discuss or experience?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Session fee</span><span>₹{(founder.hourlyRate * hours).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Platform fee (5%)</span><span>₹{escrowFee.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold border-t pt-1 mt-1">
                  <span>Total (locked in Escrow)</span><span className="text-primary">₹{(total + escrowFee).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleBook} className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Book with Escrow
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>Your funds will be locked in escrow until the session is completed.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-semibold">{founder.name} — {hours} hour session</p>
                <p className="text-sm text-muted-foreground">Date: {new Date(date).toDateString()}</p>
                <p className="text-lg font-bold text-primary">₹{(total + escrowFee).toLocaleString('en-IN')} locked in escrow</p>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Shield className="h-3 w-3 mt-0.5 shrink-0" />
                Funds released to founder only after you confirm session completion. 100% refund if cancelled 24h before.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
              <Button onClick={handleConfirm}>Confirm &amp; Lock Escrow</Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Booking Confirmed!</h2>
                <p className="text-muted-foreground mt-1">
                  ₹{(total + escrowFee).toLocaleString('en-IN')} is locked in escrow.
                  {founder.name} will confirm within 2 hours.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild><Link href="/dating/my-bookings">View Bookings</Link></Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Founder Card ──────────────────────────────────────────────────────────────
function FounderCard({ founder, onBook, onLike, liked }: {
  founder: Founder;
  onBook: (f: Founder) => void;
  onLike: (id: string) => void;
  liked: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      {founder.featured && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />Featured
          </Badge>
        </div>
      )}
      <button
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
        onClick={() => onLike(founder.id)}
      >
        <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
      </button>

      <CardHeader className={`bg-gradient-to-br ${cityGradient[founder.city]} pb-3`}>
        <div className="flex items-start gap-3">
          <div className="text-4xl leading-none">{founder.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base truncate">{founder.name}</h3>
              {founder.verified && <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{founder.title}</p>
            <p className="text-xs font-medium truncate">{founder.company}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3 pb-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />{founder.city}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Briefcase className="h-3 w-3" />{founder.sector}
          </div>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${availabilityColor[founder.availability]}`} />
            <span className="text-xs">{founder.availability}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{founder.bio}</p>

        <div className="flex flex-wrap gap-1">
          {founder.tags.map(t => (
            <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">{t}</Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">{founder.rating}</span>
            <span className="text-xs text-muted-foreground">({founder.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />{founder.valuation}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-bold text-primary text-sm">₹{founder.hourlyRate.toLocaleString('en-IN')}<span className="text-xs font-normal">/hr</span></p>
          </div>
          <Button
            size="sm"
            onClick={() => onBook(founder)}
            disabled={founder.availability === 'Busy'}
            className="text-xs"
          >
            {founder.availability === 'Busy' ? 'Unavailable' : 'Book Now'}
            {founder.availability !== 'Busy' && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>
        <Link href={`/dating/${founder.id}`} className="w-full">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary">
            View Full Profile →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
function LeaderboardRow({ founder, rank, onBook }: { founder: Founder; rank: number; onBook: (f: Founder) => void }) {
  const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="w-8 text-center font-bold text-lg">{rankIcon}</div>
      <div className="text-2xl">{founder.avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold truncate">{founder.name}</p>
          {founder.verified && <CheckCircle className="h-3.5 w-3.5 text-blue-500" />}
        </div>
        <p className="text-xs text-muted-foreground">{founder.company} · {founder.city}</p>
      </div>
      <div className="hidden md:flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{founder.rating}</span>
      </div>
      <div className="hidden md:block text-sm font-medium text-primary">{founder.valuation}</div>
      <div className="text-sm font-bold">₹{founder.hourlyRate.toLocaleString('en-IN')}<span className="text-xs font-normal text-muted-foreground">/hr</span></div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="text-xs">
          <Link href={`/dating/${founder.id}`}>Profile</Link>
        </Button>
        <Button size="sm" onClick={() => onBook(founder)} disabled={founder.availability === 'Busy'} className="text-xs">
          Book
        </Button>
      </div>
    </div>
  );
}

// ─── Deck View (Tinder-style) ──────────────────────────────────────────────────
function DeckView({ founders, onBook }: { founders: Founder[]; onBook: (f: Founder) => void }) {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);

  if (founders.length === 0) return <p className="text-center text-muted-foreground py-12">No founders match your filters.</p>;
  if (idx >= founders.length) return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="text-5xl">🎉</div>
      <h3 className="text-xl font-bold">You've seen everyone!</h3>
      <p className="text-muted-foreground">Switch to Grid view to browse again or adjust filters.</p>
      <Button onClick={() => setIdx(0)}>Start Over</Button>
    </div>
  );

  const founder = founders[idx];
  const handleLike = () => { setLiked([...liked, founder.id]); setIdx(idx + 1); };
  const handlePass = () => setIdx(idx + 1);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-muted-foreground">{idx + 1} of {founders.length} founders</p>
      <div className="w-full max-w-sm">
        <Card className={`overflow-hidden bg-gradient-to-br ${cityGradient[founder.city]} border-2`}>
          <CardHeader className="text-center pb-2">
            <div className="text-6xl mx-auto mb-2">{founder.avatar}</div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-2xl font-bold">{founder.name}</h2>
              {founder.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>
            <p className="text-muted-foreground">{founder.title} · {founder.company}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="secondary">{founder.city}</Badge>
              <Badge variant="outline">{founder.sector}</Badge>
              <span className={`h-2 w-2 rounded-full ${availabilityColor[founder.availability]}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">{founder.bio}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-background/60 p-2">
                <p className="font-bold text-primary">{founder.valuation}</p>
                <p className="text-xs text-muted-foreground">Valuation</p>
              </div>
              <div className="rounded-lg bg-background/60 p-2">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <p className="font-bold">{founder.rating}</p>
                </div>
                <p className="text-xs text-muted-foreground">{founder.reviews} reviews</p>
              </div>
              <div className="rounded-lg bg-background/60 p-2">
                <p className="font-bold">₹{(founder.hourlyRate / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {founder.achievements.map(a => (
                <Badge key={a} className="text-xs bg-primary/10 text-primary border-primary/20">{a}</Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-around pb-4">
            <Button variant="outline" size="lg" className="w-16 h-16 rounded-full text-red-500" onClick={handlePass}>
              <X className="h-6 w-6" />
            </Button>
            <div className="flex flex-col items-center gap-2">
              <Button size="sm" onClick={() => onBook(founder)} className="px-6" disabled={founder.availability === 'Busy'}>
                Book ₹{founder.hourlyRate.toLocaleString('en-IN')}/hr
              </Button>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary">
                <Link href={`/dating/${founder.id}`}>View Full Profile</Link>
              </Button>
            </div>
            <Button variant="outline" size="lg" className="w-16 h-16 rounded-full text-green-500" onClick={handleLike}>
              <Heart className="h-6 w-6" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DatingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [city, setCity] = useState<City | 'All'>('All');
  const [sector, setSector] = useState<Sector | 'All'>('All');
  const [availability, setAvailability] = useState<'All' | 'Available' | 'Limited'>('All');
  const [priceRange, setPriceRange] = useState<'All' | 'Under5k' | '5k-10k' | 'Over10k'>('All');
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleBook = useCallback((f: Founder) => {
    setSelectedFounder(f);
    setBookingOpen(true);
  }, []);

  const handleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('dating_liked_founders', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('dating_liked_founders');
    if (saved) {
      try { setLikedIds(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const filtered = useMemo(() => {
    return FOUNDERS.filter(f => {
      if (city !== 'All' && f.city !== city) return false;
      if (sector !== 'All' && f.sector !== sector) return false;
      if (availability !== 'All' && f.availability !== availability) return false;
      if (priceRange === 'Under5k' && f.hourlyRate >= 5000) return false;
      if (priceRange === '5k-10k' && (f.hourlyRate < 5000 || f.hourlyRate > 10000)) return false;
      if (priceRange === 'Over10k' && f.hourlyRate <= 10000) return false;
      if (viewMode === 'saved' && !likedIds.includes(f.id)) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
          !f.company.toLowerCase().includes(search.toLowerCase()) &&
          !f.sector.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [city, sector, availability, search, priceRange, viewMode, likedIds]);

  const sorted = useMemo(() => {
    if (viewMode === 'leaderboard') return [...filtered].sort((a, b) => b.totalBookings - a.totalBookings);
    return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
  }, [filtered, viewMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h1 className="text-3xl font-bold">Rent a Founder</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">Exclusive</Badge>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Book private sessions with India's top startup founders. Only verified CEOs &amp; entrepreneurs.
            All bookings protected by escrow.
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> Mumbai · Delhi · Bangalore</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-green-500" /> 100% Escrow Protected</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-yellow-500" /> {FOUNDERS.length}+ Verified Founders</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dating/my-bookings"><Calendar className="h-4 w-4 mr-2" />My Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dating/founder-dashboard"><Briefcase className="h-4 w-4 mr-2" />Founder Portal</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dating/verify"><Shield className="h-4 w-4 mr-2" />Apply as Founder</Link>
          </Button>
          <Button variant="destructive" size="sm" asChild>
            <Link href="/dating/admin-kyc">Admin KYC</Link>
          </Button>
        </div>
      </div>

      {/* City Hero Strips */}
      <div className="grid grid-cols-3 gap-3">
        {CITIES.map(c => {
          const count = FOUNDERS.filter(f => f.city === c).length;
          return (
            <button
              key={c}
              onClick={() => setCity(city === c ? 'All' : c)}
              className={`rounded-xl p-4 text-left border-2 transition-all ${
                city === c ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/50 hover:border-muted-foreground/30'
              }`}
            >
              <p className="font-bold">{c}</p>
              <p className="text-xs text-muted-foreground">{count} founders available</p>
              <Badge variant="outline" className="mt-1 text-xs">Tier 1 City</Badge>
            </button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search founder, company, sector..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Select value={sector} onValueChange={v => setSector(v as Sector | 'All')}>
          <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="All Sectors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sectors</SelectItem>
            {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={availability} onValueChange={v => setAvailability(v as 'All' | 'Available' | 'Limited')}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Availability" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Limited">Limited</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={v => setPriceRange(v as any)}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Price" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Prices</SelectItem>
            <SelectItem value="Under5k">&lt; ₹5,000/hr</SelectItem>
            <SelectItem value="5k-10k">₹5K - ₹10K/hr</SelectItem>
            <SelectItem value="Over10k">&gt; ₹10,000/hr</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md overflow-hidden">
          {(['grid', 'deck', 'leaderboard', 'saved'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`p-2.5 transition-colors ${viewMode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title={m}
            >
              {m === 'grid' && <Grid3x3 className="h-4 w-4" />}
              {m === 'deck' && <LayoutList className="h-4 w-4" />}
              {m === 'leaderboard' && <Trophy className="h-4 w-4" />}
              {m === 'saved' && <Heart className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <strong>{sorted.length}</strong> founders
          {city !== 'All' && <> in <strong>{city}</strong></>}
          {sector !== 'All' && <> · <strong>{sector}</strong></>}
        </p>
        {likedIds.length > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Heart className="h-3 w-3 fill-red-500 text-red-500" /> {likedIds.length} saved
          </Badge>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map(f => (
            <FounderCard key={f.id} founder={f} onBook={handleBook} onLike={handleLike} liked={likedIds.includes(f.id)} />
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No founders match your filters. Try adjusting the criteria.
            </div>
          )}
        </div>
      )}

      {viewMode === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map(f => (
            <FounderCard key={f.id} founder={f} onBook={handleBook} onLike={handleLike} liked={likedIds.includes(f.id)} />
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              You haven't saved any founders yet. Like a founder to save them here!
            </div>
          )}
        </div>
      )}

      {viewMode === 'deck' && <DeckView founders={sorted} onBook={handleBook} />}

      {viewMode === 'leaderboard' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {sorted.slice(0, 3).map((f, i) => (
              <Card key={f.id} className={`text-center p-4 ${i === 0 ? 'border-yellow-400 ring-2 ring-yellow-400/30' : ''}`}>
                <div className="text-3xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div className="text-2xl mb-1">{f.avatar}</div>
                <p className="font-bold text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.totalBookings} bookings</p>
                <p className="text-primary font-bold text-sm mt-1">₹{f.hourlyRate.toLocaleString('en-IN')}/hr</p>
                <Button size="sm" className="mt-2 w-full text-xs" onClick={() => handleBook(f)}>Book</Button>
                <Button asChild variant="link" size="sm" className="mt-1 w-full text-xs h-auto p-0 text-muted-foreground hover:text-primary">
                  <Link href={`/dating/${f.id}`}>View Profile</Link>
                </Button>
              </Card>
            ))}
          </div>
          <div className="space-y-2">
            {sorted.slice(3).map((f, i) => (
              <LeaderboardRow key={f.id} founder={f} rank={i + 4} onBook={handleBook} />
            ))}
          </div>
        </div>
      )}

      <BookingModal founder={selectedFounder} open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
