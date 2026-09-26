

'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Globe } from 'lucide-react';
import type { Submission, Company } from '@/lib/types';
import { useSubmissions } from '@/contexts/submissions-context';
import { useToast } from '@/hooks/use-toast';

interface DomainAccessCardProps {
  submission: Submission;
  company: Company | undefined;
}

export function DomainAccessCard({ submission, company }: DomainAccessCardProps) {
  const { updateSubmission } = useSubmissions();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [domainToRequest, setDomainToRequest] = useState<string | undefined>(undefined);
  
  const availableDomains = useMemo(() => {
    const requested = submission.requestedDomains?.map(r => r.domainName) || [];
    return company?.domains?.filter(d => !requested.includes(d.name)) || [];
  }, [company, submission.requestedDomains]);
  

  const handleRequestAccess = () => {
    if (!domainToRequest) {
      toast({ title: 'Please select a domain.', variant: 'destructive' });
      return;
    }
    if (!reason) {
      toast({ title: 'Please provide a reason for your request.', variant: 'destructive' });
      return;
    }

    const updatedRequests = [
      ...(submission.requestedDomains || []),
      { domainName: domainToRequest, reason, status: 'pending' as const },
    ];
    
    updateSubmission(submission.id, { requestedDomains: updatedRequests });
    
    toast({
      title: 'Request Sent',
      description: `Your request to access ${domainToRequest} is pending approval.`,
    });

    setDomainToRequest(undefined);
    setReason('');
  };
  
  const getStatusVariant = (status: 'pending' | 'approved' | 'revoked'): 'warning' | 'default' | 'destructive' => {
      switch(status) {
          case 'pending': return 'warning';
          case 'approved': return 'default';
          case 'revoked': return 'destructive';
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Access
        </CardTitle>
        <CardDescription>
            Request access to company domains required for this task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission.requestedDomains && submission.requestedDomains.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Your Requests</h4>
            {submission.requestedDomains.map((request, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="font-semibold truncate pr-2">{request.domainName}</span>
                <Badge variant={getStatusVariant(request.status)} className="capitalize">{request.status}</Badge>
              </div>
            ))}
          </div>
        )}
        
        {availableDomains.length > 0 && (
            <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-medium text-sm">Request New Access</h4>
                <Select onValueChange={setDomainToRequest} value={domainToRequest}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a domain..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableDomains.map(domain => (
                            <SelectItem key={domain.name} value={domain.name}>{domain.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Textarea
                    placeholder="Reason for requesting access..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                 <Button className="w-full" onClick={handleRequestAccess}>Request Access</Button>
            </div>
        )}

        {availableDomains.length === 0 && (!submission.requestedDomains || submission.requestedDomains.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
                No domains are available or required for this task.
            </p>
        )}

      </CardContent>
    </Card>
  );
}
