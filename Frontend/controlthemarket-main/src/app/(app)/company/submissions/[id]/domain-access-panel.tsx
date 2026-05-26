

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Check, X } from 'lucide-react';
import type { Submission } from '@/lib/types';
import { useSubmissions } from '@/contexts/submissions-context';
import { useToast } from '@/hooks/use-toast';

interface DomainAccessPanelProps {
  submission: Submission;
}

export function DomainAccessPanel({ submission }: DomainAccessPanelProps) {
  const { updateSubmission } = useSubmissions();
  const { toast } = useToast();

  if (!submission.requestedDomains || submission.requestedDomains.length === 0) {
    return null; // Don't render the card if there are no requests
  }

  const handleAccessChange = (domainName: string, newStatus: 'approved' | 'revoked') => {
    if (!submission.requestedDomains) return;
    const updatedRequests = submission.requestedDomains.map(req =>
      req.domainName === domainName ? { ...req, status: newStatus } : req
    );
    updateSubmission(submission.id, { requestedDomains: updatedRequests });
    toast({
      title: 'Access Updated',
      description: `Access to ${domainName} has been ${newStatus}.`,
    });
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
            Domain Access Requests
        </CardTitle>
        <CardDescription>
            Manage candidate access to company domains for this task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {submission.requestedDomains.map((request, index) => (
          <div key={index} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">{request.domainName}</p>
                    <p className="text-xs text-muted-foreground italic">"{request.reason}"</p>
                </div>
                <Badge variant={getStatusVariant(request.status)} className="capitalize">{request.status}</Badge>
            </div>
            {request.status === 'pending' && (
                <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleAccessChange(request.domainName, 'revoked')}>
                        <X className="mr-2 h-4 w-4"/> Deny
                    </Button>
                    <Button size="sm" onClick={() => handleAccessChange(request.domainName, 'approved')}>
                        <Check className="mr-2 h-4 w-4"/> Approve
                    </Button>
                </div>
            )}
             {request.status === 'approved' && (
                <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleAccessChange(request.domainName, 'revoked')}>
                        <X className="mr-2 h-4 w-4"/> Revoke
                    </Button>
                </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
