'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  Zap,
  Clock,
  UserX,
  ShieldCheck,
  MoreVertical,
  History,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CreditCard,
  Globe,
  Ban,
  PauseCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { collection, query, orderBy, doc, updateDoc, addDoc, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { FraudAlert, FraudAlertType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock Data for the prototype
const MOCK_ALERTS: FraudAlert[] = [
  {
    id: 'fa_1',
    userId: 'user_1',
    userName: 'Sarah Chen',
    userAvatar: 'https://picsum.photos/seed/sarah/100/100',
    type: 'FOLLOWER_SPIKE',
    riskScore: 92,
    description: 'Sudden increase of 150k followers in 24h from Tier 3 regions.',
    status: 'PENDING',
    metadata: { delta: '+150,000', region: 'Global' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fa_2',
    userId: 'user_2',
    userName: 'Nexus Brand',
    type: 'MULTI_ACCOUNT_IP',
    riskScore: 85,
    description: '3 brand accounts logged in from same static IP within 1 hour.',
    status: 'UNDER_REVIEW',
    metadata: { ipAddress: '192.168.1.45', connectedAccounts: ['brand_102', 'brand_105'] },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fa_3',
    userId: 'user_3',
    userName: 'Alex Rivers',
    userAvatar: 'https://picsum.photos/seed/alex/100/100',
    type: 'HIGH_ENGAGEMENT',
    riskScore: 78,
    description: 'Engagement rate spiked to 45% on latest 3 reels. Typical: 5%.',
    status: 'PENDING',
    metadata: { er: '45.2%', delta: '+40.2%' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function FraudAlerts() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Alerts (using mock for now, ready for Firestore)
  const alerts = MOCK_ALERTS;

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchesSearch = a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [alerts, searchQuery, typeFilter]);

  const handleAction = async (action: 'RESOLVE' | 'DISMISS' | 'PAUSE_PAYOUT' | 'SUSPEND') => {
    if (!selectedAlert || isProcessing) return;
    setIsProcessing(true);

    const alertRef = doc(db!, 'fraud_alerts', selectedAlert.id);
    const userRef = doc(db!, 'users', selectedAlert.userId);

    const updateData: any = {
      status: action === 'RESOLVE' ? 'RESOLVED' : action === 'DISMISS' ? 'DISMISSED' : 'UNDER_REVIEW',
      adminNote: feedbackNote,
      updatedAt: new Date().toISOString(),
      feedback: action === 'DISMISS' ? 'FALSE_POSITIVE' : 'ACCURATE'
    };

    try {
      if (action === 'SUSPEND') {
        await updateDoc(userRef, { status: 'SUSPENDED' });
        toast({ title: "Account Suspended", description: "Access has been revoked globally." });
      } else if (action === 'PAUSE_PAYOUT') {
        await updateDoc(userRef, { payoutsEnabled: false });
        toast({ title: "Payouts Paused", description: "Financial clearance holds applied." });
      }

      // Record logic would go here
      console.log("Mock update for alert:", selectedAlert.id, updateData);

      // Audit Log Entry
      await addDoc(collection(db!, 'audit_logs'), {
        adminId: 'current_admin',
        adminName: 'Root Admin',
        actionType: `FRAUD_${action}`,
        entityId: selectedAlert.userId,
        entityType: 'USER',
        timestamp: new Date().toISOString(),
        isCritical: action === 'SUSPEND' || action === 'PAUSE_PAYOUT'
      });

      setIsAuditOpen(false);
      setSelectedAlert(null);
      setFeedbackNote('');
      toast({ title: "Security decision applied", description: "Audit trail synchronized." });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/fraud_alerts/${selectedAlert.id}`,
        operation: 'update'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeBadge = (type: FraudAlertType) => {
    switch (type) {
      case 'FOLLOWER_SPIKE': return <Badge className="bg-orange-100 text-orange-600 border-none text-[9px]">FOLLOWER SPIKE</Badge>;
      case 'HIGH_ENGAGEMENT': return <Badge className="bg-pink-100 text-pink-600 border-none text-[9px]">ENGAGEMENT ANOMALY</Badge>;
      case 'MULTI_ACCOUNT_IP': return <Badge className="bg-indigo-100 text-indigo-600 border-none text-[9px]">IP COLLISION</Badge>;
      case 'SUSPICIOUS_PAYOUT': return <Badge className="bg-red-100 text-red-600 border-none text-[9px]">PAYOUT RISK</Badge>;
      default: return <Badge variant="outline" className="text-[9px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search user or incident..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">All Categories</SelectItem>
              <SelectItem value="FOLLOWER_SPIKE" className="font-bold">Follower Spikes</SelectItem>
              <SelectItem value="HIGH_ENGAGEMENT" className="font-bold">Engagement Anomalies</SelectItem>
              <SelectItem value="MULTI_ACCOUNT_IP" className="font-bold">IP Collisions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Target User</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Incident Type</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Risk Score</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, idx) => (
                  <TableRow key={alert.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border border-slate-100">
                          <AvatarImage src={alert.userAvatar} />
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">{alert.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900">{alert.userName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {mounted ? (
                              <>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.createdAt).toLocaleDateString()}</>
                            ) : '...'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(alert.type)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={cn(
                          "text-lg font-black",
                          alert.riskScore > 80 ? "text-red-600" : alert.riskScore > 50 ? "text-orange-500" : "text-emerald-600"
                        )}>
                          {alert.riskScore}%
                        </span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full mt-1">
                          <div
                            className={cn("h-full rounded-full", alert.riskScore > 80 ? "bg-red-600" : "bg-orange-500")}
                            style={{ width: `${alert.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase",
                        alert.status === 'PENDING' ? "border-red-200 text-red-600" : "border-slate-200 text-slate-400"
                      )}>
                        {alert.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl font-bold h-10 px-4 bg-slate-50 text-slate-600 hover:text-primary transition-all"
                        onClick={() => { setSelectedAlert(alert); setIsAuditOpen(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Security queue is clean</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Dialog */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-4xl shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Security Incident Audit</DialogTitle>
                    <DialogDescription className="font-medium">Incident ID: {selectedAlert?.id}</DialogDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Confidence</p>
                  <p className="text-3xl font-black text-red-600">{selectedAlert?.riskScore}%</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-10 max-h-[65vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Evidence Section */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Zap className="h-3 w-3 text-primary" /> Anomalous Signals
                </h4>
                <div className="p-6 rounded-3xl bg-white border border-slate-100 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Detection Logic</p>
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">
                      {selectedAlert?.description}
                    </p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedAlert?.metadata || {}).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{key}</p>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enforcement Protocol</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-1 rounded-2xl border-slate-100 hover:border-orange-200 hover:bg-orange-50 group"
                      onClick={() => handleAction('PAUSE_PAYOUT')}
                    >
                      <PauseCircle className="h-5 w-5 text-slate-400 group-hover:text-orange-600" />
                      <span className="text-[10px] font-black uppercase">Pause Payouts</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-1 rounded-2xl border-slate-100 hover:border-red-200 hover:bg-red-50 group"
                      onClick={() => handleAction('SUSPEND')}
                    >
                      <Ban className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
                      <span className="text-[10px] font-black uppercase">Suspend Account</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Note (Logged)</Label>
                  <Textarea
                    placeholder="Specify findings or justification for decision..."
                    className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-primary text-md"
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Neural Feedback Section */}
            <div className="p-6 rounded-[2rem] bg-indigo-900 text-white relative overflow-hidden group">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
              <div className="relative flex items-center justify-between gap-8">
                <div className="space-y-1">
                  <h4 className="text-lg font-black uppercase tracking-tight">Model Governance</h4>
                  <p className="text-xs text-indigo-100/70 font-medium">Was this AI flag accurate? Your feedback retrains our detection neural network.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl h-11 px-6 bg-white/10 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                    onClick={() => handleAction('RESOLVE')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" /> Correct
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl h-11 px-6 bg-white/10 hover:bg-red-500 text-white font-bold text-xs uppercase"
                    onClick={() => handleAction('DISMISS')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" /> False Positive
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsAuditOpen(false)}>Cancel Audit</Button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mr-auto ml-4">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Administrative Decision Final
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
