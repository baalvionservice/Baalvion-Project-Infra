"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validation/authSchema";
import { authLawApi, setToken } from "@/lib/api/client";
import { updateUserProfile } from "@/services/userService";
import { applyReferral } from "@/services/referralService";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Loader2, Gift } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * @fileOverview Professional Signup Form using Mock Auth.
 * Integrated with Referral System.
 */

export default function SignupForm() {
  const { setUser, setProfile, setLoading, loading } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const referralCode = watch("referralCode");

  const parseJwt = (t: string): Record<string, any> | null => {
    try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Real registration against law-service (no mock). Sets the in-memory access token.
      const res = await authLawApi.register(data.email, data.password, data.fullName);
      const payload = res.data?.data || res.data;
      const accessToken: string = payload.accessToken;
      if (!accessToken) throw new Error(payload?.message || 'Registration failed.');
      setToken(accessToken);
      const claims = parseJwt(accessToken) || {};
      const user = {
        id: String(claims.id ?? payload.userId ?? payload.user?.id ?? ''),
        email: data.email,
        fullName: data.fullName,
        role: (claims.role ?? payload.role) as string,
      };

      // 1. Apply referral protocol if code exists
      if (data.referralCode) {
        await applyReferral(data.referralCode, user.id);
      }

      // 2. Initialize professional profile
      const initialProfile = {
        ...user,
        phone: "",
        avatar: "",
        createdAt: Date.now(),
      };
      await updateUserProfile(user.id, initialProfile);

      setUser(user);
      setProfile(initialProfile);

      toast({
        title: "Membership Provisioned",
        description: data.referralCode 
          ? "Professional profile initialized. Referral bonus pending verification."
          : "Your professional profile is being initialized.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Interrupted",
        description: error.message || "Unable to provision account.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="fullName"
            {...register("fullName")}
            placeholder="Jonathan Edwards"
            className="glass-panel border-white/10 h-11 pl-10"
          />
        </div>
        {errors.fullName && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">{errors.fullName.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Work Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="email"
            {...register("email")}
            placeholder="name@firm.com"
            className="glass-panel border-white/10 h-11 pl-10"
          />
        </div>
        {errors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">{errors.email.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className="glass-panel border-white/10 h-11 pl-10"
          />
        </div>
        {errors.password && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">{errors.password.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralCode" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Referral Protocol (Optional)</Label>
        <div className="relative">
          <Gift className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="referralCode"
            {...register("referralCode")}
            placeholder="ELITE-CODE-1234"
            className="glass-panel border-white/10 h-11 pl-10 font-mono text-xs"
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20 rounded-xl" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {loading ? "PROVISIONING..." : "SUBMIT APPLICATION"}
      </Button>
    </form>
  );
}
