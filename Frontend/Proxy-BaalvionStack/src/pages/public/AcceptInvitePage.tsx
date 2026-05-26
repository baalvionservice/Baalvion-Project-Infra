import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authClient, InviteDetails } from "@/lib/authClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User, Zap, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  developer: "bg-accent/10 text-accent border-accent/30",
  viewer: "bg-muted text-muted-foreground",
};

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("inviteToken") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { loginWithTokens } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      setInviteError("No invitation token found. Please use the link from your email.");
      setLoadingInvite(false);
      return;
    }
    authClient.validateInvite(token)
      .then(details => { setInvite(details); setLoadingInvite(false); })
      .catch(err => { setInviteError(err.message); setLoadingInvite(false); });
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!invite) return;
    setSubmitting(true);
    try {
      const tokens = await authClient.acceptInvite(token, invite.email, data.password, data.fullName);
      loginWithTokens(tokens);
      toast({ title: "Welcome!", description: `You've joined ${invite.orgName} as ${invite.role}.` });
      navigate("/app/dashboard", { replace: true });
    } catch (err: unknown) {
      toast({
        title: "Failed to accept invitation",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">NetStack</span>
        </Link>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-display">Accept Invitation</CardTitle>
            <CardDescription>Set up your account to join the team</CardDescription>
          </CardHeader>

          <CardContent>
            {loadingInvite ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Validating invitation…
              </div>
            ) : inviteError ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="font-medium text-destructive">Invalid Invitation</p>
                <p className="text-sm text-muted-foreground">{inviteError}</p>
                <Button variant="outline" asChild className="mt-2">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            ) : invite ? (
              <>
                {/* Invite context */}
                <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You've been invited to join <strong className="text-foreground">{invite.orgName}</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <Badge variant="outline" className={roleColors[invite.role] ?? ""}>
                      {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{invite.email}</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input placeholder="Your full name" className="pl-10 bg-muted/50 border-border/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="pl-10 pr-10 bg-muted/50 border-border/50"
                                {...field}
                              />
                              <button type="button" onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat your password"
                                className="pl-10 pr-10 bg-muted/50 border-border/50"
                                {...field}
                              />
                              <button type="button" onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                      {submitting
                        ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</span>
                        : "Accept & Create Account"
                      }
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
