"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import businessesData from "@/lib/data/businesses";
import { Alert } from "@/components/ui/alert";

interface CreatePortalModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function CreatePortalModal({
  isOpen,
  onOpenChange,
}: CreatePortalModalProps) {
  const { toast } = useToast();
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUrl = `${window.location.origin}/portal/portal_new123`;
    setGeneratedUrl(newUrl);
    toast({
      title: "Portal Generated!",
      description: "You can now copy the shareable link.",
    });
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setHasCopied(true);
    toast({ title: "Link copied to clipboard!" });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        setGeneratedUrl("");
        setHasCopied(false);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Investor Portal</DialogTitle>
          <DialogDescription>
            Generate a secure, read-only portal to share with investors.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Shareable Link</Label>
              <div className="flex items-center gap-2">
                <Input id="share-link" value={generatedUrl} readOnly />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {hasCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              Your portal is now live. This link is active based on the expiry
              you set.
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="portal-name">Portal Name</Label>
              <Input
                id="portal-name"
                placeholder="e.g., Q4 Investor Update"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investor-name">Investor Name</Label>
              <Input
                id="investor-name"
                placeholder="e.g., General Partners"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Included Businesses</Label>
              <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                {businessesData.map((biz) => (
                  <div key={biz.id} className="flex items-center gap-2">
                    <Checkbox id={`modal_biz-${biz.id}`} defaultChecked />
                    <Label
                      htmlFor={`modal_biz-${biz.id}`}
                      className="font-normal"
                    >
                      {biz.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry</Label>
              <Select defaultValue="30">
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="modal-pin-protect" />
              <Label htmlFor="modal-pin-protect">Protect with PIN</Label>
            </div>
            <DialogFooter>
              <Button type="submit">Generate Portal</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
