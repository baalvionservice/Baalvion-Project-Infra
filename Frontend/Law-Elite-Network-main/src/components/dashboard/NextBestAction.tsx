"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Briefcase, FileUp, Calendar } from 'lucide-react';
import Link from 'next/link';

interface NextBestActionProps {
  cases: any[];
  appointments: any[];
}

/**
 * @fileOverview NextBestAction
 * Identifies and surfaces the single most critical task for the member.
 */
export default function NextBestAction({ cases, appointments }: NextBestActionProps) {
  // Logic to determine priority action
  let action = {
    title: "Initialize Your First Brief",
    desc: "Establish your professional presence by submitting your first legal matter to the network.",
    icon: <Briefcase className="w-6 h-6" />,
    link: "/cases",
    label: "Start Briefing"
  };

  const activeCaseWithoutDocs = cases.find(c => (c.status === 'active' || c.status === 'open') && (!c.documents || c.documents.length === 0));
  const upcomingApt = appointments.find(a => a.status === 'confirmed');

  if (upcomingApt) {
    action = {
      title: "Prepare for Consultation",
      desc: `Your session for "${upcomingApt.caseTitle}" is confirmed. Review your dossier before the session.`,
      icon: <Calendar className="w-6 h-6" />,
      link: `/booking-details/${upcomingApt.id}`,
      label: "View Agenda"
    };
  } else if (activeCaseWithoutDocs) {
    action = {
      title: "Secure Your Dossier",
      desc: `Matter "${activeCaseWithoutDocs.title}" requires supporting records in the Secure Vault for audit.`,
      icon: <FileUp className="w-6 h-6" />,
      link: `/cases/${activeCaseWithoutDocs.id}`,
      label: "Uplink Records"
    };
  }

  return (
    <Card className="border-blue-200 bg-blue-600 text-white overflow-hidden relative group shadow-lg h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
      <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {action.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
              Next Best Action
            </span>
          </div>
          
          <div>
            <h3 className="text-xl font-bold leading-tight mb-2">{action.title}</h3>
            <p className="text-sm text-blue-100 leading-relaxed font-medium">
              {action.desc}
            </p>
          </div>
        </div>

        <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 mt-6 w-full font-bold uppercase text-[10px] tracking-widest h-11 rounded-lg">
          <Link href={action.link}>
            {action.label} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
