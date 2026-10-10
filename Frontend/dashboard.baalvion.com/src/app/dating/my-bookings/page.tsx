'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, CheckCircle, Clock, MessageCircle, QrCode, Shield,
  Star, X, MapPin, Wallet, RefreshCw, ChevronRight, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
type City = 'Mumbai' | 'Delhi' | 'Bangalore';

interface Booking {
  id: string;
  founderId: string;
  founderName: string;
  founderAvatar: string;
  founderCompany: string;
  founderTitle: string;
  date: string;
  hours: number;
  hourlyRate: number;
  status: BookingStatus;
  city: City;
  escrowAmount: number;
  note: string;
  meetingLink?: string;
  rating?: number;
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk001',
    founderId: 'f1',
    founderName: 'Arjun Mehta',
    founderAvatar: '👨‍💻',
    founderCompany: 'NeuroStack AI',
    founderTitle: 'CEO & Co-Founder',
    date: '2026-10-15',
    hours: 2,
    hourlyRate: 8500,
    status: 'confirmed',
    city: 'Mumbai',
    escrowAmount: 17850,
    note: 'Would love to discuss AI strategy and fundraising insights.',
    meetingLink: 'https://meet.baalvion.com/arjun-mehta-session',
  },
  {
    id: 'bk002',
    founderId: 'f2',
    founderName: 'Priya Sharma',
    founderAvatar: '👩‍💼',
    founderCompany: 'PaySpark',
    founderTitle: 'Founder & CEO',
    date: '2026-10-18',
    hours: 1,
    hourlyRate: 7200,
    status: 'pending',
    city: 'Bangalore',
    escrowAmount: 7560,
    note: 'Interested in payment infrastructure and regulatory navigation.',
  },
  {
    id: 'bk003',
    founderId: 'f4',
    founderName: 'Sneha Kapoor',
    founderAvatar: '👩‍⚕️',
    founderCompany: 'MedMind Health',
    founderTitle: 'CEO',
    date: '2026-10-05',
    hours: 3,
    hourlyRate: 5500,
    status: 'completed',
    city: 'Mumbai',
    escrowAmount: 17325,
    note: 'HealthTech market entry strategy.',
    rating: 5,
  },
  {
    id: 'bk004',
    founderId: 'f9',
    founderName: 'Rohan Batra',
    founderAvatar: '🚀',
    founderCompany: 'OrbitX Space',
    founderTitle: 'Co-Founder',
    date: '2026-09-28',
    hours: 2,
    hourlyRate: 12000,
    status: 'completed',
    city: 'Bangalore',
    escrowAmount: 25200,
    note: 'Deep tech fundraising.',
    rating: 5,
  },
  {
    id: 'bk005',
    founderId: 'f3',
    founderName: 'Rahul Tiwari',
    founderAvatar: '🧑‍🔬',
    founderCompany: 'ChainBridge',
    founderTitle: 'Co-Founder & CTO',
    date: '2026-10-20',
    hours: 2,
    hourlyRate: 9800,
    status: 'pending',
    city: 'Delhi',
    escrowAmount: 20580,
    note: 'Web3 protocol design discussion.',
  },
];

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Star },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
};

const cityColor: Record<City, string> = {
  Mumbai: 'text-orange-500',
  Delhi: 'text-blue-500',
  Bangalore: 'text-purple-500',
};

