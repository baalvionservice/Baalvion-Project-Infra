'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  User,
  ShieldCheck,
  Bell,
  Share2,
  Trash2,
  Camera,
  Loader2,
  CheckCircle2,
  Mail,
  Lock,
  Smartphone,
  Instagram,
  Youtube,
  Music2,
  Globe,
  Save,
  Building2,
  IndianRupee,
  Eye,
  EyeOff,
  Zap,
  MoreVertical,
  Plus,
  CreditCard,
  Smartphone as UpiIcon,
  LifeBuoy,
  Send,
  Clock,
  AlertCircle,
  MapPin,
  RefreshCcw,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { CreatorProfile, BrandProfile, SupportTicket } from '@/types';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const creatorId = currentUser?.role === 'CREATOR' ? `creator_${currentUser.id}` : null;
  const brandId = currentUser?.role === 'BRAND' ? `brand_${currentUser.id}` : null;

  const { data: creatorData } = useDoc<CreatorProfile>(creatorId ? `creators/${creatorId}` : null);
  const { data: brandData } = useDoc<BrandProfile>(brandId ? `brands/${brandId}` : null);

  // Fetch user's support tickets
  const ticketsQuery = React.useMemo(() => {
    if (!currentUser?.id) return null;
    return query(
      collection(db!, 'support_tickets'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db!, currentUser?.id]);

  const { data: userTickets } = useCollection<SupportTicket>(ticketsQuery);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Local state for personal info
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  // Support Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState<any>('TECHNICAL');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
    }
    if (creatorData) {
      setBio(creatorData.bio || '');
      setVisibility(creatorData.visibility || 'PUBLIC');
    } else if (brandData) {
      setBio(brandData.brandGuidelines || '');
    }
  }, [currentUser, creatorData, brandData]);

  const handleUpdateUser = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    const userUpdate = {
      displayName,
      phone,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db!, 'users', currentUser.id), userUpdate);

      if (creatorId) {
        await updateDoc(doc(db!, 'creators', creatorId), {
          bio,
          visibility,
          updatedAt: new Date().toISOString()
        });
      }

      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/users/${currentUser.id}`,
        operation: 'update',
        requestResourceData: userUpdate
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestartTour = async () => {
    if (!currentUser?.id) return;
    try {
      await updateDoc(doc(db!, 'users', currentUser.id), {
        tourCompleted: false,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Tour Reset", description: "Refresh the page to restart the platform tour." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset tour." });
    }
  };

  const handleSubmitTicket = async () => {
    if (!supportSubject || !supportMessage || !currentUser) return;
    setIsSubmittingTicket(true);

    const ticketData = {
      userId: currentUser.id,
      userName: currentUser.displayName || 'Unnamed User',
      userEmail: currentUser.email,
      subject: supportSubject,
      message: supportMessage,
      category: supportCategory,
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db!, 'support_tickets'), ticketData);

      // Initial message in subcollection for chat history
      await addDoc(collection(db!, 'support_tickets', docRef.id, 'messages'), {
        senderId: currentUser.id,
        senderName: currentUser.displayName || 'User',
        text: supportMessage,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Ticket Submitted",
        description: "An administrator will review your request and get back to you shortly."
      });

      setSupportSubject('');
      setSupportMessage('');
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/support_tickets',
        operation: 'create',
        requestResourceData: ticketData
      }));
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleTogglePref = (key: string) => {
    if (!currentUser) return;

    const currentPrefs = currentUser.notificationPreferences || { campaigns: true, payments: true, messages: true, system: true };
    const newPrefs = { ...currentPrefs, [key]: !currentPrefs[key as keyof typeof currentPrefs] };

    updateDoc(doc(db!, 'users', currentUser.id), {
      notificationPreferences: newPrefs,
      updatedAt: new Date().toISOString()
    }).catch(async () => {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/users/${currentUser.id}`,
        operation: 'update',
        requestResourceData: { notificationPreferences: newPrefs }
      }));
    });
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast({
        title: "Reset link sent",
        description: "Check your email to reset your password.",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isCreator = currentUser?.role === 'CREATOR';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your professional presence and platform preferences.</p>
        </div>
        <Button
          onClick={handleUpdateUser}
          disabled={isSaving}
          className="rounded-xl font-bold px-10 shadow-xl shadow-primary/20 h-12"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-2xl border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="profile" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          {isCreator && (
            <>
              <TabsTrigger value="socials" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
                <Share2 className="h-4 w-4" /> Social Accounts
              </TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
                <IndianRupee className="h-4 w-4" /> Payouts
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="notifications" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
            <Eye className="h-4 w-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
            <ShieldCheck className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="support" className="rounded-xl py-2.5 px-6 font-bold flex gap-2">
            <LifeBuoy className="h-4 w-4" /> Help & Support
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* PROFILE SECTION */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="border-b bg-slate-50/50 p-8">
                      <CardTitle className="text-xl">Identity & Bio</CardTitle>
                      <CardDescription>Your public information visible to brands and followers.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                          <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                            <AvatarImage src={currentUser?.photoURL || `https://picsum.photos/seed/${currentUser?.id}/200`} />
                            <AvatarFallback className="text-3xl font-black">{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <button className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                            <Camera className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-1 text-center md:text-left">
                          <div className="flex items-center gap-2 justify-center md:justify-start">
                            <h3 className="text-xl font-bold">{displayName}</h3>
                            {creatorData?.isVerified && <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-500/10" />}
                          </div>
                          <p className="text-sm text-slate-500">Member since {new Date(currentUser?.createdAt || '').getFullYear()}</p>
                          <div className="flex gap-2 mt-4 justify-center md:justify-start">
                            <Button variant="outline" size="sm" className="rounded-xl font-bold px-6 h-10">Upload New Photo</Button>
                          </div>
                        </div>
                      </div>

                      <Separator className="opacity-50" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Display Name</Label>
                          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl h-12 bg-slate-50/50 border-slate-100 focus:bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Phone Number</Label>
                          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-12 bg-slate-50/50 border-slate-100 focus:bg-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">{isCreator ? 'Biography' : 'Brand Guidelines'}</Label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell your story..."
                          className="rounded-2xl min-h-[150px] bg-slate-50/50 border-slate-100 focus:bg-white p-6 resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b p-6">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Profile Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">Public Visibility</p>
                          <p className="text-[10px] text-slate-400 font-medium">Visible in marketplace</p>
                        </div>
                        <Switch
                          checked={visibility === 'PUBLIC'}
                          onCheckedChange={(v) => setVisibility(v ? 'PUBLIC' : 'PRIVATE')}
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        {visibility === 'PUBLIC' ? <Eye className="h-5 w-5 text-primary shrink-0" /> : <EyeOff className="h-5 w-5 text-slate-400 shrink-0" />}
                        <p className="text-xs text-primary font-medium leading-relaxed">
                          {visibility === 'PUBLIC' ? "Your profile is active. Brands can find you and send campaign invites." : "Your profile is hidden. You won't appear in searches or matchmaking."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100">
                    <CardContent className="p-6 space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Platform Help</h4>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl font-bold h-11 border-slate-200 bg-white"
                        onClick={handleRestartTour}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Restart Dashboard Tour
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* SOCIALS SECTION */}
            <TabsContent value="socials" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                  <CardTitle className="text-xl">Connected Channels</CardTitle>
                  <CardDescription>Manage where we sync your engagement and reach data.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {[
                    { id: 'ig', name: 'Instagram', icon: Instagram, color: 'text-pink-600', connected: true, handle: '@sarah_creates' },
                    { id: 'yt', name: 'YouTube', icon: Youtube, color: 'text-red-600', connected: false },
                    { id: 'tt', name: 'TikTok', icon: Music2, color: 'text-slate-900', connected: true, handle: '@sarah_vibe' },
                  ].map((plat) => (
                    <div key={plat.id} className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                          <plat.icon className={cn("h-7 w-7", plat.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg">{plat.name}</p>
                            {plat.connected && <Badge className="bg-emerald-100 text-emerald-600 border-none text-[9px] h-5">SYNC ACTIVE</Badge>}
                          </div>
                          <p className="text-sm text-slate-400 font-medium">{plat.connected ? plat.handle : 'Not connected'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {plat.connected && <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>}
                        <Button variant={plat.connected ? "secondary" : "outline"} className="rounded-xl font-bold px-8 h-11">
                          {plat.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-2 justify-center">
                    <Zap className="h-4 w-4 text-primary" /> Data is refreshed automatically every 24 hours to ensure accuracy for brands.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* PAYOUTS SECTION */}
            <TabsContent value="payouts" className="space-y-6">
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Payout Accounts</h3>
                  <Button className="rounded-xl font-bold gap-2">
                    <Plus className="h-4 w-4" /> Add New Account
                  </Button>
                </div>

                {creatorData?.payoutAccounts?.map((acc) => (
                  <Card key={acc.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", acc.type === 'UPI' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600")}>
                          {acc.type === 'UPI' ? <UpiIcon className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{acc.name}</p>
                            {acc.isPrimary && <Badge className="bg-primary text-white text-[8px] h-4">PRIMARY</Badge>}
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{acc.details}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-2">
                          {!acc.isPrimary && <DropdownMenuItem className="rounded-lg font-bold">Set as Primary</DropdownMenuItem>}
                          <DropdownMenuItem className="rounded-lg font-bold">Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg font-bold text-red-600">Remove Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}

                {!creatorData?.payoutAccounts?.length && (
                  <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <IndianRupee className="h-8 w-8 text-slate-200" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">No payout accounts added</h4>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Add a UPI ID or Bank Account to receive your campaign earnings safely.</p>
                    <Button variant="outline" className="mt-8 rounded-xl font-bold border-slate-200">
                      Add Your First Account
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* NOTIFICATIONS SECTION */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                  <CardTitle className="text-xl">Push & Email Alerts</CardTitle>
                  <CardDescription>Granular control over how we communicate with you.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {[
                      { id: 'campaigns', title: 'Campaign Invites', desc: 'Alerts for new AI matches and project invitations.', icon: Zap, color: 'text-primary' },
                      { id: 'payments', title: 'Payment Status', desc: 'Notifications for escrow deposits and cleared payouts.', icon: IndianRupee, color: 'text-emerald-600' },
                      { id: 'messages', title: 'Direct Messages', desc: 'Real-time alerts for brand chat and file updates.', icon: MessageSquare, color: 'text-blue-500' },
                      { id: 'system', title: 'System Alerts', desc: 'Critical updates regarding account and marketplace rules.', icon: ShieldCheck, color: 'text-orange-500' },
                    ].map((item) => (
                      <div key={item.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                            <item.icon className={cn("h-6 w-6", item.color)} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={currentUser?.notificationPreferences?.[item.id as keyof typeof currentUser.notificationPreferences] ?? true}
                          onCheckedChange={() => handleTogglePref(item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PRIVACY SECTION */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                  <CardTitle className="text-xl">Safety & Visibility</CardTitle>
                  <CardDescription>Control who can interact with you and see your data.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-bold text-slate-900">Direct Messaging</Label>
                        <p className="text-xs text-slate-500 font-medium">Who can start a new chat with you?</p>
                      </div>
                      <Select defaultValue={creatorData?.privacySettings?.canMessage || 'verified'}>
                        <SelectTrigger className="w-[180px] rounded-xl font-bold bg-slate-50 border-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anyone" className="font-bold">Any Brand</SelectItem>
                          <SelectItem value="verified" className="font-bold">Verified Brands</SelectItem>
                          <SelectItem value="invited" className="font-bold">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator className="opacity-50" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-bold text-slate-900">Rate Card Visibility</Label>
                        <p className="text-xs text-slate-500 font-medium">Control who sees your base commercial rates.</p>
                      </div>
                      <Select defaultValue={creatorData?.privacySettings?.canSeeRates || 'verified'}>
                        <SelectTrigger className="w-[180px] rounded-xl font-bold bg-slate-50 border-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anyone" className="font-bold">Public</SelectItem>
                          <SelectItem value="verified" className="font-bold">Logged In Brands</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY SECTION */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                  <CardTitle className="text-xl">Security & Access</CardTitle>
                  <CardDescription>Protect your earnings and account data.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold">Change Password</h4>
                      <p className="text-sm text-slate-500">Update your credentials regularly for safety.</p>
                    </div>
                    <Button onClick={handleResetPassword} variant="outline" className="rounded-xl font-bold h-11 border-slate-200">
                      Send Reset Link
                    </Button>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold">2-Factor Authentication</h4>
                      <p className="text-sm text-slate-500">Requires a secondary code for withdrawals.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-slate-100 text-slate-500 border-none uppercase text-[9px] h-5 font-black">DISABLED</Badge>
                      <Switch
                        checked={currentUser?.twoFactorEnabled}
                        onCheckedChange={(v) => {
                          updateDoc(doc(db!, 'users', currentUser!.id), { twoFactorEnabled: v });
                        }}
                      />
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="space-y-4">
                    <h4 className="font-black text-red-600 uppercase text-xs tracking-widest">Danger Zone</h4>
                    <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-red-900">Delete Account</p>
                        <p className="text-xs text-red-700 font-medium">Permanently remove your profile and all campaign data.</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="danger" className="rounded-xl font-bold px-8 h-12">
                            Delete My Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-red-600">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 mt-4 leading-relaxed font-medium">
                              This action is irreversible. All your campaign history, earned feedback, and wallet data will be wiped from Baalvion Connect.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-8 gap-3">
                            <AlertDialogCancel className="rounded-xl font-bold h-12 px-6 border-slate-200">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="rounded-xl font-bold h-12 px-8 bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HELP & SUPPORT SECTION */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b bg-slate-50/50">
                      <CardTitle className="text-xl">Create Support Ticket</CardTitle>
                      <CardDescription>Experiencing an issue? Our team is here to help.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="font-bold">Subject</Label>
                        <Input
                          placeholder="Brief summary of the issue"
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          className="rounded-xl h-12 bg-slate-50/50 border-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Category</Label>
                        <Select value={supportCategory} onValueChange={setSupportCategory}>
                          <SelectTrigger className="rounded-xl h-12 bg-slate-50/50 border-slate-100 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                            <SelectItem value="BILLING">Billing & Payments</SelectItem>
                            <SelectItem value="CAMPAIGN">Campaign & Creator Dispute</SelectItem>
                            <SelectItem value="OTHER">General Query</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Message</Label>
                        <Textarea
                          placeholder="Describe your issue in detail..."
                          className="rounded-2xl min-h-[150px] bg-slate-50/50 border-slate-100 p-6 resize-none"
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 p-8 border-t flex justify-end">
                      <Button
                        onClick={handleSubmitTicket}
                        disabled={!supportSubject || !supportMessage || isSubmittingTicket}
                        className="rounded-xl font-bold px-10 h-12 shadow-lg shadow-primary/20"
                      >
                        {isSubmittingTicket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Ticket
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b p-6">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">My Recent Tickets</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {userTickets?.map((ticket) => (
                          <div key={ticket.id} className="p-5 space-y-2 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <Badge className={cn(
                                "text-[8px] font-black uppercase border-none px-2 h-4",
                                ticket.status === 'OPEN' ? "bg-red-50 text-red-600" :
                                  ticket.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-600" :
                                    "bg-blue-50 text-blue-600"
                              )}>
                                {ticket.status}
                              </Badge>
                              <span className="text-[9px] font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate">{ticket.subject}</p>
                          </div>
                        ))}
                        {!userTickets?.length && (
                          <div className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                            No support history
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Average Response Time</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Our support specialists typically respond within <strong>4-6 hours</strong> during business days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}