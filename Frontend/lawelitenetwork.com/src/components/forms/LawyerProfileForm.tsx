"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import { getLawyerProfile, updateLawyerProfile } from "@/services/lawyerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Gavel, IndianRupee, Loader2, Save, Sparkles } from "lucide-react";

/**
 * @fileOverview Lawyer Profile Form.
 * Specialized fields for practitioners in the Law Elite Network.
 */
export default function LawyerProfileForm() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      name: "",
      specialization: "",
      experience: 0,
      consultationFee: 0,
      bio: "",
      available: true,
    },
  });

  const isAvailable = watch("available");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const data = await getLawyerProfile(user.id);
        if (data) {
          reset({
            name: data.name || user.name || "",
            specialization: data.specialization || "",
            experience: data.experience || 0,
            consultationFee: data.consultationFee || 0,
            bio: data.bio || "",
            available: data.available !== undefined ? data.available : true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, reset]);

  const onSubmit = async (data: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateLawyerProfile(user.id, {
        ...data,
        id: user.id,
        email: user.email,
      });
      toast({
        title: "Chambers Updated",
        description: "Your practitioner credentials have been synchronized.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Unable to sync practitioner profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Professional Name</Label>
          <div className="relative">
            <Gavel className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input id="name" {...register("name")} className="glass-panel border-white/10 h-11 pl-10" placeholder="Harvey Specter" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Domain Specialization</Label>
          <div className="relative">
            <Sparkles className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input id="specialization" {...register("specialization")} className="glass-panel border-white/10 h-11 pl-10" placeholder="Corporate Law" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Years of Experience</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input id="experience" type="number" {...register("experience")} className="glass-panel border-white/10 h-11 pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consultationFee" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consultation Fee (INR)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input id="consultationFee" type="number" {...register("consultationFee")} className="glass-panel border-white/10 h-11 pl-10" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Bio</Label>
        <Textarea id="bio" {...register("bio")} className="glass-panel border-white/10 min-h-[120px] italic" placeholder="Summarize your career highlights and expertise..." />
      </div>

      <div className="glass-panel p-4 rounded-xl border-accent/20 bg-accent/5 flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold uppercase tracking-widest text-white">Network Availability</Label>
          <p className="text-[10px] text-muted-foreground italic">Visible to clients for immediate consultation booking.</p>
        </div>
        <Switch 
          checked={isAvailable} 
          onCheckedChange={(checked) => setValue("available", checked)}
          className="data-[state=checked]:bg-accent"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20 rounded-xl"
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {isSaving ? "SYNCHRONIZING CHAMBERS..." : "COMMIT PROFESSIONAL DOSSIER"}
      </Button>
    </form>
  );
}
