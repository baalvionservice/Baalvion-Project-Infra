import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Upload, Loader2 } from "lucide-react";
import { z } from "zod";

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  roleTitle: z.string().trim().min(2, "Role/title is required"),
  company: z.string().trim().min(2, "Company name is required"),
  linkedinUrl: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  bio: z.string().trim().min(50, "Bio must be at least 50 characters").max(500, "Bio must be less than 500 characters"),
  reasonForJoining: z.string().trim().min(100, "Please provide at least 100 characters explaining why you want to join"),
  inviteCode: z.string().optional(),
});

export default function EliteApply() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    roleTitle: "",
    company: "",
    linkedinUrl: "",
    bio: "",
    reasonForJoining: "",
    inviteCode: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 20MB
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to apply");
        navigate("/auth");
        return;
      }

      // Validate form
      const validationResult = applicationSchema.safeParse(formData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(err => err.message);
        toast.error(errors[0]);
        return;
      }

      if (!proofFile) {
        toast.error("Please upload proof of identity or credentials");
        return;
      }

      // Upload proof file
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('elite-proofs')
        .upload(fileName, proofFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload proof file");
        return;
      }

      // Store the storage path (not a public URL).
      // Admins/owners generate signed URLs on demand when viewing.
      const proofPath = fileName;

      // Submit application
      const { error: insertError } = await supabase
        .from('elite_applications' as any)
        .insert({
          user_id: user.id,
          full_name: validationResult.data.fullName,
          email: validationResult.data.email,
          role_title: validationResult.data.roleTitle,
          company: validationResult.data.company,
          linkedin_url: validationResult.data.linkedinUrl || null,
          bio: validationResult.data.bio,
          reason_for_joining: validationResult.data.reasonForJoining,
          invite_code: validationResult.data.inviteCode || null,
          proof_url: proofPath,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error("You have already submitted an application");
        } else {
          console.error("Insert error:", insertError);
          toast.error("Failed to submit application");
        }
        return;
      }

      toast.success("Application submitted successfully!");
      navigate("/elite/status");
    } catch (error: any) {
      console.error("Application error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--elite-bg-dark))] py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="bg-[hsl(var(--elite-card-dark))] border-[hsl(var(--elite-border-gold))]">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-[hsl(var(--elite-gold))] mx-auto mb-4" />
            <CardTitle className="text-3xl text-white">Elite Membership Application</CardTitle>
            <CardDescription className="text-gray-400">
              Complete this form to apply for exclusive access. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleTitle" className="text-white">Role/Title *</Label>
                <Input
                  id="roleTitle"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({...formData, roleTitle: e.target.value})}
                  required
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="text-white">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Short Bio * (50-500 characters)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  required
                  rows={4}
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForJoining" className="text-white">Reason for Joining * (min 100 characters)</Label>
                <Textarea
                  id="reasonForJoining"
                  value={formData.reasonForJoining}
                  onChange={(e) => setFormData({...formData, reasonForJoining: e.target.value})}
                  required
                  rows={5}
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-white">Invite Code (optional)</Label>
                <Input
                  id="inviteCode"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({...formData, inviteCode: e.target.value})}
                  className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proofFile" className="text-white">Upload Proof * (PDF or Image, max 20MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="proofFile"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    required
                    className="bg-[hsl(var(--elite-bg-dark))] border-[hsl(var(--elite-border-gold))] text-white"
                  />
                  {proofFile && <Upload className="h-5 w-5 text-[hsl(var(--elite-gold))]" />}
                </div>
                <p className="text-xs text-gray-400">
                  Upload proof of your credentials, company ID, or professional verification
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold-dark))] text-black font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
