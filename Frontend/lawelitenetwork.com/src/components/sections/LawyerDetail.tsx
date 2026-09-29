"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Award, 
  Briefcase, 
  Star, 
  Clock, 
  MapPin, 
  IndianRupee, 
  CheckCircle2,
  CalendarCheck,
  Loader2,
  MessageSquare,
  History,
  Info
} from 'lucide-react';
import TrustBadges from '@/components/ux/TrustBadges';
import SocialProof from '@/components/ux/SocialProof';
import StickyBookingBar from '@/components/ux/StickyBookingBar';
import ReviewList from '@/components/review/ReviewList';
import ReviewForm from '@/components/review/ReviewForm';
import BookingModal from '@/components/booking/BookingModal';
import { getReviewsByLawyer, getAverageRating } from '@/services/reviewService';
import { useAuthStore } from '@/store/authStore';
import { useAuthContext } from '@/context/AuthContext';
import { resolvePersonImage } from '@/lib/article-art';
import { sendConnectionRequest } from '@/services/connections/connectionService';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users } from 'lucide-react';

interface LawyerDetailProps {
  lawyer: {
    id: string;
    name: string;
    specialization: string | string[];
    experience: number;
    consultationFee: number;
    available: boolean;
    rating: number;
    city: string;
    location?: string;
    bio?: string;
    avatar?: string;
    profileImage?: string;
    isVerified?: boolean;
    totalReviews?: number;
    country?: string | null;
    state?: { id: number; name: string; code?: string | null } | null;
    cityRef?: { id: number; name: string } | null;
    practiceAreas?: { id: number; name: string; slug: string }[];
    languages?: string[];
    availableFor?: { consultation?: boolean; case_referral?: boolean; international_collaboration?: boolean };
  };
}

/**
 * @fileOverview LawyerDetail
 * High-fidelity practitioner dossier component for elite conversion.
 * Fixed visibility issues for light-theme Bank-Grade UI.
 */
