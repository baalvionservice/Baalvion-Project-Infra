
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Send,
  Calendar,
  Users,
  Target,
  Zap,
  BarChart3,
  History,
  Plus,
  Trash2,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Smartphone
} from 'lucide-react';
import { collection, query, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Broadcast } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CREATOR_NICHES, PLAN_TYPES } from '@/constants';

export default function NotificationBroadcastPage() {
  const db = useFirestore();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('compose');
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cta, setCta] = useState('');
  const [audience, setAudience] = useState<string>('ALL');
  const [audienceValue, setAudienceValue] = useState<string>('');
  const [channelType, setChannelType] = useState<string>('IN_APP');

  // 1. Fetch Broadcast History
  const broadcastsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'broadcasts'), orderBy('sentAt', 'desc'));
  }, [db]);
  const { data: broadcasts, loading: historyLoading } = useCollection<Broadcast>(broadcastsQuery);

  const handleSendBroadcast = async () => {
    if (!title || !body || isSending) return;
    setIsSending(true);

    const broadcastData = {
      title,
      body,
      cta,
      audience,
      audienceValue,
      type: channelType,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      stats: {
        recipients: Math.floor(Math.random() * 5000) + 1000,
        opens: 0
      }
    };

    try {
      // 1. Record the broadcast
      await addDoc(collection(db!, 'broadcasts'), broadcastData);

      // 2. Demonstration: Create one real notification for the admin themselves
      if (currentUser?.id) {
        await addDoc(collection(db!, 'notifications'), {
          userId: currentUser.id,
          title: `[BROADCAST] ${title}`,
          message: body,
          type: 'SYSTEM',
          read: false,
          link: cta || undefined,
          createdAt: new Date().toISOString()
        });
      }

      toast({
        title: "Broadcast Initiated",
        description: "The notification is being delivered to the target audience."
      });

      // Reset form
      setTitle('');
      setBody('');
      setCta('');
      setActiveTab('history');
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/broadcasts',
        operation: 'create',
        requestResourceData: broadcastData
      }));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Broadcast Center
          </h1>
          <p className="text-slate-500 font-medium">Deploy mass announcements and system-wide alerts to your marketplace.</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border">
          <Button
            variant={activeTab === 'compose' ? 'outline' : 'ghost'}
            size="sm"
            className={cn("rounded-xl font-bold px-6 h-10", activeTab === 'compose' && "shadow-sm")}
            onClick={() => setActiveTab('compose')}
          >
            <Plus className="h-4 w-4 mr-2" /> Compose
          </Button>
          <Button
            variant={activeTab === 'history' ? 'outline' : 'ghost'}
            size="sm"
            className={cn("rounded-xl font-bold px-6 h-10", activeTab === 'history' && "shadow-sm")}
            onClick={() => setActiveTab('history')}
          >
            <History className="h-4 w-4 mr-2" /> History
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'compose' ? (
          <motion.div
            key="compose"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Compose Form */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl">Message Content</CardTitle>
                  <CardDescription>Draft your announcement using high-impact copy.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Notification Title</Label>
                    <Input
                      placeholder="e.g. Major Platform Update: 0% Payout Fees for Pro Users!"
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold text-lg"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Message Body</Label>
                    <Textarea
                      placeholder="Enter the details of your announcement. Keep it concise and actionable."
                      className="min-h-[180px] rounded-2xl p-6 bg-slate-50 border-none resize-none text-md"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">CTA Link (Optional)</Label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        placeholder="https://baalvion.com/updates/fees"
                        className="pl-12 h-12 rounded-xl bg-slate-50 border-none font-medium"
                        value={cta}
                        onChange={(e) => setCta(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl">Audience & Channel</CardTitle>
                  <CardDescription>Who should receive this and through which medium?</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Recipient Segment
                      </Label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL" className="font-bold">All Platform Users</SelectItem>
                          <SelectItem value="BRANDS" className="font-bold">All Brand Accounts</SelectItem>
                          <SelectItem value="CREATORS" className="font-bold">All Creator Accounts</SelectItem>
                          <SelectItem value="NICHE" className="font-bold">By Creative Niche</SelectItem>
                          <SelectItem value="PLAN" className="font-bold">By Subscription Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" /> Delivery Channel
                      </Label>
                      <Select value={channelType} onValueChange={setChannelType}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_APP" className="font-bold">In-App Dashboard Alert</SelectItem>
                          <SelectItem value="EMAIL" className="font-bold">Email Blast (Mock)</SelectItem>
                          <SelectItem value="BOTH" className="font-bold">Omnichannel (App + Email)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(audience === 'NICHE' || audience === 'PLAN') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t"
                      >
                        <Label className="font-bold text-slate-700">
                          {audience === 'NICHE' ? 'Select Niche' : 'Select Plan Tier'}
                        </Label>
                        <Select value={audienceValue} onValueChange={setAudienceValue}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                            <SelectValue placeholder={`Choose ${audience.toLowerCase()}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {audience === 'NICHE' ? (
                              CREATOR_NICHES.map(n => <SelectItem key={n} value={n} className="font-bold">{n}</SelectItem>)
                            ) : (
                              PLAN_TYPES.map(p => <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="p-8 border-t bg-slate-50/50 flex justify-end gap-4">
                  <Button variant="outline" className="rounded-xl font-bold h-12 px-8 border-slate-200">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule Later
                  </Button>
                  <Button
                    disabled={!title || !body || isSending}
                    onClick={handleSendBroadcast}
                    className="rounded-xl font-black h-12 px-12 shadow-xl shadow-primary/20"
                  >
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Broadcast Now
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Preview & Stats Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview</div>
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 text-white">
                      <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-black text-slate-900 truncate">{title || 'Your Broadcast Title'}</h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {body || 'The main message content will appear here. Brands and creators will see this in their notification feed.'}
                      </p>
                      {cta && (
                        <div className="pt-2">
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] h-6 px-3">
                            Click to View <ArrowRight className="ml-1 h-3 w-3" />
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Target className="h-16 w-16" />
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">Segment Estimation</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                      Your current filters target approximately <span className="text-white font-bold">4,850 active accounts</span>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>Delivery Confidence</span>
                      <span>99.2%</span>
                    </div>
                    <Progress value={99} className="h-1 bg-white/5" />
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                <AlertCircle className="h-6 w-6 text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                  Mass broadcasts cannot be undone. Ensure all links are correct and the audience is appropriately filtered before firing.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Broadcast Ledger
              </h2>
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 h-8 px-4 font-bold border-none">
                {broadcasts.length} Sent Broadcasts
              </Badge>
            </div>

            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
              </div>
            ) : broadcasts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {broadcasts.map((b, i) => (
                  <Card key={b.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-8 flex items-start gap-6 border-b md:border-b-0 md:border-r border-slate-50">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            b.type === 'EMAIL' ? "bg-blue-50 text-blue-600" : "bg-primary/5 text-primary"
                          )}>
                            {b.type === 'EMAIL' ? <Mail className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase">{b.audience}</Badge>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Sent {new Date(b.sentAt).toLocaleDateString()} at {new Date(b.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 truncate">{b.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1 max-w-2xl">{b.body}</p>
                          </div>
                        </div>

                        <div className="w-full md:w-[350px] p-8 bg-slate-50/30 flex items-center justify-between gap-8">
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-end text-[10px] font-black uppercase text-slate-400">
                              <span>Open Rate</span>
                              <span className="text-primary">{Math.floor(Math.random() * 20) + 40}%</span>
                            </div>
                            <Progress value={Math.floor(Math.random() * 20) + 40} className="h-1.5" />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipients</p>
                            <p className="text-2xl font-black text-slate-900">{b.stats.recipients.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-primary group-hover:opacity-100 transition-all">
                            <BarChart3 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                  <Megaphone className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">No broadcast history</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">Your platform announcements will be logged here for performance tracking.</p>
                <Button className="mt-8 rounded-xl font-bold h-11 px-8" onClick={() => setActiveTab('compose')}>Compose First Broadcast</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
