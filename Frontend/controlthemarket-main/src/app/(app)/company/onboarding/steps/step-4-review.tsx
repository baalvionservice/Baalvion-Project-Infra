'use client';

import type { OnboardingData } from '../onboarding-flow';
import { Button } from '@/components/ui/button';

interface Step4Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: OnboardingData;
}

export function Step4Review({ onNext, data }: Step4Props) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({}); // Final step submission
  }

  return (
    <form id="step-4-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 rounded-md border p-4">
        <h3 className="font-semibold">Company Details</h3>
        <p><span className="font-medium text-muted-foreground">Name:</span> {data.companyName}</p>
        <p><span className="font-medium text-muted-foreground">Website:</span> {data.companyWebsite}</p>
        <p><span className="font-medium text-muted-foreground">Country:</span> {data.country}</p>
        <p><span className="font-medium text-muted-foreground">Description:</span> {data.companyDescription}</p>
      </div>

       <div className="space-y-2 rounded-md border p-4">
        <h3 className="font-semibold">Verification Documents</h3>
        {data.documents && Object.keys(data.documents).length > 0 ? (
             <ul className="list-disc pl-5 text-muted-foreground">
                {Object.values(data.documents).map((file) => file && <li key={file.name}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>)}
            </ul>
        ) : (
            <p className="text-muted-foreground">No documents were uploaded.</p>
        )}
      </div>

       <div className="space-y-2 rounded-md border p-4">
        <h3 className="font-semibold">Invited Team Members</h3>
        {data.invitedUsers.length > 0 ? (
             <ul className="list-disc pl-5 text-muted-foreground">
                {data.invitedUsers.map(email => <li key={email}>{email}</li>)}
            </ul>
        ) : (
            <p className="text-muted-foreground">No team members were invited.</p>
        )}
      </div>

       <div className="space-y-2 rounded-md border p-4">
        <h3 className="font-semibold">First Task</h3>
        <p><span className="font-medium text-muted-foreground">Title:</span> {data.taskTitle}</p>
        <p className="text-muted-foreground whitespace-pre-wrap"><span className="font-medium text-muted-foreground">Description:</span> {data.taskDescription}</p>
      </div>
    </form>
  );
}
