"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { kycAmlSchema } from "@/lib/schemas";
import { UploadCloud, FileCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type KycAmlStepProps = {
  onNext: (data: z.infer<typeof kycAmlSchema>) => void;
  onBack: () => void;
};

export default function KycAmlStep({ onNext, onBack }: KycAmlStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof kycAmlSchema>>({
    resolver: zodResolver(kycAmlSchema),
    defaultValues: {
      document: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof kycAmlSchema>) {
    setIsProcessing(true);
    // Placeholder for AI processing of the document
    setTimeout(() => {
        toast({
            title: "AI Analysis Complete",
            description: "Document passed initial screening.",
        });
        setIsProcessing(false);
        onNext(values);
    }, 2000);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      form.setValue("document", file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center">
            <h3 className="text-lg font-semibold">KYC / AML Verification</h3>
            <p className="text-sm text-muted-foreground">
            Please upload a government-issued photo ID.
            </p>
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identification Document</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,application/pdf"
                            disabled={isProcessing}
                        />
                        <div className={cn(
                            "flex flex-col items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none",
                            form.formState.errors.document && "border-destructive"
                        )}>
                            {fileName ? (
                                <>
                                    <FileCheck className="w-8 h-8 text-green-500" />
                                    <span className="font-medium text-foreground mt-2 truncate max-w-full">{fileName}</span>
                                    <span className="text-xs text-muted-foreground">Click or drag to replace</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground mt-2">Click or drag file to upload</span>
                                    <span className="text-xs text-muted-foreground">PDF, PNG, JPG</span>
                                </>
                            )}
                        </div>
                    </div>
                </FormControl>
                <FormDescription>
                  Your document will be securely processed by our AI for verification.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
            Back
          </Button>
          <Button type="submit" disabled={!form.formState.isValid || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Processing..." : "Continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
