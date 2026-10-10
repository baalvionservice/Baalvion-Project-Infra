'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, X, Eye, Shield, BadgeCheck, Clock, AlertCircle,
  FileText, Building, User, Search, Filter, ChevronDown, MessageSquare,
  TrendingUp, ExternalLink, Download, RefreshCw, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type VerifyStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'flagged';

interface KYCApplication {
  id: string;
  name: string;
  title: string;
  company: string;
  sector: string;
  city: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: VerifyStatus;
  valuation: string;
  funding: string;
  linkedin: string;
  documents: {
    pan: boolean;
    aadhar: boolean;
    selfie: boolean;
    incorporation: boolean;
    moa: boolean;
    balanceSheet: boolean;
    press: boolean;
  };
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  headline: string;
}

const MOCK_APPLICATIONS: KYCApplication[] = [
  {
    id: 'app001', name: 'Vikram Nanda', title: 'CEO & Co-Founder', company: 'DataFlow AI',
    sector: 'AI/ML', city: 'Bangalore', email: 'vikram@dataflow.ai',
    phone: '+91 98765 43210', submittedAt: '2026-10-10 18:30', status: 'pending',
    valuation: '$15M', funding: '$3M Seed', linkedin: 'linkedin.com/in/vikramnanda',
    documents: { pan: true, aadhar: true, selfie: true, incorporation: true, moa: true, balanceSheet: false, press: false },
    riskLevel: 'Low',
    headline: 'Building the data stack for India\'s next 100M businesses',
  },
  {
    id: 'app002', name: 'Zara Khan', title: 'Founder', company: 'FashionX',
    sector: 'D2C', city: 'Delhi', email: 'zara@fashionx.in',
    phone: '+91 87654 32109', submittedAt: '2026-10-09 14:15', status: 'under_review',
    valuation: '$8M', funding: 'Bootstrapped', linkedin: 'linkedin.com/in/zarakhan',
    documents: { pan: true, aadhar: true, selfie: true, incorporation: true, moa: false, balanceSheet: false, press: true },
    riskLevel: 'Medium',
    headline: 'Making sustainable fashion accessible to every Indian woman',
  },
  {
    id: 'app003', name: 'Rahul Desai', title: 'Co-Founder & CTO', company: 'HealthBridge',
    sector: 'HealthTech', city: 'Mumbai', email: 'rahul@healthbridge.co',
    phone: '+91 76543 21098', submittedAt: '2026-10-08 11:00', status: 'approved',
    valuation: '$22M', funding: '$5M Series A', linkedin: 'linkedin.com/in/rahuldesai-ht',
    documents: { pan: true, aadhar: true, selfie: true, incorporation: true, moa: true, balanceSheet: true, press: true },
    reviewedBy: 'Baalvion Admin', reviewedAt: '2026-10-09 10:00',
    riskLevel: 'Low',
    headline: 'Connecting rural patients to specialist doctors in 60 seconds',
  },
  {
    id: 'app004', name: 'Anonymous User', title: 'Founder', company: 'CryptoXX',
    sector: 'Web3', city: 'Delhi', email: 'anon@cryptoxx.io',
    phone: '+91 00000 00000', submittedAt: '2026-10-10 02:30', status: 'flagged',
    valuation: '$500M', funding: '$200M', linkedin: 'linkedin.com/in/xxxxx',
    documents: { pan: false, aadhar: false, selfie: false, incorporation: false, moa: false, balanceSheet: false, press: false },
    adminNotes: 'No documents submitted. Suspicious valuation claims. Fake phone number.',
    riskLevel: 'High',
    headline: 'Decentralized everything',
  },
  {
    id: 'app005', name: 'Meera Pillai', title: 'CEO', company: 'EduFirst',
    sector: 'EdTech', city: 'Bangalore', email: 'meera@edufirst.in',
    phone: '+91 91234 56789', submittedAt: '2026-10-07 09:45', status: 'rejected',
    valuation: '$3M', funding: 'Pre-seed ₹50L', linkedin: 'linkedin.com/in/meerapillai',
    documents: { pan: true, aadhar: true, selfie: false, incorporation: true, moa: false, balanceSheet: false, press: false },
    adminNotes: 'Could not verify company registration. CIN provided does not match company name in MCA21.',
    reviewedBy: 'Baalvion Admin', reviewedAt: '2026-10-08 15:00',
    riskLevel: 'Medium',
    headline: 'Personalized learning for India',
  },
  {
    id: 'app006', name: 'Arnav Gupta', title: 'Founder & CEO', company: 'GreenLeaf',
    sector: 'CleanTech', city: 'Mumbai', email: 'arnav@greenleaf.io',
    phone: '+91 90876 54321', submittedAt: '2026-10-10 16:00', status: 'pending',
    valuation: '$12M', funding: '$2M Angel', linkedin: 'linkedin.com/in/arnavgupta',
    documents: { pan: true, aadhar: true, selfie: true, incorporation: true, moa: true, balanceSheet: false, press: false },
    riskLevel: 'Low',
    headline: 'Carbon-negative supply chain for Indian manufacturers',
  },
];

