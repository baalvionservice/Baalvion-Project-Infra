'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, DollarSign, Star, Calendar, Users, CheckCircle,
  Clock, Edit3, Save, ToggleLeft, ToggleRight, Shield, Wallet, BarChart3,
  MapPin, Eye, MessageCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed';
type City = 'Mumbai' | 'Delhi' | 'Bangalore';

interface BookingRequest {
  id: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  hours: number;
  hourlyRate: number;
  escrowAmount: number;
  status: RequestStatus;
  city: City;
  note: string;
  clientRating?: number;
}

const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: 'req001', clientName: 'Aisha Bose', clientAvatar: '👩‍💼',
    date: '2026-10-15', hours: 2, hourlyRate: 8500, escrowAmount: 17850,
    status: 'pending', city: 'Mumbai',
    note: 'I\'m an angel investor looking to understand AI market opportunities.',
  },
  {
    id: 'req002', clientName: 'Riya Mehta', clientAvatar: '👩‍🎨',
    date: '2026-10-17', hours: 1, hourlyRate: 8500, escrowAmount: 8925,
    status: 'pending', city: 'Mumbai',
    note: 'Building a startup and need mentorship on product-market fit.',
  },
  {
    id: 'req003', clientName: 'Nisha Patel', clientAvatar: '👩‍🔬',
    date: '2026-10-12', hours: 3, hourlyRate: 8500, escrowAmount: 26775,
    status: 'accepted', city: 'Bangalore',
    note: 'Interested in discussing AI applications in healthcare sector.',
  },
  {
    id: 'req004', clientName: 'Preethi Kumar', clientAvatar: '👩‍💻',
    date: '2026-10-08', hours: 2, hourlyRate: 8500, escrowAmount: 17850,
    status: 'completed', city: 'Delhi',
    note: 'Career transition from corporate to startup world.',
    clientRating: 5,
  },
  {
    id: 'req005', clientName: 'Sakshi Jain', clientAvatar: '🧑‍🎓',
    date: '2026-10-02', hours: 1, hourlyRate: 8500, escrowAmount: 8925,
    status: 'completed', city: 'Mumbai',
    note: 'Fundraising strategies for seed stage.',
    clientRating: 5,
  },
];

const statusConfig: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const cityColor: Record<City, string> = {
  Mumbai: 'text-orange-500',
  Delhi: 'text-blue-500',
  Bangalore: 'text-purple-500',
};

