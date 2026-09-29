
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Save,
  Languages,
  Ruler,
  Search,
  Trash2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";

const settingsSchema = z.object({
  language: z.string(),
  dateFormat: z.string(),
  autoDetectLocale: z.boolean(),
  unitSystem: z.string(),
  referenceCurrency: z.string(),
  highPrecisionGrades: z.boolean(),
  companyName: z.string().min(2, "Company name required"),
});

export default function UserSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: "en",
      dateFormat: "yyyy-mm-dd",
      autoDetectLocale: true,
      unitSystem: "metric",
      referenceCurrency: "usd",
      highPrecisionGrades: false,
      companyName: "Global Mining Inc.",
    },
  });

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    setIsSaving(true);
    // API ENDPOINT: PATCH /api/user/settings
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    toast({ title: "Preferences Saved", description: "Global trade and localization settings synchronized." });
  };

  const savedSearches = [
    { id: 1, name: "Iron Ore South America", category: "Products", query: "62% Fe", alert: true },
    { id: 2, name: "Lithium Suppliers AU", category: "Suppliers", query: "Lithium Spodumene", alert: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your identity, security, and global trade preferences.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="bg-secondary text-secondary-foreground font-bold gap-2 px-8 h-11 shadow-sm">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <Tabs defaultValue="localization" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 h-auto gap-1">
              <TabsTrigger value="profile" className="px-6 py-2">Profile</TabsTrigger>
              <TabsTrigger value="localization" className="px-6 py-2">Localization</TabsTrigger>
              <TabsTrigger value="saved-searches" className="px-6 py-2">Saved Searches</TabsTrigger>
              <TabsTrigger value="security" className="px-6 py-2">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="localization" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Languages className="h-5 w-5 text-primary" />
                      Language & Region
                    </CardTitle>
                    <CardDescription>Customize how the platform appears to your team.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English (US/UK)</SelectItem>
                              <SelectItem value="zh">中文 (Chinese)</SelectItem>
                              <SelectItem value="ar">العربية (Arabic)</SelectItem>
                              <SelectItem value="es">Español (Spanish)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Changes labels and navigation across the app.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoDetectLocale"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Detect Locale</FormLabel>
                            <FormDescription>Sync based on browser settings.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-secondary" />
                      Trade Standards
                    </CardTitle>
                    <CardDescription>Define units and currency for your dashboards.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="unitSystem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Unit System</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="metric">Metric (MT, kg, m)</SelectItem>
                              <SelectItem value="imperial">Imperial (Tons, lbs, ft)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referenceCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="usd">USD - US Dollar</SelectItem>
                              <SelectItem value="eur">EUR - Euro</SelectItem>
                              <SelectItem value="aed">AED - UAE Dirham</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Business Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved-searches" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {savedSearches.map((s) => (
                    <Card key={s.id} className="border-none shadow-sm group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Search className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{s.name}</h4>
                            <p className="text-xs text-slate-500">Filter: {s.query}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