const statusConfig: Record<VerifyStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
  flagged: { label: '🚩 Flagged', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Flag },
};

const riskColor = { Low: 'text-green-600 bg-green-50', Medium: 'text-yellow-600 bg-yellow-50', High: 'text-red-600 bg-red-50' };

// ─── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ app, open, onClose, onAction }: {
  app: KYCApplication | null;
  open: boolean;
  onClose: () => void;
  onAction: (id: string, action: VerifyStatus, notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{key: string, label: string} | null>(null);
  const { toast } = useToast();

  if (!app) return null;

  const docList = [
    { key: 'pan', label: 'PAN Card' },
    { key: 'aadhar', label: 'Aadhaar Card' },
    { key: 'selfie', label: 'Live Selfie + PAN' },
    { key: 'incorporation', label: 'Certificate of Inc.' },
    { key: 'moa', label: 'MoA / AoA' },
    { key: 'balanceSheet', label: 'Balance Sheet' },
    { key: 'press', label: 'Press Coverage' },
  ] as const;

  const docsUploaded = docList.filter(d => app.documents[d.key]).length;
  const docsTotal = docList.length;
  const requiredMissing = !app.documents.pan || !app.documents.aadhar || !app.documents.selfie || !app.documents.incorporation;

  const handleAction = (action: VerifyStatus) => {
    onAction(app.id, action, notes);
    const msgs: Record<string, string> = {
      approved: '✅ Founder APPROVED — now listed on platform',
      rejected: '❌ Application rejected — email sent to applicant',
      flagged: '🚩 Application flagged for further review',
      under_review: '🔍 Marked as Under Review',
    };
    toast({ title: msgs[action] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review: {app.name}
            <Badge className={`border text-xs ${statusConfig[app.status].color}`}>{statusConfig[app.status].label}</Badge>
          </DialogTitle>
          <DialogDescription>{app.title} · {app.company} · Submitted {app.submittedAt}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Risk Indicator */}
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${riskColor[app.riskLevel]}`}>
            <AlertCircle className="h-4 w-4" />
            Risk Level: {app.riskLevel}
            {app.riskLevel === 'High' && ' — Handle with extreme caution. Do NOT approve without full verification.'}
          </div>

          {/* Personal */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Personal</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {[['Name', app.name], ['Email', app.email], ['Phone', app.phone], ['City', app.city], ['LinkedIn', app.linkedin], ['Valuation', app.valuation]].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Company */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building className="h-4 w-4" />Company</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {[['Company', app.company], ['Sector', app.sector], ['Funding', app.funding], ['Headline', app.headline]].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Documents</CardTitle>
                <span className="text-sm font-medium">{docsUploaded}/{docsTotal} uploaded</span>
              </div>
            </CardHeader>
            <CardContent>
              {requiredMissing && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2 mb-3 text-xs text-red-700 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Required documents missing — cannot approve without them.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {docList.map(({ key, label }) => (
                  <div key={key} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    app.documents[key] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {app.documents[key] ? <CheckCircle className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {label}
                    {app.documents[key] && (
                      <button 
                        onClick={() => setPreviewDoc({ key, label })}
                        className="ml-auto text-blue-600 hover:underline text-xs flex items-center gap-0.5"
                      >
                        <Eye className="h-3 w-3" />View
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Admin Notes (sent to applicant if rejected)</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-24"
              placeholder="Document mismatch, suspicious claims, or approval notes..."
              value={notes || app.adminNotes || ''}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAction('flagged')} className="text-orange-600 border-orange-300">
            <Flag className="h-3.5 w-3.5 mr-1" />Flag
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAction('under_review')} className="text-blue-600 border-blue-300">
            <Eye className="h-3.5 w-3.5 mr-1" />Under Review
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleAction('rejected')}>
            <X className="h-3.5 w-3.5 mr-1" />Reject
          </Button>
          <Button size="sm" onClick={() => handleAction('approved')} disabled={requiredMissing} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve & List
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Document Preview: {previewDoc.label}</DialogTitle>
              <DialogDescription>{app.name} — {app.company}</DialogDescription>
            </DialogHeader>
            <div className="bg-muted flex flex-col items-center justify-center rounded-lg border h-[60vh]">
              <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="font-medium text-muted-foreground">Simulated Document Viewer</p>
              <p className="text-sm text-muted-foreground mt-2">File: {app.id}_{previewDoc.key}_secure.pdf</p>
              <Button variant="outline" className="mt-6 gap-2">
                <Download className="h-4 w-4" />Download Original
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

// ─── Application Row ───────────────────────────────────────────────────────────
function AppRow({ app, onReview }: { app: KYCApplication; onReview: (a: KYCApplication) => void }) {
  const cfg = statusConfig[app.status];
  const StatusIcon = cfg.icon;
  const docsUploaded = Object.values(app.documents).filter(Boolean).length;

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold">{app.name}</p>
          <Badge className={`border text-xs flex items-center gap-1 ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" />{cfg.label}
          </Badge>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[app.riskLevel]}`}>{app.riskLevel} Risk</span>
        </div>
        <p className="text-sm text-muted-foreground">{app.title} · {app.company} · {app.city}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Submitted {app.submittedAt}</p>
      </div>
      <div className="hidden md:block text-center">
        <p className="text-sm font-bold">{app.valuation}</p>
        <p className="text-xs text-muted-foreground">Valuation</p>
      </div>
      <div className="hidden md:block text-center">
        <p className="text-sm font-bold">{docsUploaded}/7</p>
        <p className="text-xs text-muted-foreground">Docs</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => onReview(app)} className="shrink-0">
        <Eye className="h-3.5 w-3.5 mr-1" />Review
      </Button>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminKYCPage() {
  const [apps, setApps] = useState<KYCApplication[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<KYCApplication | null>(null);
  const [search, setSearch] = useState('');

  const handleAction = (id: string, action: VerifyStatus, notes: string) => {
    setApps(prev => prev.map(a => a.id === id ? {
      ...a, status: action, adminNotes: notes,
      reviewedBy: 'Super Admin', reviewedAt: new Date().toISOString(),
    } : a));
  };

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.company.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    pending: apps.filter(a => a.status === 'pending').length,
    under_review: apps.filter(a => a.status === 'under_review').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    flagged: apps.filter(a => a.status === 'flagged').length,
  };

  const tabs = [
    { value: 'all', label: 'All', filter: () => true, count: apps.length },
    { value: 'pending', label: 'Pending', filter: (a: KYCApplication) => a.status === 'pending', count: counts.pending },
    { value: 'under_review', label: 'Under Review', filter: (a: KYCApplication) => a.status === 'under_review', count: counts.under_review },
    { value: 'flagged', label: '🚩 Flagged', filter: (a: KYCApplication) => a.status === 'flagged', count: counts.flagged },
    { value: 'approved', label: 'Approved', filter: (a: KYCApplication) => a.status === 'approved', count: counts.approved },
    { value: 'rejected', label: 'Rejected', filter: (a: KYCApplication) => a.status === 'rejected', count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dating"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Founder KYC Review</h1>
              <Badge className="bg-red-500 text-white border-0">Super Admin Only</Badge>
            </div>
            <p className="text-muted-foreground">Manual verification portal — every founder you approve goes live on the platform</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Pending', value: counts.pending, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
          { label: 'Under Review', value: counts.under_review, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Flagged', value: counts.flagged, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
          { label: 'Approved', value: counts.approved, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`${bg} border-0`}>
            <CardContent className="p-4">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Rules */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Shield className="h-4 w-4" />Verification Checklist (MANDATORY before Approval)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            '✅ PAN number matches name in government database',
            '✅ Aadhaar matches PAN (same person)',
            '✅ Live selfie confirms identity (no photo of photo)',
            '✅ Company CIN verified on MCA21 portal',
            '✅ Applicant listed as Director in MCA21',
            '✅ Valuation claims are reasonable (cross-check Crunchbase/LinkedIn)',
            '✅ LinkedIn profile is authentic (500+ connections, real work history)',
            '✅ No previous rejection on platform',
          ].map(rule => (
            <p key={rule} className="text-xs text-blue-700 dark:text-blue-300">{rule}</p>
          ))}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, company, city..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto gap-1">
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
              {t.count > 0 && <Badge variant="secondary" className="ml-1 text-xs">{t.count}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value} className="mt-4 space-y-3">
            {filtered.filter(t.filter).map(app => (
              <AppRow key={app.id} app={app} onReview={setSelectedApp} />
            ))}
            {filtered.filter(t.filter).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No {t.label.toLowerCase()} applications.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ReviewModal
        app={selectedApp}
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onAction={handleAction}
      />
    </div>
  );
}