// ─── Profile Settings Modal ───────────────────────────────────────────────────
function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [hourlyRate, setHourlyRate] = useState('8500');
  const [maxHours, setMaxHours] = useState('4');
  const [city, setCity] = useState<City>('Mumbai');
  const [bio, setBio] = useState('Ex-Google Brain. Built NLP models used by 50M+ users. Forbes 30 Under 30.');
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: 'Profile Updated', description: 'Your founder profile has been saved successfully.' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Founder Profile</DialogTitle>
          <DialogDescription>Update your availability, rates, and bio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Hourly Rate (₹)</label>
            <Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="8500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Max Hours per Session</label>
            <Select value={maxHours} onValueChange={setMaxHours}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 6, 8].map(h => <SelectItem key={h} value={String(h)}>{h} hour{h > 1 ? 's' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Primary City</label>
            <Select value={city} onValueChange={v => setCity(v as City)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Mumbai', 'Delhi', 'Bangalore'] as City[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-24"
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ req, onAccept, onDecline, onComplete }: {
  req: BookingRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[req.status];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{req.clientAvatar}</div>
            <div>
              <p className="font-bold">{req.clientName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className={`h-3.5 w-3.5 ${cityColor[req.city]}`} />
                <span className={`text-xs font-medium ${cityColor[req.city]}`}>{req.city}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{req.hours} hr{req.hours > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(req.date).toDateString()}</p>
            </div>
          </div>
          <Badge className={`border text-xs ${cfg.color}`}>{cfg.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm">Escrow Locked</span>
          </div>
          <span className="font-bold text-primary">₹{req.escrowAmount.toLocaleString('en-IN')}</span>
        </div>

        {req.note && (
          <div>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              <MessageCircle className="h-3 w-3" />Client Note
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expanded && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1 italic">"{req.note}"</p>
            )}
          </div>
        )}

        {req.clientRating && (
          <div className="flex items-center gap-1">
            {Array.from({ length: req.clientRating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">Client rated this session</span>
          </div>
        )}

        <div className="flex gap-2">
          {req.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" className="flex-1 text-xs text-red-500 hover:text-red-600"
                onClick={() => onDecline(req.id)}>
                <X className="h-3.5 w-3.5 mr-1" />Decline
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={() => onAccept(req.id)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />Accept
              </Button>
            </>
          )}
          {req.status === 'accepted' && (
            <Button size="sm" className="w-full text-xs" onClick={() => onComplete(req.id)}>
              <Shield className="h-3.5 w-3.5 mr-1" />Release Escrow &amp; Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function FounderDashboardPage() {
  const [requests, setRequests] = useState<BookingRequest[]>(MOCK_REQUESTS);
  const [isActive, setIsActive] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const { toast } = useToast();

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
    toast({ title: '✅ Request Accepted!', description: 'Client has been notified. Session is confirmed.' });
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
    toast({ title: 'Request Declined', description: 'Escrow will be refunded to the client.' });
  };

  const handleComplete = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    toast({ title: '💰 Escrow Released!', description: 'Funds have been transferred to your wallet.' });
  };

  const totalEarnings = requests.filter(r => r.status === 'completed').reduce((s, r) => s + r.escrowAmount * 0.95, 0);
  const pendingEscrow = requests.filter(r => r.status === 'accepted').reduce((s, r) => s + r.escrowAmount, 0);
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const avgRating = requests.filter(r => r.clientRating).length > 0
    ? requests.filter(r => r.clientRating).reduce((s, r) => s + (r.clientRating ?? 0), 0) / requests.filter(r => r.clientRating).length
    : 0;

  const tabs = [
    { value: 'pending', label: 'Pending', filter: (r: BookingRequest) => r.status === 'pending' },
    { value: 'accepted', label: 'Accepted', filter: (r: BookingRequest) => r.status === 'accepted' },
    { value: 'completed', label: 'Completed', filter: (r: BookingRequest) => r.status === 'completed' },
    { value: 'all', label: 'All', filter: () => true },
  ];

  // Earnings by city
  const cityEarnings = (['Mumbai', 'Delhi', 'Bangalore'] as City[]).map(city => ({
    city,
    earnings: requests.filter(r => r.city === city && r.status === 'completed').reduce((s, r) => s + r.escrowAmount * 0.95, 0),
    sessions: requests.filter(r => r.city === city && r.status === 'completed').length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dating"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Founder Dashboard</h1>
            <p className="text-muted-foreground">Manage your bookings, rates &amp; escrow payouts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
            <button
              onClick={() => {
                setIsActive(!isActive);
                toast({ title: isActive ? '🔴 You are now offline' : '🟢 You are now active!', description: isActive ? 'Clients cannot book you.' : 'Clients can now book you.' });
              }}
            >
              {isActive
                ? <ToggleRight className="h-6 w-6 text-green-500" />
                : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
            </button>
          </div>
          <Button variant="outline" onClick={() => setProfileOpen(true)}>
            <Edit3 className="h-4 w-4 mr-2" />Edit Profile
          </Button>
        </div>
      </div>

      {/* Founder Profile Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-5xl">👨‍💻</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Arjun Mehta</h2>
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <Badge className="bg-primary text-primary-foreground text-xs">Verified Founder</Badge>
              {isActive && <Badge className="bg-green-500 text-white text-xs">🟢 Active</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">CEO & Co-Founder · NeuroStack AI · $120M Valuation</p>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 4.9 ({requests.filter(r => r.clientRating).length} reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-orange-500" /> Mumbai</span>
              <span className="font-bold text-primary">₹8,500/hr</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">Forbes 30U30</Badge>
            <Badge variant="outline" className="text-xs">YC S21</Badge>
            <Badge variant="outline" className="text-xs">$120M Series B</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earnings', value: `₹${(totalEarnings / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-green-500' },
          { label: 'Pending Escrow', value: `₹${(pendingEscrow / 1000).toFixed(1)}K`, icon: Shield, color: 'text-blue-500' },
          { label: 'Sessions Done', value: completedCount, icon: CheckCircle, color: 'text-primary' },
          { label: 'Avg Rating', value: avgRating ? `${avgRating.toFixed(1)} ⭐` : '—', icon: Star, color: 'text-yellow-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings by City */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Earnings by City
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {cityEarnings.map(({ city, earnings, sessions }) => (
              <div key={city} className="text-center rounded-lg border p-3">
                <p className={`font-bold text-lg ${cityColor[city]}`}>{city}</p>
                <p className="text-xl font-bold">₹{(earnings / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">{sessions} session{sessions !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Requests */}
      <div>
        <h2 className="text-lg font-bold mb-3">Booking Requests</h2>
        <Tabs defaultValue="pending">
          <TabsList>
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <Badge variant="secondary" className="ml-1.5 text-xs">{requests.filter(t.filter).length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(t => (
            <TabsContent key={t.value} value={t.value} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.filter(t.filter).map(r => (
                  <RequestCard
                    key={r.id}
                    req={r}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onComplete={handleComplete}
                  />
                ))}
                {requests.filter(t.filter).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No {t.label.toLowerCase()} requests.
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
