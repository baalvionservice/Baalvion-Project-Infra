

'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, CheckCircle, XCircle, Trash2, CreditCard } from 'lucide-react';
import type { AdminCompanyData } from './page';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CompanyFormDialog } from './company-form-dialog';
import type { Company, Subscription, Plan } from '@/lib/types';
import { TenantDetailDialog } from './tenant-detail-dialog';
import { SubscriptionManagementDialog } from './subscription-management-dialog';

type StatusFilter = 'All' | 'Active' | 'Inactive';

export function AdminCompaniesList({ 
  initialData, 
  allPlans, 
  allSubscriptions
}: { 
  initialData: AdminCompanyData[],
  allPlans: Plan[],
  allSubscriptions: Subscription[],
}) {
  const [data, setData] = useState<AdminCompanyData[]>(initialData);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(allSubscriptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingTenant, setViewingTenant] = useState<AdminCompanyData | null>(null);

  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [managingCompany, setManagingCompany] = useState<AdminCompanyData | null>(null);

  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' && company.isActive) || (statusFilter === 'Inactive' && !company.isActive);
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, searchTerm, statusFilter]);

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
        setSelectedRows(new Set());
    } else {
        setSelectedRows(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedRows.size === 0) return;
    
    setData(prev => prev.map(company => {
        if (selectedRows.has(company.id)) {
            if (action === 'activate') return { ...company, isActive: true };
            if (action === 'deactivate') return { ...company, isActive: false };
            return null; // For deletion
        }
        return company;
    }).filter((c): c is AdminCompanyData => c !== null));
    
    toast({
        title: 'Bulk Action Successful',
        description: `${selectedRows.size} tenant(s) have been ${action === 'delete' ? 'deleted' : action + 'd'}.`,
    });
    setSelectedRows(new Set());
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };
  
  const handleSaveCompany = (companyData: Company) => {
    setData(prevData => prevData.map(c => c.id === companyData.id ? { ...c, ...companyData } : c));
  };
  
  const handleViewTenant = (company: AdminCompanyData) => {
    setViewingTenant(company);
    setIsDetailOpen(true);
  };
  
  const handleManageSubscription = (company: AdminCompanyData) => {
    setManagingCompany(company);
    setIsSubDialogOpen(true);
  };
  
  const handleSaveSubscription = (subscription: Subscription) => {
    setSubscriptions(prev => prev.map(s => s.id === subscription.id ? subscription : s));
    setData(prev => prev.map(c => {
      if (c.id === subscription.companyId) {
        const plan = allPlans.find(p => p.id === subscription.planId);
        return {
          ...c,
          subscription: {
            planName: plan?.name || 'N/A',
            status: subscription.status,
          }
        };
      }
      return c;
    }));
  };
  
  const getSubscriptionStatusVariant = (status: Subscription['status']) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'CANCELED': return 'destructive';
      case 'TRIAL': return 'warning';
      case 'EXPIRED': return 'outline';
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by tenant name..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
          </div>
          {selectedRows.size > 0 && (
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleBulkAction('activate')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Activate ({selectedRows.size})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('deactivate')}>
                    <XCircle className="mr-2 h-4 w-4" /> Deactivate ({selectedRows.size})
                </Button>
                <Button variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedRows.size})
                </Button>
             </div>
          )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.size > 0 && selectedRows.size === filteredData.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
              </TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((company) => (
                <TableRow key={company.id} data-state={selectedRows.has(company.id) && "selected"}>
                  <TableCell>
                      <Checkbox
                        checked={selectedRows.has(company.id)}
                        onCheckedChange={() => toggleRow(company.id)}
                        aria-label="Select row"
                      />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={company.logoUrl} alt={company.name} />
                            <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-muted-foreground">{company.domains?.[0]?.name || 'No domain'}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? 'default' : 'destructive'} className={!company.isActive ? 'bg-gray-400' : ''}>
                        {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{company.ownerName}</TableCell>
                   <TableCell>
                    {company.subscription ? (
                        <div>
                        <p className="font-medium">{company.subscription.planName}</p>
                        <Badge variant={getSubscriptionStatusVariant(company.subscription.status)} className="capitalize text-xs">
                            {company.subscription.status.toLowerCase()}
                        </Badge>
                        </div>
                    ) : (
                        <Badge variant="outline">No Plan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{format(new Date(company.createdAt), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" onClick={() => handleViewTenant(company)}>View</Button>
                     <Button variant="ghost" size="sm" onClick={() => handleEditCompany(company)}>Edit</Button>
                     <Button variant="ghost" size="sm" onClick={() => handleManageSubscription(company)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tenants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CompanyFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveCompany}
        company={editingCompany}
      />
      <TenantDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        tenant={viewingTenant}
      />
       <SubscriptionManagementDialog
        isOpen={isSubDialogOpen}
        onOpenChange={setIsSubDialogOpen}
        onSave={handleSaveSubscription}
        company={managingCompany}
        allPlans={allPlans}
        currentSubscription={subscriptions.find(s => s.companyId === managingCompany?.id)}
      />
    </div>
  );
}
