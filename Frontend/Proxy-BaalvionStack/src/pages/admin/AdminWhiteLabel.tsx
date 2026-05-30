import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, Globe, Upload, Mail, Save, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { enterpriseApi } from "@/lib/platformClient";

export default function AdminWhiteLabel() {
  const [config, setConfig] = useState({
    companyName: "Baalvion",
    productName: "NetStack",
    primaryColor: "#0ea5e9",
    accentColor: "#22c55e",
    domain: "app.baalvion.com",
    logoUrl: "",
    supportEmail: "support@baalvion.com",
    senderName: "Baalvion NetStack",
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate from the persisted org white-label config.
  useEffect(() => {
    enterpriseApi.getWhiteLabel().then((wl) => {
      if (!wl) return;
      setConfig((c) => ({
        ...c,
        companyName: wl.brand_name ?? c.companyName,
        primaryColor: wl.primary_color ?? c.primaryColor,
        domain: wl.domain ?? c.domain,
        logoUrl: wl.logo_url ?? c.logoUrl,
        supportEmail: wl.support_email ?? c.supportEmail,
      }));
    }).catch(() => { /* none configured yet */ });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await enterpriseApi.upsertWhiteLabel({
        brandName: config.companyName,
        primaryColor: config.primaryColor,
        logoUrl: config.logoUrl,
        supportEmail: config.supportEmail,
        domain: config.domain,
        enabled: true,
      });
      toast.success("White-label configuration saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEOHead title="White Label Settings" description="Configure white-label branding for your platform." />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Paintbrush className="w-6 h-6 text-primary" />White-Label Settings</h1>
          <p className="text-muted-foreground">Customize the platform appearance for your brand.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}><Eye className="w-4 h-4 mr-1" />{previewMode ? "Edit" : "Preview"}</Button>
          <Button variant="hero" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Saving…" : "Save Configuration"}</Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview */
        <Card variant="glow">
          <CardHeader><CardTitle>Brand Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="p-6 rounded-xl border border-border bg-background space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: config.primaryColor + "20" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">{config.companyName}</p>
                  <p className="text-sm text-muted-foreground">{config.productName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button style={{ backgroundColor: config.primaryColor, color: "white" }}>Primary Action</Button>
                <Button variant="outline" style={{ borderColor: config.accentColor, color: config.accentColor }}>Secondary</Button>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 text-sm">
                <p><strong>Domain:</strong> {config.domain}</p>
                <p><strong>Support:</strong> {config.supportEmail}</p>
                <p><strong>Sender:</strong> {config.senderName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Paintbrush className="w-5 h-5 text-primary" />Branding</CardTitle>
              <CardDescription>Set your brand identity across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={config.companyName} onChange={e => setConfig({ ...config, companyName: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={config.productName} onChange={e => setConfig({ ...config, productName: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.primaryColor} onChange={e => setConfig({ ...config, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                    <Input value={config.primaryColor} onChange={e => setConfig({ ...config, primaryColor: e.target.value })} className="bg-secondary/50 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.accentColor} onChange={e => setConfig({ ...config, accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                    <Input value={config.accentColor} onChange={e => setConfig({ ...config, accentColor: e.target.value })} className="bg-secondary/50 font-mono" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo Upload</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click or drag to upload logo</p>
                  <p className="text-xs text-muted-foreground mt-1">SVG, PNG or JPEG (max 2MB)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain & Email */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />Custom Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input value={config.domain} onChange={e => setConfig({ ...config, domain: e.target.value })} className="bg-secondary/50 font-mono" placeholder="app.yourdomain.com" />
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                  <p className="text-warning font-medium">DNS Configuration Required</p>
                  <p className="text-xs text-muted-foreground mt-1">Add a CNAME record pointing to <code className="font-mono">proxy.baalvion.com</code></p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-primary" />Email Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input value={config.supportEmail} onChange={e => setConfig({ ...config, supportEmail: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Sender Name</Label>
                  <Input value={config.senderName} onChange={e => setConfig({ ...config, senderName: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <p className="text-sm font-medium mb-2">Email Preview</p>
                  <div className="p-3 rounded bg-background border border-border text-sm">
                    <p className="text-muted-foreground">From: <strong>{config.senderName}</strong> &lt;noreply@{config.domain}&gt;</p>
                    <p className="text-muted-foreground mt-1">Subject: Welcome to {config.companyName} {config.productName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
