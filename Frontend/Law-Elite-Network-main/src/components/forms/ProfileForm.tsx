"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import { updateUserProfile } from "@/services/user/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Save, User, Phone } from "lucide-react";

interface ProfileFormProps {
  onUpdate?: () => void;
}

/**
 * @fileOverview Executive Profile Form.
 * Handles credential updates and profile synchronization across the service layer.
 */
export default function ProfileForm({ onUpdate }: ProfileFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Initialize form with existing profile data
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        phone: (user as any).phone || "",
        profileImage: (user as any).profileImage || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.id, data);
      toast({
        title: "Dossier Updated",
        description: "Your professional credentials have been synchronized with the network.",
      });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Unable to sync profile changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const simulateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Simulation of a professional portrait uplink
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockImageUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;
      
      await updateUserProfile(user.id, { profileImage: mockImageUrl });
      
      toast({
        title: "Identity Verified",
        description: "Professional portrait updated successfully.",
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uplink Error",
        description: "Could not process professional image file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Professional Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input
              id="name"
              {...register("name", { required: "Professional name is required" })}
              placeholder="e.g., Harvey Specter"
              className="glass-panel border-white/10 h-11 pl-10 text-white"
            />
          </div>
          {errors.name && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure Contact Line</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 000-0000"
              className="glass-panel border-white/10 h-11 pl-10 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dossier Portrait</Label>
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              id="avatar-upload" 
              className="hidden" 
              accept="image/*"
              onChange={simulateImageUpload}
              disabled={isUploading}
            />
            <Label 
              htmlFor="avatar-upload" 
              className="flex items-center justify-center w-full h-11 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sync New Portrait</span>
                </>
              )}
            </Label>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <Button 
          type="submit" 
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20 rounded-xl transition-all active:scale-[0.98]"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? "SYNCHRONIZING..." : "COMMIT CREDENTIALS"}
        </Button>
      </div>
    </form>
  );
}
