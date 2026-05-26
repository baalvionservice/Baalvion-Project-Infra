'use client';

import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function OnboardingTour() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if user exists, is onboarded, and hasn't completed the tour yet
    if (currentUser && !currentUser.tourCompleted) {
      // Small delay to ensure layout is painted
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const creatorSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to Baalvion Connect!',
      content: 'Let\'s take a quick tour of your new professional creative command center.',
      disableBeacon: true,
    },
    {
      target: '#sidebar-analytics',
      title: 'Performance Analytics',
      content: 'Track your reach, engagement, and growth metrics across all connected platforms in real-time.',
    },
    {
      target: '#sidebar-portfolio',
      title: 'Portfolio Manager',
      content: 'Showcase your best deliverables to attract premium brands and high-value campaigns.',
    },
    {
      target: '#sidebar-rates',
      title: 'Rate Card Builder',
      content: 'Define your commercial value and create enticing package deals for brands.',
    },
    {
      target: '#sidebar-campaigns',
      title: 'Find Campaigns',
      content: 'Discover and apply to verified brand projects tailored to your specific niche.',
    }
  ];

  const brandSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to Baalvion Connect!',
      content: 'Let\'s show you how to manage your marketing initiatives and hire top talent.',
      disableBeacon: true,
    },
    {
      target: '#sidebar-campaigns',
      title: 'Launch Campaigns',
      content: 'Create high-fidelity briefs and define deliverables to kickstart your marketing projects.',
    },
    {
      target: '#sidebar-creators',
      title: 'Talent Sourcing',
      content: 'Search across 10,000+ verified creators using our AI performance benchmarking.',
    },
    {
      target: '#sidebar-deliverables',
      title: 'Deliverable Hub',
      content: 'Review and approve creative assets submitted by your partners before releasing escrow.',
    },
    {
      target: '#sidebar-team',
      title: 'Team Collaboration',
      content: 'Invite colleagues and manage access levels for your corporate workspace.',
    }
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);

      if (currentUser?.id) {
        try {
          await updateDoc(doc(db!, 'users', currentUser.id), {
            tourCompleted: true,
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Failed to mark tour as complete", e);
        }
      }
    }
  };

  if (!currentUser) return null;

  return (
    <Joyride
      steps={currentUser.role === 'CREATOR' ? creatorSteps : brandSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6C3AE8',
          zIndex: 1000,
          backgroundColor: '#fff',
          textColor: '#1e293b',
          arrowColor: '#fff',
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '24px',
          padding: '10px'
        },
        buttonNext: {
          borderRadius: '12px',
          fontWeight: 'bold',
          padding: '10px 20px'
        },
        buttonBack: {
          fontWeight: 'bold',
          marginRight: '10px'
        },
        buttonSkip: {
          color: '#94a3b8',
          fontWeight: 'bold'
        }
      }}
    />
  );
}