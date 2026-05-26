
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';

const consentText = `
1. Candidate / Contributor retains full IP rights.
2. Platform may collect name, email, usage, payment.
3. Data is stored for at least 12 months.
4. User rights: access, correction, output (no deletion).
5. Work may be used commercially by companies.
6. Revenue sharing: 50% platform, 50% contributor.
7. Contributors must follow professional standards.
8. Work submitted is production-level code.
9. Participation is voluntary.
10. Legal and compliance terms apply.
11. Platform may display, host, and feature Work.
12. Feedback, evaluation, and contests may be conducted.
13. Contributors are responsible for Work originality.
14. Contributors indemnify platform against claims.
15. Platform may update terms, require re-consent.
16. Work may be used for testing, production, or marketing.
17. Contributors must label confidential information clearly.
18. Platform is not liable for misuse by third parties.
19. Contributors acknowledge risks of data exposure and evaluation.
20. Platform will store consent timestamp for auditing.
21. Contributors must accept all responsibilities and revenue-sharing policies.
22. Submission of Work constitutes full agreement.
23. Participation is voluntary; withdrawal from creating new Work is allowed.
24. Platform may terminate or suspend access for violation of terms.
25. Dashboard access is blocked until consent is accepted.
`.repeat(5); // Repeat to make it scrollable

export function ConsentModal() {
  const { acceptConsent } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 5) { // 5px buffer
      setIsScrolled(true);
    }
  };

  const handleAccept = () => {
    if (isChecked && isScrolled) {
      acceptConsent();
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-3xl" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-2xl">SkillMatch Pro Candidate Consent & Agreement</DialogTitle>
          <DialogDescription>
            Please read and accept the terms to proceed.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4" onScroll={handleScroll}>
            <pre className="text-xs whitespace-pre-wrap font-sans">{consentText}</pre>
        </ScrollArea>
        <div className="flex items-center space-x-2">
            <Checkbox 
                id="terms" 
                checked={isChecked} 
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                disabled={!isScrolled}
            />
            <Label htmlFor="terms" className={!isScrolled ? 'text-muted-foreground' : ''}>
                I have read and agree to all terms
            </Label>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleAccept}
            disabled={!isChecked || !isScrolled}
          >
            Accept & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
