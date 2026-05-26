'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  Lock, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Settings2, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { usersService } from '@/services/data/users-service';
import { ALL_PERMISSIONS } from '@/services/mock-api/roles';
import { toast } from '@/hooks/use-toast';

const roleSchema = z.object({
  roleName: z.string().min(3, 'Role label must be at least 3 characters.'),
  description: z.string().min(10, 'Provide a substantial description for this persona.'),
  permissions: z.array(z.string()).min(1, 'Assign at least one capability node to this role.'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

function ManageRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get('id');
  
  const [loading, setLoading] = useState(!!roleId);
  const [saving, setSaving] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roleName: '',
      description: '',
      permissions: [],
    },
  });

  useEffect(() => {
    if (roleId) {
      async function loadRole() {
        const response = await usersService.getControlRoles();
        const role = response.data.find(r => r.id === roleId);
        if (role) {
          form.reset({
            roleName: role.roleName,
            description: role.description || '',
            permissions: role.permissions,
          });
        }
        setLoading(false);
      }
      loadRole();
    }
  }, [roleId, form]);

  const onSubmit = async (values: RoleFormValues) => {
    setSaving(true);
    try {
      const response = await usersService.createOrUpdateRole({
        id: roleId || undefined,
        ...values
      });
      
      if (response.status === 200) {
        toast({
          title: roleId ? "Role Refined" : "Role Architected",
          description: `Capabilities for "${values.roleName}" have been synchronized.`,
        });
        router.push('/admin/control/roles');
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Failure",
        description: "Failed to commit role logic to the governance matrix.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Governance Link...
        </Text>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/control/roles"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Governance Studio</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              {roleId ? 'Refine System Persona' : 'Architect New Persona'}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={saving}
                className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Commit Capability Matrix
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-primary/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold">Synchronize Role Logic?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This action will immediately propagate these capability nodes across the platform for all users assigned to the <strong>{form.getValues('roleName')}</strong> role.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl">Review Further</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-primary hover:bg-primary/90 rounded-xl font-bold"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  Confirm Synchronization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Persona Metadata */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" /> Identity Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="roleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Role Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Senior Moderator" className="bg-background/50 h-12 border-white/5 font-bold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Internal Narrative</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Define the scope of this persona's platform duties..." 
                          className="bg-background/50 min-h-[120px] border-white/5 resize-none leading-relaxed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                <ShieldCheck className="h-32 w-32 text-secondary rotate-12" />
              </div>
              <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                <Info className="h-4 w-4" /> Compliance Note
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed">
                Roles utilizing high-impact capability nodes like <code>system_config</code> or <code>user_manage</code> are automatically subjected to mandatory biometric MFA during administrative sessions.
              </Text>
            </div>
          </div>

          {/* Capability Matrix */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="glass-card border-none shadow-2xl overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-primary/5 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" /> Functional Capability Matrix
                  </CardTitle>
                  <CardDescription className="text-xs">Select nodes to define the operational boundaries of this role.</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-mono">
                  {form.watch('permissions').length} Nodes Active
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex-grow overflow-y-auto max-h-[600px] no-scrollbar">
                <div className="grid grid-cols-1 divide-y divide-white/5">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div 
                      key={perm.id} 
                      className={`flex items-start gap-4 p-6 transition-all cursor-pointer hover:bg-white/5 ${
                        form.watch('permissions').includes(perm.id) 
                          ? 'bg-primary/5' 
                          : 'bg-transparent'
                      }`}
                      onClick={() => {
                        const current = form.getValues('permissions');
                        const updated = current.includes(perm.id)
                          ? current.filter(p => p !== perm.id)
                          : [...current, perm.id];
                        form.setValue('permissions', updated, { shouldValidate: true });
                      }}
                    >
                      <Checkbox 
                        id={perm.id} 
                        checked={form.watch('permissions').includes(perm.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Text variant="bodySmall" weight="bold" className={form.watch('permissions').includes(perm.id) ? 'text-primary' : ''}>
                          {perm.label}
                        </Text>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t border-white/5 p-4 flex justify-between items-center">
                <Text variant="caption" className="text-muted-foreground">Ensure least-privilege scoping.</Text>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                  onClick={() => form.setValue('permissions', ALL_PERMISSIONS.map(p => p.id))}
                >
                  Assign All Nodes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function ManageRolePage() {
  return (
    <Suspense fallback={
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse">Initializing Governance Studio...</Text>
      </div>
    }>
      <ManageRoleContent />
    </Suspense>
  );
}