export default function LawyerDetail({ lawyer }: LawyerDetailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { role } = useAuthContext();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(lawyer.rating?.toString() || "5.0");
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [networkAction, setNetworkAction] = useState<'follow' | 'connect' | null>(null);
  const [networkSent, setNetworkSent] = useState<{ follow?: boolean; connect?: boolean }>({});

  const handleNetworkRequest = async (relation: 'follow' | 'connect') => {
    setNetworkAction(relation);
    try {
      await sendConnectionRequest(Number(lawyer.id), relation);
      setNetworkSent((s) => ({ ...s, [relation]: true }));
      toast({ title: relation === 'follow' ? 'Now following' : 'Connection request sent' });
    } catch (error: any) {
      toast({ title: 'Request failed', description: error?.response?.data?.error?.message || error?.message, variant: 'destructive' });
    } finally {
      setNetworkAction(null);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await getReviewsByLawyer(lawyer.id);
      setReviews(data);
      if (data.length > 0) {
        setAverageRating(getAverageRating(data));
      }
    } catch (err) {
      console.error("Reviews sync failure:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [lawyer.id]);

  const handleBookingTransition = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsBookingOpen(true);
  };

  const specs = Array.isArray(lawyer.specialization)
    ? lawyer.specialization
    : [lawyer.specialization];

  const city = lawyer.city || lawyer.location || 'Global';
  const fee = lawyer.consultationFee || (lawyer as any).hourlyRate || 5000;

  // Location breadcrumb: Country / State / City — degrades gracefully when a
  // lawyer predates the geo taxonomy (state/city are null, free-text city stands in).
  const breadcrumbParts = [lawyer.country, lawyer.state?.name, lawyer.cityRef?.name || lawyer.city].filter(Boolean);
  const practiceAreaChips = lawyer.practiceAreas?.length ? lawyer.practiceAreas.map((p) => p.name) : specs;
  const availableFor = lawyer.availableFor || {};
  const availabilityFlags = [
    { key: 'consultation', label: 'Consultation', on: availableFor.consultation !== false },
    { key: 'case_referral', label: 'Case Referral', on: !!availableFor.case_referral },
    { key: 'international_collaboration', label: 'International Collaboration', on: !!availableFor.international_collaboration },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl p-1 bg-gradient-to-tr from-blue-600 to-slate-900 shadow-2xl overflow-hidden">
            <Avatar className="w-full h-full rounded-xl border-4 border-white">
              <AvatarImage src={resolvePersonImage({ avatarUrl: lawyer.profileImage || lawyer.avatar, name: lawyer.name, id: lawyer.id })} />
              <AvatarFallback className="bg-slate-100 text-blue-600 text-3xl font-bold italic rounded-xl">
                {lawyer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          {lawyer.isVerified && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-white shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="font-headline text-4xl italic text-slate-900">{lawyer.name}</h1>
            {lawyer.isVerified && (
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-[0.2em]">Verified Elite</span>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-600" /> {specs[0]} Practitioner</div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {breadcrumbParts.length ? breadcrumbParts.join(' / ') : `${city} Jurisdiction`}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center md:justify-start gap-1 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            <Star className="w-3 h-3 fill-blue-600" />
            <span>{averageRating} Rating ({lawyer.totalReviews || reviews.length} Reviews)</span>
            <span className="mx-2 text-slate-200">•</span>
            <span className="text-slate-500">{lawyer.experience}Y Distinguished Career</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <aside className="md:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Consultation Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center py-2">
                <p className="text-3xl font-headline italic text-slate-900">₹{fee.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Per Executive Session</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-slate-500">Availability:</span>
                  <span className={lawyer.available ? "text-emerald-600" : "text-red-600"}>
                    {lawyer.available ? "Ready for Briefing" : "In Chambers"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-slate-500">Typical Response:</span>
                  <span className="text-slate-900 font-bold"><Clock className="w-3 h-3 inline mr-1 text-blue-600" /> &lt; 2 Hours</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 font-bold shadow-lg shadow-blue-200 rounded-xl transition-all active:scale-[0.98]"
                  onClick={handleBookingTransition}
                  disabled={!lawyer.available}
                >
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  SECURE CONSULTATION
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-200 hover:bg-slate-50 h-12 font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest text-slate-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                  MESSAGE COUNSEL
                </Button>

                {role === 'lawyer' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-200 hover:bg-slate-50 h-10 text-[9px] font-bold uppercase tracking-widest text-slate-600"
                      disabled={!!networkAction || networkSent.follow}
                      onClick={() => handleNetworkRequest('follow')}
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      {networkSent.follow ? 'Following' : 'Follow'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-200 hover:bg-slate-50 h-10 text-[9px] font-bold uppercase tracking-widest text-slate-600"
                      disabled={!!networkAction || networkSent.connect}
                      onClick={() => handleNetworkRequest('connect')}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      {networkSent.connect ? 'Requested' : 'Connect'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <SocialProof />

          <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Next Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-[10px] text-blue-600/60 font-bold uppercase tracking-widest mb-2 italic">Module Syncing...</p>
              <p className="text-xs text-slate-500 italic font-medium">Real-time scheduling protocol will be active in the next network update.</p>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-white border-slate-200 shadow-xl overflow-hidden">
            <CardHeader className="pb-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="font-headline text-2xl italic text-slate-900">Professional Background</CardTitle>
              <CardDescription className="italic font-medium">Distinguished career trajectory and domain expertise.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {practiceAreaChips.map(s => (
                  <Badge key={s} variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-widest py-1 px-3">
                    {s}
                  </Badge>
                ))}
              </div>

              {!!lawyer.languages?.length && (
                <div className="flex flex-wrap items-center gap-2 -mt-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Languages:</span>
                  {lawyer.languages.map((l) => (
                    <Badge key={l} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[9px] font-bold py-0.5 px-2.5">
                      {l}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 -mt-4">
                {availabilityFlags.filter((f) => f.on).map((f) => (
                  <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Available for {f.label}
                  </span>
                ))}
              </div>

              <div className="text-slate-600 leading-relaxed italic text-sm font-medium whitespace-pre-wrap">
                {lawyer.bio || `Advocate ${lawyer.name} is a distinguished practitioner specializing in ${specs.join(', ')}. With over ${lawyer.experience} years of expertise in the ${city} jurisdiction, they have consistently demonstrated a commitment to legal excellence and strategic counsel for elite clients and corporate entities.`}
              </div>

              <TrustBadges />

              {/* Case History Placeholder */}
              <div className="pt-8 border-t border-slate-100">
                <h4 className="font-headline text-xl italic text-slate-900 mb-4 flex items-center gap-3">
                  <History className="w-5 h-5 text-blue-600" /> Notable Engagements
                </h4>
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 italic font-medium">Confidential matter dossiers are archived. Case history audit will be available for verified members soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials Section */}
          <div className="space-y-8 pt-4">
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Reputation Ledger...</p>
              </div>
            ) : (
              <>
                <ReviewList reviews={reviews} />
                
                {user && (
                  <ReviewForm 
                    lawyerId={lawyer.id} 
                    user={user} 
                    onSuccess={loadReviews} 
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <StickyBookingBar 
        fee={fee} 
        available={lawyer.available} 
        onBook={handleBookingTransition} 
      />

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        lawyer={lawyer}
        userId={user?.id || ''}
      />
    </div>
  );
}
