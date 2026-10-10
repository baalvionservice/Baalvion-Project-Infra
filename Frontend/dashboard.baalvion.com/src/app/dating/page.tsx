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

// ─── Types ────────────────────────────────────────────────────────────────────
export type Sector = 'AI/ML' | 'FinTech' | 'Web3' | 'SaaS' | 'HealthTech' | 'EdTech' | 'D2C' | 'CleanTech' | 'SpaceTech' | 'AgriTech';
export type City = 'Mumbai' | 'Delhi' | 'Bangalore';
type ViewMode = 'grid' | 'deck' | 'leaderboard' | 'saved';

export interface Founder {
  id: string;
  name: string;
  title: string;
  company: string;
  sector: Sector;
  city: City;
  valuation: string;
  hourlyRate: number;
  rating: number;
  reviews: number;
  totalBookings: number;
  bio: string;
  tags: string[];
  verified: boolean;
  featured: boolean;
  avatar: string;
  availability: 'Available' | 'Busy' | 'Limited';
  languages: string[];
  achievements: string[];
}

// ─── 30 Founder Mock Data (scalable to 100+) ─────────────────────────────────
export const FOUNDERS: Founder[] = [
  {
    id: 'f1', name: 'Arjun Mehta', title: 'CEO & Co-Founder', company: 'NeuroStack AI',
    sector: 'AI/ML', city: 'Mumbai', valuation: '$120M', hourlyRate: 8500,
    rating: 4.9, reviews: 142, totalBookings: 387, featured: true, verified: true,
    bio: 'Ex-Google Brain. Built NLP models used by 50M+ users. Forbes 30 Under 30.',
    tags: ['AI Strategy', 'Fundraising', 'Product Vision'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '👨‍💻',
    achievements: ['Forbes 30U30', 'YC S21', '$120M Series B'],
  },
  {
    id: 'f2', name: 'Priya Sharma', title: 'Founder & CEO', company: 'PaySpark',
    sector: 'FinTech', city: 'Bangalore', valuation: '$85M', hourlyRate: 7200,
    rating: 4.8, reviews: 98, totalBookings: 251, featured: true, verified: true,
    bio: 'Ex-Razorpay. Processing ₹500Cr+ monthly. RBI Innovation Award 2024.',
    tags: ['Payments', 'Regulatory', 'Scale'], availability: 'Limited',
    languages: ['English', 'Hindi', 'Kannada'], avatar: '👩‍💼',
    achievements: ['RBI Award', 'Sequoia Backed', '500Cr+ Volume'],
  },
  {
    id: 'f3', name: 'Rahul Tiwari', title: 'Co-Founder & CTO', company: 'ChainBridge',
    sector: 'Web3', city: 'Delhi', valuation: '$200M', hourlyRate: 9800,
    rating: 4.7, reviews: 67, totalBookings: 189, featured: true, verified: true,
    bio: 'Ex-Coinbase Protocol. Built cross-chain bridges processing $2B+ in volume.',
    tags: ['Web3', 'DeFi', 'Protocol Design'], availability: 'Busy',
    languages: ['English', 'Hindi'], avatar: '🧑‍🔬',
    achievements: ['$200M TVL', 'a16z Crypto', 'ETHGlobal Winner'],
  },
  {
    id: 'f4', name: 'Sneha Kapoor', title: 'CEO', company: 'MedMind Health',
    sector: 'HealthTech', city: 'Mumbai', valuation: '$45M', hourlyRate: 5500,
    rating: 4.9, reviews: 203, totalBookings: 512, featured: false, verified: true,
    bio: 'AIIMS graduate turned healthtech founder. 2M+ patients served across tier-2 cities.',
    tags: ['HealthTech', 'B2B SaaS', 'Rural Health'], availability: 'Available',
    languages: ['English', 'Hindi', 'Marathi'], avatar: '👩‍⚕️',
    achievements: ['2M Patients', 'NASSCOM Award', 'Series A ₹90Cr'],
  },
  {
    id: 'f5', name: 'Karan Oberoi', title: 'Founder', company: 'SkillBridge',
    sector: 'EdTech', city: 'Bangalore', valuation: '$30M', hourlyRate: 4800,
    rating: 4.6, reviews: 89, totalBookings: 176, featured: false, verified: true,
    bio: 'Helping 500K+ students land jobs. Backed by Lightspeed & Blume.',
    tags: ['EdTech', 'Jobs', 'Skilling'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '👨‍🎓',
    achievements: ['500K Students', 'Lightspeed', 'Blume Backed'],
  },
  {
    id: 'f6', name: 'Ananya Rao', title: 'Co-Founder & CMO', company: 'StyleSense',
    sector: 'D2C', city: 'Delhi', valuation: '$55M', hourlyRate: 6200,
    rating: 4.8, reviews: 115, totalBookings: 298, featured: false, verified: true,
    bio: "Built India's fastest-growing fashion D2C brand. ₹200Cr revenue in 3 years.",
    tags: ['D2C', 'Brand Building', 'Growth'], availability: 'Limited',
    languages: ['English', 'Hindi'], avatar: '👩‍🎨',
    achievements: ['₹200Cr Revenue', 'Fireside Backed', 'ET Startup of Year'],
  },
  {
    id: 'f7', name: 'Vivek Nair', title: 'CEO & Founder', company: 'SolarNXT',
    sector: 'CleanTech', city: 'Mumbai', valuation: '$78M', hourlyRate: 7000,
    rating: 4.7, reviews: 54, totalBookings: 143, featured: false, verified: true,
    bio: 'Ex-Tesla India. Deploying 500MW of solar across Maharashtra.',
    tags: ['CleanTech', 'Solar', 'ESG'], availability: 'Available',
    languages: ['English', 'Hindi', 'Malayalam'], avatar: '🌱',
    achievements: ['500MW Deployed', 'Climate Tech 100', 'Net Zero Pioneer'],
  },
  {
    id: 'f8', name: 'Divya Joshi', title: 'Founder & CEO', company: 'AgroSense',
    sector: 'AgriTech', city: 'Delhi', valuation: '$22M', hourlyRate: 4000,
    rating: 4.5, reviews: 71, totalBookings: 134, featured: false, verified: true,
    bio: 'Using IoT + AI to transform 100,000 farms across Haryana and Punjab.',
    tags: ['AgriTech', 'IoT', 'Rural India'], availability: 'Available',
    languages: ['English', 'Hindi', 'Punjabi'], avatar: '🌾',
    achievements: ['100K Farms', 'USAID Grant', 'Global AgTech 50'],
  },
  {
    id: 'f9', name: 'Rohan Batra', title: 'Co-Founder', company: 'OrbitX Space',
    sector: 'SpaceTech', city: 'Bangalore', valuation: '$150M', hourlyRate: 12000,
    rating: 4.9, reviews: 33, totalBookings: 89, featured: true, verified: true,
    bio: 'ISRO scientist turned startup founder. Launching India\'s first commercial satellite constellation.',
    tags: ['SpaceTech', 'Deep Tech', 'Satellites'], availability: 'Limited',
    languages: ['English', 'Hindi'], avatar: '🚀',
    achievements: ['3 Satellites Launched', 'ISRO Certified', '$150M Raised'],
  },
  {
    id: 'f10', name: 'Ishaan Gupta', title: 'CEO', company: 'CloudForge SaaS',
    sector: 'SaaS', city: 'Bangalore', valuation: '$95M', hourlyRate: 8000,
    rating: 4.8, reviews: 178, totalBookings: 445, featured: false, verified: true,
    bio: 'Ex-Salesforce. Built B2B SaaS platform with 2000+ enterprise clients globally.',
    tags: ['SaaS', 'Enterprise', 'GTM'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '☁️',
    achievements: ['2000+ Clients', '150 Countries', 'Bessemer Backed'],
  },
  {
    id: 'f11', name: 'Tanya Reddy', title: 'Founder & CEO', company: 'LegalAI',
    sector: 'AI/ML', city: 'Delhi', valuation: '$40M', hourlyRate: 5800,
    rating: 4.7, reviews: 92, totalBookings: 211, featured: false, verified: true,
    bio: 'Ex-Supreme Court lawyer + IIT Mumbai. AI for legal contracts, used by 500+ law firms.',
    tags: ['LegalTech', 'AI', 'B2B'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '⚖️',
    achievements: ['500+ Law Firms', 'IIT TechFest Winner', 'Tiger Global'],
  },
  {
    id: 'f12', name: 'Sameer Khanna', title: 'Co-Founder', company: 'QuickLoans',
    sector: 'FinTech', city: 'Mumbai', valuation: '$110M', hourlyRate: 8800,
    rating: 4.6, reviews: 64, totalBookings: 167, featured: false, verified: true,
    bio: 'Former Goldman Sachs MD. Disbursed ₹5000Cr in micro-loans to SMBs.',
    tags: ['Lending', 'Credit', 'NBFC'], availability: 'Limited',
    languages: ['English', 'Hindi'], avatar: '💰',
    achievements: ['₹5000Cr Disbursed', 'GS Alumni', 'RBI NBFC License'],
  },
  {
    id: 'f13', name: 'Nidhi Verma', title: 'CEO & Founder', company: 'FitPulse',
    sector: 'HealthTech', city: 'Delhi', valuation: '$28M', hourlyRate: 4500,
    rating: 4.8, reviews: 131, totalBookings: 322, featured: false, verified: true,
    bio: 'Sports medicine doctor + entrepreneur. 5M+ active users on AI fitness platform.',
    tags: ['HealthTech', 'Fitness', 'Consumer'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '💪',
    achievements: ['5M Users', 'Sequoia Scout', 'Inc42 HealthTech #1'],
  },
  {
    id: 'f14', name: 'Aditya Sinha', title: 'Founder & CEO', company: 'MetaVerse Studio',
    sector: 'Web3', city: 'Bangalore', valuation: '$65M', hourlyRate: 7500,
    rating: 4.5, reviews: 43, totalBookings: 98, featured: false, verified: true,
    bio: 'Gaming + Web3 pioneer. Built India\'s first metaverse studio with 500K+ DAUs.',
    tags: ['Gaming', 'NFTs', 'Metaverse'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '🎮',
    achievements: ['500K DAUs', 'Animoca Backed', '50+ Brand Partners'],
  },
  {
    id: 'f15', name: 'Pooja Agarwal', title: 'Co-Founder & CEO', company: 'GreenBite',
    sector: 'D2C', city: 'Mumbai', valuation: '$18M', hourlyRate: 3800,
    rating: 4.7, reviews: 87, totalBookings: 198, featured: false, verified: true,
    bio: 'Sustainable food startup. ₹50Cr ARR in 2 years, 0% food waste policy.',
    tags: ['FoodTech', 'Sustainability', 'D2C'], availability: 'Available',
    languages: ['English', 'Hindi', 'Gujarati'], avatar: '🥗',
    achievements: ['₹50Cr ARR', 'Zero Waste', 'CII Sustainability Award'],
  },
  {
    id: 'f16', name: 'Manish Dubey', title: 'CEO', company: 'EduVerse AI',
    sector: 'EdTech', city: 'Delhi', valuation: '$42M', hourlyRate: 5200,
    rating: 4.6, reviews: 76, totalBookings: 154, featured: false, verified: true,
    bio: 'Personalized learning for 1M+ students using generative AI. Ex-BYJU\'S CPO.',
    tags: ['EdTech', 'GenAI', 'K-12'], availability: 'Limited',
    languages: ['English', 'Hindi'], avatar: '📚',
    achievements: ['1M Students', 'Ex-BYJU\'S', 'Surge Backed'],
  },
  {
    id: 'f17', name: 'Lavanya Kumar', title: 'Founder & CEO', company: 'WindForce Energy',
    sector: 'CleanTech', city: 'Mumbai', valuation: '$95M', hourlyRate: 8200,
    rating: 4.9, reviews: 41, totalBookings: 112, featured: false, verified: true,
    bio: 'IIT Madras + MIT alumni. 1GW wind energy assets under management.',
    tags: ['CleanTech', 'Renewable', 'Infrastructure'], availability: 'Available',
    languages: ['English', 'Tamil', 'Hindi'], avatar: '💨',
    achievements: ['1GW Assets', 'MIT Energy Fellow', 'Bloomberg NEF Pioneer'],
  },
  {
    id: 'f18', name: 'Devraj Pillai', title: 'Co-Founder', company: 'DataBridge',
    sector: 'SaaS', city: 'Bangalore', valuation: '$55M', hourlyRate: 6500,
    rating: 4.7, reviews: 109, totalBookings: 267, featured: false, verified: true,
    bio: 'Data infrastructure for Indian enterprises. 300+ clients, $0 to $10M ARR in 18 months.',
    tags: ['Data', 'Infrastructure', 'Enterprise SaaS'], availability: 'Available',
    languages: ['English', 'Tamil', 'Malayalam'], avatar: '🗄️',
    achievements: ['$10M ARR', '18 Months', 'Matrix Partners'],
  },
  {
    id: 'f19', name: 'Rashmi Singh', title: 'CEO & Founder', company: 'CropX AgriTech',
    sector: 'AgriTech', city: 'Delhi', valuation: '$35M', hourlyRate: 4600,
    rating: 4.5, reviews: 58, totalBookings: 129, featured: false, verified: true,
    bio: 'Empowering 200K farmers with precision agriculture tools. FAO recognition.',
    tags: ['AgriTech', 'Precision Farming', 'Climate'], availability: 'Limited',
    languages: ['English', 'Hindi', 'Bhojpuri'], avatar: '🚜',
    achievements: ['200K Farmers', 'FAO Award', 'Acumen Fellow'],
  },
  {
    id: 'f20', name: 'Neil Mathew', title: 'Founder & CTO', company: 'CipherSafe',
    sector: 'SaaS', city: 'Bangalore', valuation: '$70M', hourlyRate: 7800,
    rating: 4.8, reviews: 82, totalBookings: 199, featured: false, verified: true,
    bio: 'Ex-Palo Alto Networks. Cybersecurity SaaS protecting 1000+ Indian enterprises.',
    tags: ['Cybersecurity', 'SaaS', 'Enterprise'], availability: 'Available',
    languages: ['English', 'Malayalam'], avatar: '🔐',
    achievements: ['1000+ Clients', 'Gartner Cool Vendor', 'NSF Award'],
  },
  {
    id: 'f21', name: 'Shreya Bansal', title: 'CEO', company: 'NanoMed',
    sector: 'HealthTech', city: 'Mumbai', valuation: '$60M', hourlyRate: 6800,
    rating: 4.9, reviews: 37, totalBookings: 94, featured: false, verified: true,
    bio: 'BITS Pilani + Johns Hopkins. Nanomedicine startup with 3 patents, 2 FDA approvals.',
    tags: ['BioTech', 'Nanomed', 'FDA'], availability: 'Busy',
    languages: ['English', 'Hindi'], avatar: '🔬',
    achievements: ['3 Patents', '2 FDA Approvals', 'DST Grant'],
  },
  {
    id: 'f22', name: 'Tanvir Ahmed', title: 'Co-Founder & CEO', company: 'InsureAI',
    sector: 'FinTech', city: 'Delhi', valuation: '$48M', hourlyRate: 6000,
    rating: 4.6, reviews: 93, totalBookings: 214, featured: false, verified: true,
    bio: 'InsurTech pioneer. AI-underwriting reducing claim fraud by 60%, backed by Accel.',
    tags: ['InsurTech', 'AI', 'Fraud Prevention'], availability: 'Available',
    languages: ['English', 'Hindi', 'Urdu'], avatar: '🛡️',
    achievements: ['60% Less Fraud', 'Accel India', 'IRDA Sandboxed'],
  },
  {
    id: 'f23', name: 'Meghna Iyer', title: 'Founder & CEO', company: 'SpaceLearn',
    sector: 'SpaceTech', city: 'Bangalore', valuation: '$25M', hourlyRate: 5000,
    rating: 4.7, reviews: 29, totalBookings: 67, featured: false, verified: true,
    bio: 'Made STEM education reach 500K rural students via satellite-powered learning.',
    tags: ['EdTech', 'SpaceTech', 'Rural Impact'], availability: 'Available',
    languages: ['English', 'Tamil', 'Kannada'], avatar: '🛸',
    achievements: ['500K Students', 'ISRO Partner', 'Skoll Foundation'],
  },
  {
    id: 'f24', name: 'Rishi Dalmia', title: 'CEO & Founder', company: 'CarbonZero',
    sector: 'CleanTech', city: 'Mumbai', valuation: '$55M', hourlyRate: 6400,
    rating: 4.8, reviews: 51, totalBookings: 123, featured: false, verified: true,
    bio: 'Carbon credit marketplace with 10M tons CO2 offset. COP28 featured startup.',
    tags: ['Carbon', 'ESG', 'Marketplace'], availability: 'Available',
    languages: ['English', 'Hindi', 'Gujarati'], avatar: '🌍',
    achievements: ['10M Tons Offset', 'COP28 Speaker', 'McKinsey Backed'],
  },
  {
    id: 'f25', name: 'Aditi Ghosh', title: 'Founder & CEO', company: 'TalentForge',
    sector: 'SaaS', city: 'Bangalore', valuation: '$33M', hourlyRate: 5400,
    rating: 4.6, reviews: 88, totalBookings: 209, featured: false, verified: true,
    bio: 'HR-tech platform for 500+ companies. Reduced hiring time by 70% with AI.',
    tags: ['HRTech', 'AI Recruiting', 'SaaS'], availability: 'Limited',
    languages: ['English', 'Bengali', 'Hindi'], avatar: '🎯',
    achievements: ['500+ Companies', '70% Faster Hiring', 'Peak XV'],
  },
  {
    id: 'f26', name: 'Kabir Sethi', title: 'Co-Founder & CEO', company: 'DriveX EV',
    sector: 'CleanTech', city: 'Delhi', valuation: '$88M', hourlyRate: 7600,
    rating: 4.7, reviews: 62, totalBookings: 148, featured: false, verified: true,
    bio: 'EV fleet company with 5000+ vehicles on Indian roads. Raised $88M Series B.',
    tags: ['EV', 'Fleet', 'Logistics'], availability: 'Available',
    languages: ['English', 'Hindi', 'Punjabi'], avatar: '⚡',
    achievements: ['5000+ EVs', '$88M Series B', 'NITI Aayog Partner'],
  },
  {
    id: 'f27', name: 'Vandana Patel', title: 'Founder & CEO', company: 'FoodSafe AI',
    sector: 'AI/ML', city: 'Mumbai', valuation: '$20M', hourlyRate: 4200,
    rating: 4.5, reviews: 73, totalBookings: 161, featured: false, verified: true,
    bio: 'AI for food safety testing. 100+ food brands rely on our platform.',
    tags: ['FoodTech', 'AI', 'B2B'], availability: 'Available',
    languages: ['English', 'Hindi', 'Gujarati'], avatar: '🍽️',
    achievements: ['100+ Brands', 'FSSAI Award', 'IIM-A CIIE'],
  },
  {
    id: 'f28', name: 'Hardik Shah', title: 'CEO & Founder', company: 'PropRadar',
    sector: 'SaaS', city: 'Bangalore', valuation: '$42M', hourlyRate: 5600,
    rating: 4.7, reviews: 96, totalBookings: 228, featured: false, verified: true,
    bio: 'PropTech platform helping 1M+ homebuyers make data-driven decisions.',
    tags: ['PropTech', 'Real Estate', 'Data'], availability: 'Available',
    languages: ['English', 'Hindi', 'Gujarati'], avatar: '🏠',
    achievements: ['1M+ Users', 'Pravega Backed', 'ET Startup Awards'],
  },
  {
    id: 'f29', name: 'Naina Thakur', title: 'Founder', company: 'MoodMap AI',
    sector: 'AI/ML', city: 'Delhi', valuation: '$15M', hourlyRate: 3500,
    rating: 4.6, reviews: 49, totalBookings: 103, featured: false, verified: true,
    bio: 'Mental health AI startup. 100K+ users in 1 year, validated by AIIMS psychiatrists.',
    tags: ['MentalHealth', 'AI', 'Consumer'], availability: 'Available',
    languages: ['English', 'Hindi'], avatar: '🧠',
    achievements: ['100K Users', 'AIIMS Validated', 'WHF Partner'],
  },
  {
    id: 'f30', name: 'Prateek Arora', title: 'CEO & Co-Founder', company: 'BlockchainPay',
    sector: 'Web3', city: 'Mumbai', valuation: '$130M', hourlyRate: 10500,
    rating: 4.8, reviews: 58, totalBookings: 142, featured: true, verified: true,
    bio: 'Cross-border payments on Web3. $500M+ in transactions, 40 countries.',
    tags: ['Web3', 'Payments', 'Global'], availability: 'Limited',
    languages: ['English', 'Hindi'], avatar: '₿',
    achievements: ['$500M Volume', '40 Countries', 'Paradigm Backed'],
  },
];

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
