
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/authSchema";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @fileOverview Executive Login Form with unified Authentication protocol.
 */
export default function LoginForm() {
  const { login, loading } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const user = await login(data.email, data.password);
      
      toast({
        title: "Access Granted",
        description: "Establishing secure uplink to your dashboard.",
      });

      // Unified role-based redirection logic
      const userRole = user?.role as string | undefined;

      if (userRole && ['admin', 'owner', 'super_admin'].includes(userRole)) {
        router.push('/admin');
      } else if (userRole === 'lawyer') {
        router.push('/lawyer/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.message || "Invalid credentials. Please verify your standing.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Email</Label>
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
        <div className="text-right pt-1">
          <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-accent/80 hover:text-accent transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20 rounded-xl" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {loading ? "AUTHENTICATING..." : "ESTABLISH CONNECTION"}
      </Button>
    </form>
  );
}