function QRCodeModal({ booking, open, onClose }: { booking: Booking | null; open: boolean; onClose: () => void }) {
  if (!booking) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>Session QR Code</DialogTitle>
          <DialogDescription>Show this to {booking.founderName} at the start of your session to verify &amp; release escrow.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-xl border-4 border-primary p-4 bg-white">
            {/* Placeholder QR code visual */}
            <div className="grid grid-cols-5 gap-1 w-40 h-40">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${
                    [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,7,12,17].includes(i)
                      ? 'bg-gray-900'
                      : 'bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-sm font-bold">{booking.id.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">Booking ID</p>
          </div>
          <div className="rounded-lg bg-muted p-3 w-full text-sm text-left space-y-1">
            <p><strong>Founder:</strong> {booking.founderName}</p>
            <p><strong>Date:</strong> {new Date(booking.date).toDateString()}</p>
            <p><strong>Duration:</strong> {booking.hours} hours</p>
            <p><strong>Escrow:</strong> ₹{booking.escrowAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={onClose}><Download className="h-4 w-4 mr-2" />Save QR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RatingModal({ booking, open, onClose, onRate }: {
  booking: Booking | null; open: boolean; onClose: () => void; onRate: (id: string, r: number) => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const { toast } = useToast();
  if (!booking) return null;

  const handleSubmit = () => {
    onRate(booking.id, rating);
    toast({ title: '⭐ Review Submitted!', description: 'Thank you for your feedback.' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate Your Session</DialogTitle>
          <DialogDescription>How was your session with {booking.founderName}?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={`text-3xl transition-transform ${r <= rating ? 'scale-110' : 'opacity-30'}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-24"
            placeholder="Share your experience..."
            value={review}
            onChange={e => setReview(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button onClick={handleSubmit}>Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingCard({ booking, onQR, onRate, onCancel, onJoin }: {
  booking: Booking;
  onQR: (b: Booking) => void;
  onRate: (b: Booking) => void;
  onCancel: (id: string) => void;
  onJoin: (b: Booking) => void;
}) {
  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{booking.founderAvatar}</div>
            <div>
              <p className="font-bold">{booking.founderName}</p>
              <p className="text-sm text-muted-foreground">{booking.founderTitle} · {booking.founderCompany}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className={`h-3.5 w-3.5 ${cityColor[booking.city]}`} />
                <span className={`text-xs font-medium ${cityColor[booking.city]}`}>{booking.city}</span>
              </div>
            </div>
          </div>
          <Badge className={`border text-xs flex items-center gap-1 ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium text-xs">{new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium text-xs">{booking.hours} hr{booking.hours > 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Wallet className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Escrow</p>
            <p className="font-medium text-xs">₹{(booking.escrowAmount / 1000).toFixed(1)}K</p>
          </div>
        </div>

        {booking.note && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 italic">"{booking.note}"</p>
        )}

        {booking.status === 'completed' && booking.rating && (
          <div className="flex items-center gap-1">
            {Array.from({ length: booking.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">You rated this session</span>
          </div>
        )}

        <div className="flex gap-2">
          {booking.status === 'confirmed' && (
            <>
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onQR(booking)}>
                <QrCode className="h-3.5 w-3.5 mr-1" />QR Code
              </Button>
              {booking.meetingLink && (
                <Button size="sm" className="flex-1 text-xs" onClick={() => onJoin(booking)}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />Join Session
                </Button>
              )}
            </>
          )}
          {booking.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-xs text-red-500 hover:text-red-600" onClick={() => onCancel(booking.id)}>
              <X className="h-3.5 w-3.5 mr-1" />Cancel Booking
            </Button>
          )}
          {booking.status === 'completed' && !booking.rating && (
            <Button size="sm" className="flex-1 text-xs" onClick={() => onRate(booking)}>
              <Star className="h-3.5 w-3.5 mr-1" />Rate Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [rateBooking, setRateBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulated notification for testing the flow
    const timer = setTimeout(() => {
      toast({
        title: '🔔 Booking Accepted!',
        description: 'Arjun Mehta has accepted your booking request. Escrow locked.',
        duration: 8000,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleCancel = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b));
    toast({ title: 'Booking Cancelled', description: 'Full refund will be processed within 24 hours.' });
  };

  const handleRate = (id: string, rating: number) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, rating } : b));
  };

  const handleJoin = (b: Booking) => {
    toast({ title: 'Session Not Ready', description: 'The secure meeting room will open 5 minutes before your scheduled time.', variant: 'default' });
  };

  const tabs = [
    { value: 'all', label: 'All', filter: (b: Booking) => true },
    { value: 'upcoming', label: 'Upcoming', filter: (b: Booking) => b.status === 'confirmed' || b.status === 'pending' },
    { value: 'completed', label: 'Completed', filter: (b: Booking) => b.status === 'completed' },
    { value: 'cancelled', label: 'Cancelled', filter: (b: Booking) => b.status === 'cancelled' },
  ];

  const totalEscrow = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').reduce((s, b) => s + b.escrowAmount, 0);
  const completedSessions = bookings.filter(b => b.status === 'completed').length;
  const avgRating = bookings.filter(b => b.rating).reduce((s, b, _, a) => s + (b.rating ?? 0) / a.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dating"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage your founder sessions across Mumbai, Delhi &amp; Bangalore</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-primary' },
          { label: 'In Escrow', value: `₹${(totalEscrow / 1000).toFixed(1)}K`, icon: Shield, color: 'text-green-500' },
          { label: 'Completed Sessions', value: completedSessions, icon: CheckCircle, color: 'text-blue-500' },
          { label: 'Avg Rating Given', value: avgRating ? `${avgRating.toFixed(1)} ⭐` : '—', icon: Star, color: 'text-yellow-500' },
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

      {/* Escrow Banner */}
      {totalEscrow > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-4">
          <Shield className="h-5 w-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ₹{totalEscrow.toLocaleString('en-IN')} locked in escrow for your upcoming sessions
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Funds are released to founders only after you confirm session completion.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />View Escrow
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <Badge variant="secondary" className="ml-1.5 text-xs">{bookings.filter(t.filter).length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.filter(t.filter).map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onQR={setQrBooking}
                  onRate={setRateBooking}
                  onCancel={handleCancel}
                  onJoin={handleJoin}
                />
              ))}
              {bookings.filter(t.filter).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No {t.label.toLowerCase()} bookings yet.
                  {t.value === 'all' && (
                    <div className="mt-2">
                      <Button asChild><Link href="/dating">Browse Founders <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <QRCodeModal booking={qrBooking} open={!!qrBooking} onClose={() => setQrBooking(null)} />
      <RatingModal
        booking={rateBooking}
        open={!!rateBooking}
        onClose={() => setRateBooking(null)}
        onRate={handleRate}
      />
    </div>
  );
}
