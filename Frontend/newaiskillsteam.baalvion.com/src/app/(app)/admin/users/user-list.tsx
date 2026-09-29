
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
import { Search, MoreHorizontal, UserX, UserCheck, Trash2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import type { AdminUserData } from './page';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { UserFormDialog } from './user-form-dialog';
import type { User } from '@/lib/types';

type RoleFilter = UserRole | 'All';
type StatusFilter = 'All' | 'Active' | 'Inactive';

export function AdminUsersList({ initialData }: { initialData: AdminUserData[] }) {
  const [data, setData] = useState<AdminUserData[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' && user.isActive) || (statusFilter === 'Inactive' && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data, searchTerm, roleFilter, statusFilter]);

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
    
    setData(prev => prev.map(user => {
        if (selectedRows.has(user.id)) {
            if (action === 'activate') return { ...user, isActive: true };
            if (action === 'deactivate') return { ...user, isActive: false };
            return null; // For deletion
        }
        return user;
    }).filter((u): u is AdminUserData => u !== null));
    
    toast({
        title: 'Bulk Action Successful',
        description: `${selectedRows.size} user(s) have been ${action === 'delete' ? 'deleted' : action + 'd'}.`,
    });
    setSelectedRows(new Set());
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleSaveUser = (userData: User) => {
    setData(prevData => prevData.map(u => u.id === userData.id ? { ...u, ...userData } : u));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
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
                    <UserCheck className="mr-2 h-4 w-4" /> Activate ({selectedRows.size})
                </Button>
                <Button variant="outline" onClick={() => handleBulkAction('deactivate')}>
                    <UserX className="mr-2 h-4 w-4" /> Deactivate ({selectedRows.size})
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Activity</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => (
                <TableRow key={user.id} data-state={selectedRows.has(user.id) && "selected"}>
                  <TableCell>
                      <Checkbox
                        checked={selectedRows.has(user.id)}
                        onCheckedChange={() => toggleRow(user.id)}
                        aria-label="Select row"
                      />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.profile?.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'company' ? 'secondary' : 'outline'}>
                          {user.role}
                      </Badge>
                      {user.role === 'company' && user.companyName && <p className="text-xs text-muted-foreground mt-1">{user.companyName}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className={!user.isActive ? 'bg-gray-400' : ''}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                      {user.role === 'candidate' && `${user.submissionCount} submissions`}
                      {user.role === 'company' && `${user.taskCount} tasks`}
                      {user.role === 'admin' && '-'}
                    </TableCell>
                  <TableCell className="hidden md:table-cell">{format(new Date(user.createdAt), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <UserFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  );
}
