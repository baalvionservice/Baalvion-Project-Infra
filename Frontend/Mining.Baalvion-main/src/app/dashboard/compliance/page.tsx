
"use client"

import { useState } from "react";
import { verifyComplianceDocuments, type VerifyComplianceDocumentsOutput } from "@/ai/flows/verify-compliance-documents-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, ShieldCheck, CheckCircle2, XCircle, Info, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const complianceSchema = z.object({
  documentType: z.enum(['mining_license', 'product_certification', 'quality_report'], {
    required_error: "Please select a document type",
  }),
});

export default function ComplianceHub() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyComplianceDocumentsOutput | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);

  const form = useForm<z.infer<typeof complianceSchema>>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      documentType: "mining_license",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum size is 10MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof complianceSchema>) => {
    if (!fileData) {
      toast({
        title: "No document selected",
        description: "Please upload a document to verify.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // API ENDPOINT: POST /api/compliance/verify
      const res = await verifyComplianceDocuments({
        documentDataUri: fileData,
        documentType: values.documentType
      });
      setResult(res);
      toast({ title: "Analysis Complete", description: res.isCompliant ? "Document verified." : "Compliance flags detected." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Verification Failed",
        description: "An error occurred during AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Compliance Hub</h1>
        <p className="text-muted-foreground mt-1">AI-powered verification of regulatory documents.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mining_license">Mining License</SelectItem>
                            <SelectItem value="product_certification">Product Certification</SelectItem>
                            <SelectItem value="quality_report">Quality Inspection Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>File Selection</Label>
                    <div 
                      className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer relative"
                      onClick={() => document.getElementById('file-input')?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
                      aria-label="Upload document file"
                    >
                      <input 
                        id="file-input" 
                        type="file" 
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                      {fileData ? (
                        <div className="space-y-2">
                          <FileText className="h-10 w-10 text-primary mx-auto" />
                          <p className="text-sm font-medium">Document Ready</p>
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={(e) => {
                            e.stopPropagation();
                            setFileData(null);
                          }}>Change File</Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Click to upload</p>
                          <p className="text-[10px] text-muted-foreground/60 uppercase">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 h-11 font-bold"
                    disabled={loading || !fileData}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Run AI Verification
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Privacy Note</AlertTitle>
            <AlertDescription className="text-xs">
              All documents are encrypted and analyzed using secure AI models compliant with global data protection standards (GDPR/CCPA).
            </AlertDescription>
          </Alert>
        </div>

        <div className="lg:col-span-2">
          {!result ? (
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-12 bg-card rounded-xl border-2 border-dashed border-muted">
              <div className="bg-muted p-5 rounded-full mb-6">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary uppercase tracking-tight">Pending Analysis</h3>
              <p className="text-muted-foreground max-w-sm mt-2 leading-relaxed">
                Upload a document to begin the automated compliance check. AI will extract key details and verify authenticity against regional standards.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className={cn(
                "border-none shadow-sm border-l-8",
                result.isCompliant ? "border-l-emerald-500" : "border-l-rose-500"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.isCompliant ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-rose-500" />
                      )}
                      <div>
                        <CardTitle className="text-2xl font-bold">
                          {result.isCompliant ? "Compliant" : "Non-Compliant"}
                        </CardTitle>
                        <CardDescription>
                          AI Confidence Score: <span className="font-bold text-primary">{result.confidenceScore}%</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold border-slate-200">Export Report</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-sm font-bold text-primary mb-2 uppercase tracking-widest text-[10px]">Reasoning & Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {result.complianceReasoning}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg space-y-3 bg-white">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Extracted Metadata</h4>
                      <div className="space-y-2">
                        {Object.entries(result.extractedDetails).map(([key, val]) => (
                          val && (
                            <div key={key} className="flex justify-between text-xs py-1 border-b last:border-none">
                              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-bold text-primary">{val as string}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-emerald-50/30 border-emerald-100">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-3">Integrity Benchmarks</h4>
                      <ul className="space-y-2">
                        {[
                          "Authority Signature Valid",
                          "Registry Match Confirmed",
                          "No Metadata Tampering",
                          "Active License Window"
                        ].map((check, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
