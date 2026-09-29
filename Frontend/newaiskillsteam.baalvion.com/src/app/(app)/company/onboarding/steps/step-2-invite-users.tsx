'use client';
import { useState } from 'react';
import type { OnboardingData } from '../onboarding-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus } from 'lucide-react';

interface Step2Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: Partial<OnboardingData>;
}

export function Step2InviteUsers({ onNext, data }: Step2Props) {
    const [invitedUsers, setInvitedUsers] = useState<string[]>(data.invitedUsers || []);
    const [email, setEmail] = useState('');
    
    const handleAddUser = () => {
        if (email && !invitedUsers.includes(email)) {
            setInvitedUsers([...invitedUsers, email]);
            setEmail('');
        }
    };
    
    const handleRemoveUser = (userEmail: string) => {
        setInvitedUsers(invitedUsers.filter(u => u !== userEmail));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ invitedUsers });
    }

    return (
        <form id="step-2-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2">
                <Input 
                    type="email" 
                    placeholder="colleague@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="button" onClick={handleAddUser}><UserPlus className="mr-2 h-4 w-4"/> Invite</Button>
            </div>
            <div className="space-y-2">
                <h4 className="font-medium text-sm">Invited Team Members</h4>
                {invitedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {invitedUsers.map(userEmail => (
                            <Badge key={userEmail} variant="secondary" className="text-base p-2">
                                {userEmail}
                                <button type="button" onClick={() => handleRemoveUser(userEmail)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No one invited yet. Add your team members to collaborate on hiring.</p>
                )}
            </div>
        </form>
    );
}
