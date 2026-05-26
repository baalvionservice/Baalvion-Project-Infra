'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branding: {
    primary: string;
    accent: string;
    platformName: string;
  };
  emailSettings: {
    senderName: string;
    senderEmail: string;
    footer: string;
  };
}

export default function EmailPreviewModal({ isOpen, onOpenChange, branding, emailSettings }: EmailPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>This is a preview of the welcome email sent to new users.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="max-w-full mx-auto bg-white dark:bg-black p-8 rounded-md shadow-md">
                 {/* Email Header */}
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: branding.primary }}>{branding.platformName}</h1>
                </header>

                {/* Email Body */}
                <main>
                    <h2 className="text-2xl font-semibold mb-4">Welcome Aboard!</h2>
                    <p className="text-muted-foreground mb-6">We're thrilled to have you join the {branding.platformName} family. To get started, please click the button below to verify your email address and set up your account.</p>
                    <div className="text-center">
                        <Button style={{ backgroundColor: branding.accent }}>Verify Your Email</Button>
                    </div>
                     <p className="text-muted-foreground mt-6 text-sm">If you did not sign up for this account, you can safely ignore this email.</p>
                </main>

                 {/* Email Footer */}
                <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>From: {emailSettings.senderName} &lt;{emailSettings.senderEmail}&gt;</p>
                    <p className="mt-2">{emailSettings.footer}</p>
                </footer>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
