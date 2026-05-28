import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Clock, CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";

type Application = {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  moderator_notes: string | null;
};

export default function EliteStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('elite_applications' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load application status");
        return;
      }

      setApplication(data as unknown as Application | null);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return "Your application is under review by our moderation team. This typically takes 2-5 business days.";
      case 'approved':
        return "Congratulations! Your application has been approved. You now have access to all elite features.";
      case 'rejected':
        return "Unfortunately, your application was not approved at this time. You may reapply in 30 days.";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--elite-bg-dark))] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-[hsl(var(--elite-gold))] animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-[hsl(var(--elite-bg-dark))] py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card className="bg-[hsl(var(--elite-card-dark))] border-[hsl(var(--elite-border-gold))] text-center">
            <CardHeader>
              <Crown className="h-16 w-16 text-[hsl(var(--elite-gold))] mx-auto mb-4" />
              <CardTitle className="text-3xl text-white">No Application Found</CardTitle>
              <CardDescription className="text-gray-400">
                You haven't submitted an application yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/elite/apply")}
                className="bg-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold-dark))] text-black font-semibold"
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--elite-bg-dark))] py-12 px-4">
      <div className="container max-w-3xl mx-auto space-y-6">
        {/* Status Card */}
        <Card className="bg-[hsl(var(--elite-card-dark))] border-[hsl(var(--elite-border-gold))]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon(application.status)}
            </div>
            <CardTitle className="text-3xl text-white">Your Application Status</CardTitle>
            <div className="flex justify-center mt-4">
              {getStatusBadge(application.status)}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-[hsl(var(--elite-bg-dark))] p-6 rounded-lg border border-[hsl(var(--elite-border-gold))]">
              <p className="text-gray-300 text-center mb-4">
                {getStatusMessage(application.status)}
              </p>
              
              {application.moderator_notes && (
                <div className="mt-4 p-4 bg-[hsl(var(--elite-card-dark))] rounded border border-[hsl(var(--elite-gold))]/30">
                  <p className="text-sm font-semibold text-[hsl(var(--elite-gold))] mb-2">
                    Moderator Notes:
                  </p>
                  <p className="text-gray-300 text-sm">{application.moderator_notes}</p>
                </div>
              )}
            </div>

            {/* Application Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[hsl(var(--elite-border-gold))]/30 pb-2">
                <span className="text-gray-400">Full Name:</span>
                <span className="text-white">{application.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-[hsl(var(--elite-border-gold))]/30 pb-2">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{application.email}</span>
              </div>
              <div className="flex justify-between border-b border-[hsl(var(--elite-border-gold))]/30 pb-2">
                <span className="text-gray-400">Role:</span>
                <span className="text-white">{application.role_title}</span>
              </div>
              <div className="flex justify-between border-b border-[hsl(var(--elite-border-gold))]/30 pb-2">
                <span className="text-gray-400">Company:</span>
                <span className="text-white">{application.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Submitted:</span>
                <span className="text-white">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {application.status === 'approved' && (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold-dark))] text-black font-semibold"
                >
                  Access Dashboard
                </Button>
              )}
              
              {application.status === 'pending' && (
                <Button
                  onClick={() => navigate("/elite/apply")}
                  variant="outline"
                  className="flex-1 border-[hsl(var(--elite-border-gold))] text-[hsl(var(--elite-gold))] hover:bg-[hsl(var(--elite-gold))]/10"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Update Documents
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
