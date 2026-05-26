import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, DollarSign, Users, TrendingUp, BarChart2 } from 'lucide-react';
import type { Business } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import kpiData from '@/lib/data/kpis.json';
import Link from 'next/link';

interface BusinessDetailsProps {
  business: Business;
}

export default function BusinessDetails({ business }: BusinessDetailsProps) {
  const image = PlaceHolderImages.find(i => i.id === business.imageId);
  const kpi = kpiData.Month.find(k => k.businessId === business.id);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
             <Avatar className="h-16 w-16">
                {image && <AvatarImage src={image.imageUrl} />}
                <AvatarFallback className="text-2xl">{business.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
                <p className="text-muted-foreground">{business.country}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Revenue (Month) <DollarSign className="text-muted-foreground" /></CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{business.currency} {(business.currentMetrics.revenue / 1000000).toFixed(1)}M</p></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Profit (Month) <TrendingUp className="text-muted-foreground" /></CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{business.currency} {(business.currentMetrics.profit / 1000000).toFixed(1)}M</p></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Employees <Users className="text-muted-foreground" /></CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{business.currentMetrics.employees}</p></CardContent>
            </Card>
            {kpi && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Top KPI: NPS <BarChart2 className="text-muted-foreground" /></CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{kpi.nps}</p></CardContent>
                </Card>
            )}
        </div>
        
        <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">View Full Details <ArrowRight className="ml-2 h-4 w-4"/></Link>
        </Button>
    </div>
  );
}
