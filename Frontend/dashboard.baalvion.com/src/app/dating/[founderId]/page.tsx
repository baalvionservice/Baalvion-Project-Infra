'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Star, MapPin, Briefcase, CheckCircle, Shield, Heart, Crown,
  Calendar, Clock, Globe, Languages, TrendingUp, Quote, Lightbulb,
  BookOpen, Award, Instagram, Linkedin, Twitter,
  MessageCircle, ArrowRight, Sparkles, BadgeCheck, FileText, Building,
  GraduationCap, Coffee, Music, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FOUNDERS } from '../founders-data';

// ─── Extended Founder Data ─────────────────────────────────────────────────────
const FOUNDER_PROFILES: Record<string, FounderProfile> = {
  f1: {
    id: 'f1',
    name: 'Arjun Mehta',
    title: 'CEO & Co-Founder',
    company: 'NeuroStack AI',
    sector: 'AI/ML',
    city: 'Mumbai',
    hometown: 'Pune, Maharashtra',
    valuation: '$120M',
    hourlyRate: 8500,
    rating: 4.9,
    reviews: 142,
    totalBookings: 387,
    verified: true,
    kycVerified: true,
    featured: true,
    availability: 'Available',
    avatar: '👨‍💻',
    age: 31,
    height: "5'11\"",
    languages: ['English', 'Hindi', 'Marathi'],
    achievements: ['Forbes 30U30', 'YC S21', '$120M Series B', 'Ex-Google Brain'],
    tags: ['AI Strategy', 'Fundraising', 'Product Vision', 'Deep Tech'],

    // Public Profile — Deep Details
    headline: "Building the AI stack that powers India's next billion",
    shortBio: 'Ex-Google Brain researcher turned entrepreneur. I quit a $400K/yr job at 28 to build something that matters.',
    fullStory: `I grew up in a middle-class family in Pune. My dad was a school teacher, my mom a homemaker. We didn't have a computer at home until I was 16. When I first wrote a "Hello World" in C++, I cried — not from frustration but because I understood, in that moment, this was my life's work.

I got into IIT Bombay on merit scholarship, went to Carnegie Mellon for my Master's, then landed at Google Brain working on large language models before GPT was even a term people used casually.

But I always felt something was missing. India had no real AI infrastructure — every serious startup was either using OpenAI APIs or building on Amazon/Azure. I wanted to change that. NeuroStack AI is my answer: India-first, privacy-first, sovereign AI infrastructure.

We've had 3 acquisition offers (declined all three). We're building to be generational.`,

    dreams: `My 10-year dream is to make NeuroStack the "Intel of AI" — the invisible layer that powers every Indian AI application. I want to see our chips in ISRO satellites, our models in government health systems, our infrastructure in 100M Indian businesses.

Personally? I want to build a research lab in Pune — in my hometown — so kids like me who couldn't afford Delhi or Bangalore can access world-class AI education without leaving their families.

And one day, I want to write a book. Not a business book — a real memoir about what it actually feels like to build something from nothing.`,

    thoughts: `I think India is at the same inflection point the US was in 1995 with the internet. Whoever builds the AI infrastructure layer for Bharat will define the next 30 years of India's economy.

I'm deeply worried about brain drain. We're training the world's best AI engineers and then shipping them to San Francisco. That's a national emergency, not a career choice.

On relationships: I believe in radical honesty. I'd rather have 3 real conversations than 300 surface-level ones. Most people my age are performing a version of success. I'm trying to actually live it.`,

    dailyLife: `5:30am — Wake up, no phone for the first hour. I meditate or just sit with chai and think.
7am — Walk around Bandra seaface. No earphones. Just thinking time.
9am — First meeting. I do all hard conversations before lunch.
1pm — Lunch with team — we eat together every day, no exceptions.
3pm — Deep work block: code review, research papers, product thinking.
7pm — I try to stop working. Dinner with friends or alone at a restaurant with a book.
10pm — Journal. One page. What did I learn today? What do I regret?

I don't do "hustle porn". I sleep 7 hours. I've seen what burnout does to founders — I refuse to romanticize it.`,

    lookingFor: `I'm looking for a woman who has her own thing going — a career, a passion, a point of view. Not someone who's impressed by the valuation. Someone who'd call me out if I'm being an idiot.

Intelligence is non-negotiable. Curiosity more than credentials. I've had more interesting conversations with artists and chefs than with some MBAs.

If you book a session with me, don't come with just "startup questions". Come with your weirdest idea, your most embarrassing failure, something you've never told anyone. That's where the real conversations happen.`,

    perfectDate: `A walk around Carter's Road in Bandra, then dinner at a small South Indian place I know where the owner still takes orders himself. No fancy restaurants — I find them exhausting. Then maybe a drive along Marine Drive at night. And if the conversation is good enough (it usually is), we end up talking until 2am about things neither of us planned to talk about.`,

    education: [
      { degree: 'B.Tech Computer Science', institution: 'IIT Bombay', year: '2015' },
      { degree: 'MS Machine Learning', institution: 'Carnegie Mellon University', year: '2017' },
    ],
    career: [
      { role: 'Research Scientist', company: 'Google Brain', duration: '2017–2021' },
      { role: 'CEO & Co-Founder', company: 'NeuroStack AI', duration: '2021–Present' },
    ],
    companyDetails: {
      founded: '2021',
      employees: '180+',
      revenue: '₹85Cr ARR',
      funding: '$120M Series B',
      investors: ['YC', 'Sequoia India', 'Lightspeed'],
      offices: ['Mumbai (HQ)', 'Bangalore', 'San Francisco'],
    },
    kyc: {
      panVerified: true,
      aadharVerified: true,
      gstVerified: true,
      incorporationVerified: true,
      linkedinVerified: true,
      verifiedAt: '2026-09-15',
      verifiedBy: 'Baalvion Verification Team',
    },
    interests: ['AI Research', 'Hiking', 'Jazz Music', 'Competitive Coding', 'Reading (Philosophy)'],
    hobbies: ['Chess', 'Cooking (badly)', 'Long drives', 'Watching Bollywood films ironically'],
    socialLinks: {
      linkedin: 'linkedin.com/in/arjunmehta-ai',
      twitter: '@arjun_ai',
      instagram: '@arjunmehta',
    },
    gallery: ['📸', '🏔️', '☕', '💻'],
    testimonials: [
      {
        id: 't1', clientName: 'Riya M.', city: 'Mumbai', rating: 5,
        text: 'The most intellectually stimulating 2 hours of my year. Arjun doesn\'t just answer questions — he makes you think differently.',
        date: 'Oct 2026',
      },
      {
        id: 't2', clientName: 'Ananya S.', city: 'Delhi', rating: 5,
        text: 'He remembered a tiny detail I mentioned in passing and brought it back an hour later. That kind of presence is rare.',
        date: 'Sep 2026',
      },
      {
        id: 't3', clientName: 'Preethi K.', city: 'Bangalore', rating: 5,
        text: 'I came expecting a mentorship session. I left feeling like I\'d found someone genuinely interested in my life and ideas.',
        date: 'Sep 2026',
      },
    ],
  },

  f2: {
    id: 'f2',
    name: 'Priya Sharma',
    title: 'Founder & CEO',
    company: 'PaySpark',
    sector: 'FinTech',
    city: 'Bangalore',
    hometown: 'Chandigarh, Punjab',
    valuation: '$85M',
    hourlyRate: 7200,
    rating: 4.8,
    reviews: 98,
    totalBookings: 251,
    verified: true,
    kycVerified: true,
    featured: true,
    availability: 'Limited',
    avatar: '👩‍💼',
    age: 33,
    height: "5'5\"",
    languages: ['English', 'Hindi', 'Punjabi', 'Kannada'],
    achievements: ['RBI Innovation Award', 'Sequoia Backed', 'Ex-Razorpay VP', 'WEF Young Leader'],
    tags: ['Payments', 'Regulatory', 'Scale', 'FinTech'],
    headline: 'Making money movement invisible for a billion Indians',
    shortBio: 'Ex-Razorpay VP of Products. I built the payments stack for 200K merchants before deciding to build my own.',
    fullStory: `I grew up watching my father run a small textile shop in Chandigarh. Every month, he'd spend an entire day managing cash — counting it, hiding it, carrying it to the bank. I thought: there has to be a better way.

At IIM Ahmedabad, I specialized in financial systems. Joined Razorpay when it was 50 people. Was VP of Products by the time they crossed $7.5B valuation. I know exactly what a payments company looks like from the inside.

PaySpark isn't trying to compete with Razorpay. We're building what they never could — a real-time, AI-powered payment intelligence layer for India's informal economy. The paan-wallah, the auto-driver, the vegetable vendor. That's our customer. That's ₹40 lakh crore sitting outside formal finance.`,

    dreams: `I want to see a day when a street vendor in Dharavi can access credit, insurance, and investment products as seamlessly as someone in Nariman Point.

I dream of a future where PaySpark's infrastructure is the invisible layer behind India's financial inclusion story. Not as a feature in someone's app — as the backbone.

Personally, I want to own a house by the sea — somewhere in Goa. A small one. With a terrace where I can watch sunsets and not think about funding rounds for a few hours.`,

    thoughts: `The Indian FinTech ecosystem is obsessed with UPI. But UPI is just the rails — what you put on the rails is what matters. We're building the trains.

I'm frustrated by how few women are in deep FinTech. Not women in startup marketing or HR — women as the engineers, the product leads, the founders of core financial infrastructure. That needs to change and I'm actively trying to change it by only hiring 60%+ women engineering teams.

On personal life: I made the mistake early in my career of putting everything on hold for "the company". I won't make that again. Life happens now, not after the next round.`,

    dailyLife: `6am — Run. 5km minimum. Non-negotiable.
8am — Review overnight payment failure reports. Yes, I do this personally.
10am — Team standup. I believe in short, honest check-ins.
Afternoon — Usually product deep-dives or investor calls.
Evenings — I protect these fiercely. Dinner with a friend, a book, or an Urdu poetry event.

I travel to Mumbai every 2 weeks. Delhi quarterly. I love Bangalore but I refuse to believe it has good street food.`,

    lookingFor: `Someone who's genuinely curious about the world — who asks "why" more than "what". Someone who has strong opinions but holds them loosely.

I don't care about your salary. I care about what wakes you up at 3am. What you're secretly terrified of. What you want your life to look like in 10 years, and whether you've actually thought about it or just said "financial freedom."

I'm looking for a partner in the truest sense — someone who makes me better, and who I can genuinely make better too.`,

    perfectDate: `Saturday morning at the Lalbagh flower show (yes, really). Then a slow lunch at a hole-in-the-wall Andhra place I know. Walk through Cubbon Park. End up at a tiny bookstore in Indiranagar where we each pick a book for the other. Whoever picks wrong buys dinner next time.`,

    education: [
      { degree: 'B.Com (Hons)', institution: 'Panjab University', year: '2013' },
      { degree: 'MBA Finance', institution: 'IIM Ahmedabad', year: '2015' },
    ],
    career: [
      { role: 'VP Products', company: 'Razorpay', duration: '2015–2022' },
      { role: 'Founder & CEO', company: 'PaySpark', duration: '2022–Present' },
    ],
    companyDetails: {
      founded: '2022',
      employees: '95+',
      revenue: '₹42Cr ARR',
      funding: '$85M Series A',
      investors: ['Sequoia India', 'Ribbit Capital', 'Tiger Global'],
      offices: ['Bangalore (HQ)', 'Mumbai'],
    },
    kyc: {
      panVerified: true,
      aadharVerified: true,
      gstVerified: true,
      incorporationVerified: true,
      linkedinVerified: true,
      verifiedAt: '2026-09-18',
      verifiedBy: 'Baalvion Verification Team',
    },
    interests: ['Financial Inclusion', 'Urdu Poetry', 'Distance Running', 'Cooking Punjabi food', 'Feminist Economics'],
    hobbies: ['Pottery', 'Journaling', 'Watching arthouse films', 'Weekend treks'],
    socialLinks: {
      linkedin: 'linkedin.com/in/priya-payspark',
      twitter: '@priyafintech',
      instagram: '@priya.sharma.founder',
    },
    gallery: ['🏃‍♀️', '📚', '🍳', '🏔️'],
    testimonials: [
      {
        id: 't1', clientName: 'Nisha P.', city: 'Bangalore', rating: 5,
        text: "Priya is the most grounded founder I've met. No ego, no performance — just genuine curiosity and warmth.",
        date: 'Oct 2026',
      },
      {
        id: 't2', clientName: 'Meera R.', city: 'Mumbai', rating: 5,
        text: "She told me something about failure that changed how I think about risk. I've repeated it to 10 people since.",
        date: 'Sep 2026',
      },
    ],
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FounderProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  sector: string;
  city: string;
  hometown: string;
  valuation: string;
  hourlyRate: number;
  rating: number;
  reviews: number;
  totalBookings: number;
  verified: boolean;
  kycVerified: boolean;
  featured: boolean;
  availability: string;
  avatar: string;
  age: number;
  height: string;
  languages: string[];
  achievements: string[];
  tags: string[];
  headline: string;
  shortBio: string;
  fullStory: string;
  dreams: string;
  thoughts: string;
  dailyLife: string;
  lookingFor: string;
  perfectDate: string;
  education: { degree: string; institution: string; year: string }[];
  career: { role: string; company: string; duration: string }[];
  companyDetails: {
    founded: string;
    employees: string;
    revenue: string;
    funding: string;
    investors: string[];
    offices: string[];
  };
  kyc: {
    panVerified: boolean;
    aadharVerified: boolean;
    gstVerified: boolean;
    incorporationVerified: boolean;
    linkedinVerified: boolean;
    verifiedAt: string;
    verifiedBy: string;
  };
  interests: string[];
  hobbies: string[];
  socialLinks: { linkedin: string; twitter: string; instagram: string };
  gallery: string[];
  testimonials: { id: string; clientName: string; city: string; rating: number; text: string; date: string }[];
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ founder, open, onClose }: { founder: FounderProfile | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [hours, setHours] = useState(2);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [sessionType, setSessionType] = useState('personal');

  const total = founder ? founder.hourlyRate * hours : 0;
  const escrowFee = Math.round(total * 0.05);

  const handleBook = () => {
    if (!date) { toast({ title: 'Please select a date', variant: 'destructive' }); return; }
    setStep('confirm');
  };

  const handleClose = () => {
    setStep('details');
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
                Book a Session with {founder.name}
              </DialogTitle>
              <DialogDescription>All funds held in escrow until session is completed.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'personal', label: '☕ Personal Date', desc: 'Coffee / Dinner' },
                  { id: 'mentorship', label: '💡 Mentorship', desc: 'Career / Business' },
                  { id: 'networking', label: '🤝 Networking', desc: 'Collaborations' },
                  { id: 'advisory', label: '🎯 Advisory', desc: 'Strategy Session' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSessionType(s.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      sessionType === s.id ? 'border-primary bg-primary/10' : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <p className="font-medium text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Rate</p>
                <p className="text-xl font-bold text-primary">₹{founder.hourlyRate.toLocaleString('en-IN')}<span className="text-sm font-normal">/hr</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Duration</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setHours(Math.max(1, hours - 1))}>−</Button>
                  <span className="w-8 text-center font-bold">{hours}h</span>
                  <Button variant="outline" size="sm" onClick={() => setHours(Math.min(8, hours + 1))}>+</Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Preferred Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Your Message to {founder.name.split(' ')[0]}</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-20"
                  placeholder="Tell them what you'd love to talk about, experience, or explore together..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Session ({hours}h × ₹{founder.hourlyRate.toLocaleString()})</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Platform fee (5%)</span><span>₹{escrowFee.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Escrow Total</span><span className="text-primary">₹{(total + escrowFee).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleBook} className="gap-2"><Shield className="h-4 w-4" />Book with Escrow</Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>Your funds will be locked until the session completes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-semibold">{founder.name} — {hours}hr {sessionType} session</p>
                <p className="text-sm text-muted-foreground">{new Date(date).toDateString()}</p>
                {note && <p className="text-xs text-muted-foreground italic">"{note}"</p>}
                <p className="text-lg font-bold text-primary">₹{(total + escrowFee).toLocaleString('en-IN')} locked in escrow</p>
              </div>
              <p className="text-xs text-muted-foreground">100% refund if cancelled 24h before. Funds release only after you confirm completion.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
              <Button onClick={() => {
                setStep('success');
                toast({ title: '✅ Booking Confirmed!', description: `${founder.name} will respond within 2 hours.` });
              }}>Confirm & Lock Escrow</Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Booking Confirmed!</h2>
              <p className="text-muted-foreground mt-1 text-sm">₹{(total + escrowFee).toLocaleString('en-IN')} locked in escrow. {founder.name.split(' ')[0]} will confirm within 2 hours.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild><Link href="/dating/my-bookings">View My Bookings</Link></Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Section Block ─────────────────────────────────────────────────────────────
function SectionBlock({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────
export default function FounderProfilePage() {
  const { toast } = useToast();
  const params = useParams();
  const founderId = params?.founderId as string;
  let founder = FOUNDER_PROFILES[founderId];
  
  if (!founder) {
    const basicInfo = FOUNDERS.find(f => f.id === founderId);
    if (basicInfo) {
      founder = {
        ...basicInfo,
        hometown: basicInfo.city,
        age: 0,
        height: '',
        headline: `${basicInfo.title}, ${basicInfo.company}`,
        shortBio: basicInfo.bio,
        fullStory: `I am the ${basicInfo.title} of ${basicInfo.company}, focusing on ${basicInfo.sector} in ${basicInfo.city}. ${basicInfo.bio}`,
        kycVerified: basicInfo.verified,
        gallery: ['✨', '🏢', '🤝', '📈'],
        dreams: `My vision is to scale ${basicInfo.company} to new heights and build something truly impactful in the ${basicInfo.sector} space.`,
        thoughts: `Building a company in ${basicInfo.city} has been an incredible journey. I'm always looking to connect with like-minded people.`,
        dailyLife: `A mix of deep work, team meetings, and strategic planning. Always making time for learning and networking.`,
        lookingFor: `Someone who understands the startup hustle, is passionate about growth, and values genuine connection.`,
        perfectDate: `A great conversation over coffee or dinner, sharing stories and exploring ideas.`,
        education: [{ degree: 'Graduate', institution: 'Top University', year: '2015' }],
        career: [{ role: basicInfo.title, company: basicInfo.company, duration: 'Present' }],
        companyDetails: {
          founded: 'Recent',
          employees: 'Growing',
          revenue: 'Undisclosed',
          funding: 'Backed',
          investors: ['Top VCs'],
          offices: [basicInfo.city],
        },
        kyc: {
          panVerified: false,
          aadharVerified: false,
          gstVerified: false,
          incorporationVerified: false,
          linkedinVerified: false,
          verifiedAt: '',
          verifiedBy: '',
        },
        interests: basicInfo.tags,
        hobbies: ['Reading', 'Networking', 'Travel'],
        socialLinks: {
          linkedin: `linkedin.com/in/${basicInfo.name.toLowerCase().replace(' ', '-')}`,
          twitter: `@${basicInfo.name.toLowerCase().replace(' ', '')}`,
          instagram: `@${basicInfo.name.toLowerCase().replace(' ', '')}`,
        },
        testimonials: [
          { id: 't1', clientName: 'Aakash V.', city: basicInfo.city, rating: 5, text: 'Incredible session. Got exactly the insights I needed.', date: '2 weeks ago' },
          { id: 't2', clientName: 'Sneha M.', city: basicInfo.city, rating: 5, text: 'Very professional and highly knowledgeable.', date: '1 month ago' },
        ],
      };
    }
  }

  const [bookingOpen, setBookingOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [liked, setLiked] = useState(false);

  if (!founder) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold">Founder Not Found</h2>
        <p className="text-muted-foreground">This founder profile doesn't exist or hasn't been verified yet.</p>
        <Button asChild><Link href="/dating"><ArrowLeft className="h-4 w-4 mr-2" />Back to Directory</Link></Button>
      </div>
    );
  }

  const availabilityColor = founder.availability === 'Available' ? 'text-green-500' : founder.availability === 'Limited' ? 'text-yellow-500' : 'text-red-500';
  const availabilityDot = founder.availability === 'Available' ? 'bg-green-500' : founder.availability === 'Limited' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dating"><ArrowLeft className="h-4 w-4 mr-1" />All Founders</Link>
        </Button>
        <Badge variant="secondary" className="text-xs">🇮🇳 India's #1 Founder Dating Platform</Badge>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden border-2 border-primary/20">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/30 via-purple-500/20 to-pink-500/20 relative">
          {founder.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />Featured Founder
              </Badge>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>

        <CardContent className="pt-0 pb-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex items-end gap-4">
            <div className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-5xl shadow-lg">
              {founder.avatar}
            </div>
            <div className="mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{founder.name}</h1>
                {founder.kycVerified && (
                  <Badge className="bg-blue-500 text-white border-0 gap-1 text-xs">
                    <BadgeCheck className="h-3.5 w-3.5" />KYC Verified
                  </Badge>
                )}
                {founder.verified && (
                  <Badge className="bg-green-500 text-white border-0 gap-1 text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />Verified Founder
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{founder.title} · {founder.company}</p>
            </div>
          </div>

          {/* Headline */}
          <blockquote className="border-l-4 border-primary pl-4 mb-4 italic text-muted-foreground">
            "{founder.headline}"
          </blockquote>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { icon: MapPin, label: 'City', value: founder.city },
              { icon: TrendingUp, label: 'Valuation', value: founder.valuation },
              { icon: Star, label: 'Rating', value: `${founder.rating} (${founder.reviews} reviews)` },
              { icon: Clock, label: 'Rate', value: `₹${founder.hourlyRate.toLocaleString('en-IN')}/hr` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Personal Stats */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            <span>📍 From {founder.hometown}</span>
            {founder.age > 0 && <span>🎂 {founder.age} years old</span>}
            {founder.height && <span>📏 {founder.height}</span>}
            <span className={`flex items-center gap-1 font-medium ${availabilityColor}`}>
              <span className={`h-2 w-2 rounded-full ${availabilityDot} animate-pulse`} />
              {founder.availability}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {founder.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
          </div>

          {/* Languages */}
          <div className="flex items-center gap-2 mb-4">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Speaks:</span>
            <span className="text-sm font-medium">{founder.languages.join(', ')}</span>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              disabled={founder.availability === 'Busy'}
              onClick={() => setBookingOpen(true)}
            >
              <Calendar className="h-4 w-4" />
              {founder.availability === 'Busy' ? 'Currently Unavailable' : `Book Session — ₹${founder.hourlyRate.toLocaleString('en-IN')}/hr`}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setMessageOpen(true)}>
              <MessageCircle className="h-4 w-4" />Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KYC Verification Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">
            ✅ Identity Verified — India's First Founder-Verified Dating Platform
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
            {[
              { label: 'PAN Card', ok: founder.kyc.panVerified },
              { label: 'Aadhaar', ok: founder.kyc.aadharVerified },
              { label: 'GST/MCA', ok: founder.kyc.gstVerified },
              { label: 'Inc. Docs', ok: founder.kyc.incorporationVerified },
              { label: 'LinkedIn', ok: founder.kyc.linkedinVerified },
            ].map(({ label, ok }) => (
              <div key={label} className={`rounded-md px-2 py-1 text-xs flex items-center gap-1 ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {ok ? <CheckCircle className="h-3 w-3" /> : <span>✗</span>}
                {label}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Manually verified on {founder.kyc.verifiedAt} by {founder.kyc.verifiedBy}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Story Sections */}
        <div className="lg:col-span-2 space-y-4">
          <SectionBlock icon={BookOpen} title="My Story">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{founder.fullStory}</p>
          </SectionBlock>

          <SectionBlock icon={Lightbulb} title="My Dreams">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{founder.dreams}</p>
          </SectionBlock>

          <SectionBlock icon={Quote} title="My Honest Thoughts">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{founder.thoughts}</p>
          </SectionBlock>

          <SectionBlock icon={Clock} title="A Day in My Life" defaultOpen={false}>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-mono">{founder.dailyLife}</p>
          </SectionBlock>

          <SectionBlock icon={Heart} title="What I'm Looking For" defaultOpen={false}>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{founder.lookingFor}</p>
          </SectionBlock>

          <SectionBlock icon={Coffee} title="Perfect Date" defaultOpen={false}>
            <p className="text-sm text-muted-foreground leading-relaxed italic">"{founder.perfectDate}"</p>
          </SectionBlock>

          {/* Testimonials */}
          <SectionBlock icon={Star} title="What Clients Say">
            <div className="space-y-3">
              {founder.testimonials.map(t => (
                <div key={t.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t.clientName}</p>
                      <p className="text-xs text-muted-foreground">{t.city} · {t.date}</p>
                    </div>
                    <div className="flex">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        {/* Right Column — Facts */}
        <div className="space-y-4">
          {/* Achievements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-yellow-500" />Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {founder.achievements.map(a => (
                <div key={a} className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
                  <span className="text-yellow-500">🏆</span>
                  <span className="text-sm font-medium">{a}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Company */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-primary" />{founder.company}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Founded', founder.companyDetails.founded],
                ['Team Size', founder.companyDetails.employees],
                ['Revenue', founder.companyDetails.revenue],
                ['Funding', founder.companyDetails.funding],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground mb-1">Investors</p>
                <div className="flex flex-wrap gap-1">
                  {founder.companyDetails.investors.map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Offices</p>
                {founder.companyDetails.offices.map(o => (
                  <div key={o} className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground" />{o}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Education & Career */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-primary" />Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {founder.education.map(e => (
                <div key={e.degree} className="text-sm">
                  <p className="font-medium">{e.degree}</p>
                  <p className="text-muted-foreground text-xs">{e.institution} · {e.year}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Music className="h-4 w-4 text-primary" />Interests & Hobbies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {[...founder.interests, ...founder.hobbies].map(i => (
                  <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-primary" />Social Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href={`https://${founder.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />{founder.socialLinks.linkedin}
              </a>
              <a href={`https://twitter.com/${founder.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />{founder.socialLinks.twitter}
              </a>
              <a href={`https://instagram.com/${founder.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />{founder.socialLinks.instagram}
              </a>
            </CardContent>
          </Card>

          {/* Sticky Book */}
          <div className="sticky top-4">
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={founder.availability === 'Busy'}
              onClick={() => setBookingOpen(true)}
            >
              <Shield className="h-4 w-4" />
              Book with Escrow
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ₹{founder.hourlyRate.toLocaleString('en-IN')}/hr · 100% escrow protected
            </p>
          </div>
        </div>
      </div>

      <BookingModal founder={founder} open={bookingOpen} onClose={() => setBookingOpen(false)} />
      
      {/* Messaging Modal */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {founder.name}</DialogTitle>
            <DialogDescription>Direct messages usually get responses within 24 hours.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-32"
              placeholder="Hi! I'm interested in..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setMessageOpen(false);
              setChatMessage('');
              toast({ title: 'Message Sent!', description: `Your message to ${founder.name} has been sent.` });
            }}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
