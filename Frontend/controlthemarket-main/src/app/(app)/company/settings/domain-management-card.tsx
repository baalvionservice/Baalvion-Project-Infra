

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, PlusCircle, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Domain } from '@/lib/types';

const mockDomains: Domain[] = [
    { name: 'baalvion.com', verified: true, purpose: 'Primary Website' },
    { name: 'app.baalvion.com', verified: true, purpose: 'App Backend' },
    { name: 'invest.baalvion.com', verified: false, purpose: 'Investor Portal' },
];

export function DomainManagementCard() {
    const { toast } = useToast();
    const [domains, setDomains] = useState<Domain[]>(mockDomains);
    const [newDomain, setNewDomain] = useState('');
    const [newPurpose, setNewPurpose] = useState('');

    const handleAddDomain = () => {
        if (!newDomain || !newPurpose) {
            toast({ title: 'Please enter both a domain and a purpose.', variant: 'destructive' });
            return;
        }
        if (domains.some(d => d.name === newDomain)) {
            toast({ title: 'Domain already exists.', variant: 'destructive' });
            return;
        }
        setDomains(prev => [...prev, { name: newDomain, verified: false, purpose: newPurpose }]);
        setNewDomain('');
        setNewPurpose('');
        toast({ title: 'Domain Added', description: `${newDomain} is pending verification.` });
    };
    
    const handleRemoveDomain = (domainName: string) => {
        setDomains(prev => prev.filter(d => d.name !== domainName));
        toast({ title: 'Domain Removed', description: `${domainName} has been removed.` });
    };
    
    const handleVerify = (domainName: string) => {
        toast({ title: 'Verification Started (Mock)', description: `Starting verification for ${domainName}.` });
        setTimeout(() => {
            setDomains(prev => prev.map(d => d.name === domainName ? { ...d, verified: true } : d));
            toast({ title: 'Domain Verified!', description: `${domainName} is now verified.` });
        }, 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" /> Domain Management
                </CardTitle>
                <CardDescription>Manage domains and subdomains for your projects and assignments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Domain</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {domains.map(domain => (
                            <TableRow key={domain.name}>
                                <TableCell className="font-medium">{domain.name}</TableCell>
                                <TableCell>{domain.purpose}</TableCell>
                                <TableCell>
                                    <Badge variant={domain.verified ? 'default' : 'warning'}>
                                        {domain.verified ? <CheckCircle className="mr-2 h-3 w-3" /> : <AlertTriangle className="mr-2 h-3 w-3" />}
                                        {domain.verified ? 'Verified' : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {!domain.verified && <Button variant="ghost" size="sm" onClick={() => handleVerify(domain.name)}>Verify</Button>}
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveDomain(domain.name)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="border-t pt-6">
                <div className="flex w-full flex-col gap-4 sm:flex-row">
                    <Input placeholder="Enter new domain..." value={newDomain} onChange={e => setNewDomain(e.target.value)} />
                    <Input placeholder="Purpose (e.g., App Backend)" value={newPurpose} onChange={e => setNewPurpose(e.target.value)} />
                    <Button onClick={handleAddDomain} className="sm:ml-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Domain
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
