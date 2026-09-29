'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ChevronRight,
  User,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Monitor,
  Loader2,
  LogOut,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authClient } from '@/lib/auth';

/**
 * Identity & Security — REAL: profile via PATCH /me, password reset via the email
 * flow (forgot-password), and live session management (list + revoke). No mock
 * KYC/AML badges or non-saving toggles.
 */
export default function IdentitySettingsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Sync editable fields once the real user resolves.
  useEffect(() => {
    if (user) {
      setFullName(user.name ?? '');
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), avatarUrl: avatarUrl.trim() });
      setProfileMsg({ kind: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  // Password reset by email
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const handleResetPassword = async () => {
    if (!user?.email) return;
    setPwBusy(true);
    setPwMsg(null);
    try {
      await authClient.forgotPassword(user.email);
      setPwMsg(`A reset link has been sent to ${user.email}.`);
    } catch {
      setPwMsg('Could not send the reset link. Please try again.');
    } finally {
      setPwBusy(false);
    }
  };

  // Active sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await authClient.listSessions();
      if (!cancelled) {
        setSessions(s);
        setSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const revoke = async (id: string) => {
    await authClient.revokeSession(id);
    setSessions((prev) => prev.filter((s) => (s.id ?? s.sessionId) !== id));
  };

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">Identity & Security</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Identity</h1>
        <p className="text-sm text-gray-500 font-light italic">Manage your profile and account security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Profile (real, editable) */}
          <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none p-12 space-y-10">
            <div className="flex items-center space-x-4 text-plum">
              <User className="w-6 h-6" />
              <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest text-gray-900">Profile</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Full Name</Label>
                  <Input
                    className="rounded-none border-slate-200 h-12 text-sm font-light"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Email</Label>
                  <div className="flex items-center space-x-3 h-12 px-4 bg-ivory border border-border">
                    <span className="text-sm font-light text-gray-700 truncate">{user?.email}</span>
                    {user?.emailVerified ? (
                      <Badge className="bg-green-500 text-white border-none text-[8px] uppercase tracking-tighter ml-auto">Verified</Badge>
                    ) : (
                      <Badge className="bg-gold/20 text-gold border-none text-[8px] uppercase tracking-tighter ml-auto">Unverified</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Avatar URL (optional)</Label>
                  <Input
                    className="rounded-none border-slate-200 h-12 text-sm font-light"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-border flex items-center justify-between gap-4">
                {profileMsg ? (
                  <p className={profileMsg.kind === 'ok' ? 'text-[12px] text-green-600 font-medium' : 'text-[12px] text-red-600 font-medium'}>
                    {profileMsg.text}
                  </p>
                ) : <span />}
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-none bg-black text-white hover:bg-plum h-12 px-12 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Active sessions (real) */}
          <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none p-12 space-y-8">
            <div className="flex items-center space-x-4 text-plum">
              <Monitor className="w-6 h-6" />
              <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest text-gray-900">Active Sessions</h3>
            </div>

            {sessionsLoading ? (
              <div className="py-8 flex items-center space-x-3 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Loading sessions…</span>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">No other active sessions.</p>
            ) : (
              <div className="divide-y divide-border border border-border">
                {sessions.map((s) => {
                  const id = s.id ?? s.sessionId;
                  return (
                    <div key={id} className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-tight text-gray-900 truncate">
                          {s.userAgent || s.device || 'Unknown device'}
                          {s.current && <span className="ml-2 text-[8px] text-plum">(this device)</span>}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          {[s.ipAddress, s.createdAt && new Date(s.createdAt).toLocaleString()].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {!s.current && (
                        <Button
                          variant="outline"
                          onClick={() => revoke(id)}
                          className="rounded-none border-red-200 text-red-600 hover:bg-red-50 h-9 px-4 text-[9px] font-bold uppercase tracking-widest"
                        >
                          <LogOut className="w-3 h-3 mr-2" /> Revoke
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Security sidebar (real actions) */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><ShieldCheck className="w-32 h-32" /></div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Account Security</h4>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-white/60 tracking-widest">Email</span>
                <Badge className={`${user?.emailVerified ? 'bg-green-500' : 'bg-gold'} text-white border-none text-[8px] uppercase tracking-tighter`}>
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-white/60 tracking-widest">2FA</span>
                <Badge className={`${user?.mfaEnabled ? 'bg-green-500' : 'bg-white/10'} text-white border-none text-[8px] uppercase tracking-tighter`}>
                  {user?.mfaEnabled ? 'Enabled' : 'Off'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-gold pt-4 border-t border-white/10">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">RS256 session active</span>
            </div>
          </Card>

          <Card className="bg-white border-border p-8 space-y-6 shadow-sm rounded-none">
            <div className="flex items-center space-x-3 text-plum">
              <KeyRound className="w-5 h-5" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Password</h4>
            </div>
            <p className="text-[11px] text-gray-500 italic leading-relaxed">
              For your security, password changes are confirmed by email. We&apos;ll send a reset link to your address.
            </p>
            {pwMsg && <p className="text-[11px] text-green-600 font-medium">{pwMsg}</p>}
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={pwBusy}
              className="w-full border-plum/30 text-plum hover:bg-plum hover:text-white h-10 rounded-none text-[9px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {pwBusy ? 'Sending…' : 'Send Password Reset'}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
