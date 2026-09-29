
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Briefcase, FileText, ArrowRight } from 'lucide-react';
import type { AdminCompanyData } from '../companies/page';

export function AdminCompanyOverview({ data }: { data: AdminCompanyData[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {data.map((company) => (
        <Card key={company.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={company.logoUrl} alt={company.name} />
                <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{company.name}</CardTitle>
                <CardDescription>Owner: {company.ownerName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Users</span>
                <span className="font-bold">{company.userCount}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Tasks</span>
                <span className="font-bold">{company.taskCount}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Submissions</span>
                <span className="font-bold">{company.submissionCount}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/companies`}>
                Manage Tenant <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
