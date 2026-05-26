
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Landmark,
  GitMerge,
  Rocket,
  ShieldX,
} from 'lucide-react';
import AcquisitionWizard from './components/acquisition-wizard';
import ActiveDealsTable from './components/active-deals-table';
import CompletedDeals from './components/completed-deals';

type View = 'dashboard' | 'acquisition' | 'merger' | 'launch' | 'exit';

export default function CorporateActionsPage() {
  const [view, setView] = useState<View>('dashboard');

  const actionCards = [
    {
      view: 'acquisition',
      title: 'Acquisition',
      description: 'Acquire another company.',
      icon: Landmark,
    },
    {
      view: 'merger',
      title: 'Merger',
      description: 'Merge two or more of your businesses.',
      icon: GitMerge,
    },
    {
      view: 'launch',
      title: 'New Business Launch',
      description: 'Start a new business venture.',
      icon: Rocket,
    },
    {
      view: 'exit',
      title: 'Business Exit',
      description: 'Sell or wind down a business.',
      icon: ShieldX,
    },
  ] as const;
  
  const renderContent = () => {
    if (view === 'acquisition') {
      return <AcquisitionWizard onBack={() => setView('dashboard')} />;
    }
    
    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {actionCards.map((action) => (
                <Card
                    key={action.view}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setView(action.view)}
                >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 rounded-lg bg-muted">
                        <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription className="mt-1">{action.description}</CardDescription>
                    </div>
                    </CardHeader>
                </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <ActiveDealsTable />
                </div>
                <div className="lg:col-span-1">
                    <CompletedDeals />
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Corporate Actions</h1>
        <p className="text-muted-foreground">
          Manage major corporate transactions and strategic initiatives.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}
