import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, Users, ShieldCheck, Activity, Palette, Copy, Loader2, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import {
  useSso, useUpsertSso, useScimTokens, useCreateScimToken, useCustomRoles, useCreateCustomRole,
  useOrgPolicies, useSetPolicy, useSla, useWhiteLabel, useUpsertWhiteLabel,
  useWhiteLabelDomains, useAddWhiteLabelDomain, useVerifyWhiteLabelDomain,
} from "@/hooks/usePlatform";

const copy = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "Copied" }); };

export default function Enterprise() {
  const sso = useSso();
  const upsertSso = useUpsertSso();
  const { data: tokens } = useScimTokens();
  const createScim = useCreateScimToken();
  const { data: roles } = useCustomRoles();
  const createRole = useCreateCustomRole();
  const { data: policies } = useOrgPolicies();
  const setPolicy = useSetPolicy();
  const { data: sla } = useSla();
  const { data: wl } = useWhiteLabel();
  const upsertWl = useUpsertWhiteLabel();

  const [ssoForm, setSsoForm] = useState<{ type: "saml" | "oidc"; idpSsoUrl: string; idpEntityId: string; idpCert: string; oidcIssuer: string; oidcClientId: string; oidcClientSecret: string; defaultRole: string }>({
    type: "saml", idpSsoUrl: "", idpEntityId: "", idpCert: "", oidcIssuer: "", oidcClientId: "", oidcClientSecret: "", defaultRole: "viewer",
  });
  const [newScim, setNewScim] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState("proxy.sessions.read, usage.geo.read");
  const [allowlist, setAllowlist] = useState((policies?.ip_allowlist?.cidrs as string[] | undefined)?.join(", ") || "");

  return (
    <div className="space-y-6">
      <SEOHead title="Enterprise" description="SSO, SCIM, custom roles, policies, SLA and white-label." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Enterprise</h1>
        <p className="text-muted-foreground">Identity, governance and white-label controls for your organization.</p>
      </div>

      <Tabs defaultValue="sso">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sso"><ShieldCheck className="w-4 h-4 mr-1" /> SSO</TabsTrigger>
          <TabsTrigger value="scim"><Users className="w-4 h-4 mr-1" /> SCIM</TabsTrigger>
          <TabsTrigger value="roles"><KeyRound className="w-4 h-4 mr-1" /> Roles</TabsTrigger>
          <TabsTrigger value="policies"><ShieldCheck className="w-4 h-4 mr-1" /> Policies</TabsTrigger>
          <TabsTrigger value="sla"><Activity className="w-4 h-4 mr-1" /> SLA</TabsTrigger>
          <TabsTrigger value="wl"><Palette className="w-4 h-4 mr-1" /> White-label</TabsTrigger>
        </TabsList>

        {/* SSO */}
        <TabsContent value="sso">
          <Card>
            <CardHeader><CardTitle>Single Sign-On</CardTitle><CardDescription>SAML 2.0 / OIDC with Okta, Entra ID, Google, OneLogin.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {sso.data && <Badge variant={sso.data.enabled ? "success" : "secondary"}>{sso.data.type.toUpperCase()} {sso.data.enabled ? "enabled" : "disabled"}</Badge>}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1"><Label>Protocol</Label>
                  <Select value={ssoForm.type} onValueChange={(v) => setSsoForm({ ...ssoForm, type: v as "saml" | "oidc" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="saml">SAML 2.0</SelectItem><SelectItem value="oidc">OIDC</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Default role</Label>
                  <Input value={ssoForm.defaultRole} onChange={(e) => setSsoForm({ ...ssoForm, defaultRole: e.target.value })} /></div>
                {ssoForm.type === "saml" ? (
                  <>
                    <div className="space-y-1"><Label>IdP SSO URL</Label><Input value={ssoForm.idpSsoUrl} onChange={(e) => setSsoForm({ ...ssoForm, idpSsoUrl: e.target.value })} placeholder="https://idp.okta.com/app/.../sso/saml" /></div>
                    <div className="space-y-1"><Label>IdP Entity ID</Label><Input value={ssoForm.idpEntityId} onChange={(e) => setSsoForm({ ...ssoForm, idpEntityId: e.target.value })} /></div>
                    <div className="space-y-1 md:col-span-2"><Label>IdP signing certificate (PEM)</Label><Textarea rows={3} value={ssoForm.idpCert} onChange={(e) => setSsoForm({ ...ssoForm, idpCert: e.target.value })} /></div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1"><Label>OIDC Issuer</Label><Input value={ssoForm.oidcIssuer} onChange={(e) => setSsoForm({ ...ssoForm, oidcIssuer: e.target.value })} placeholder="https://login.microsoftonline.com/.../v2.0" /></div>
                    <div className="space-y-1"><Label>Client ID</Label><Input value={ssoForm.oidcClientId} onChange={(e) => setSsoForm({ ...ssoForm, oidcClientId: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Client Secret</Label><Input type="password" value={ssoForm.oidcClientSecret} onChange={(e) => setSsoForm({ ...ssoForm, oidcClientSecret: e.target.value })} placeholder="•••• (write-only)" /></div>
                  </>
                )}
              </div>
              <Button onClick={() => upsertSso.mutate(ssoForm)} disabled={upsertSso.isPending}>
                {upsertSso.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save SSO
              </Button>
              {upsertSso.data && (
                <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                  <p>ACS URL: <code className="text-xs">{upsertSso.data.acsUrl}</code> <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(upsertSso.data!.acsUrl)}><Copy className="w-3 h-3" /></Button></p>
                  <p>SP Metadata: <code className="text-xs">{upsertSso.data.metadataUrl}</code></p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCIM */}
        <TabsContent value="scim">
          <Card>
            <CardHeader><CardTitle>SCIM 2.0 Provisioning</CardTitle><CardDescription>Auto-provision/deprovision users + groups from your IdP.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={async () => { const r = await createScim.mutateAsync(); setNewScim(r.token); }} disabled={createScim.isPending}>
                {createScim.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Generate SCIM token
              </Button>
              {newScim && (
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/30">
                  <p className="text-sm font-medium text-accent">Copy now — shown once. Base URL: <code>/scim/v2</code></p>
                  <div className="flex gap-2 mt-2"><Input value={newScim} readOnly className="font-mono text-sm" /><Button size="icon" variant="outline" onClick={() => copy(newScim)}><Copy className="w-4 h-4" /></Button></div>
                </div>
              )}
              {(tokens ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <code className="text-sm">{t.token_prefix}•••</code>
                  <Badge variant={t.revoked_at ? "secondary" : "success"}>{t.revoked_at ? "revoked" : "active"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <Card>
            <CardHeader><CardTitle>Custom Roles</CardTitle><CardDescription>Granular permissions (e.g. <code>proxy.sessions.write</code>) + inheritance.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-3 items-end">
                <div className="space-y-1"><Label>Role name</Label><Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="analyst" /></div>
                <div className="space-y-1 md:col-span-2"><Label>Permissions (comma-separated)</Label><Input value={rolePerms} onChange={(e) => setRolePerms(e.target.value)} /></div>
              </div>
              <Button onClick={() => createRole.mutate({ name: roleName, permissions: rolePerms.split(",").map((s) => s.trim()).filter(Boolean) })} disabled={!roleName || createRole.isPending}>Create role</Button>
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-muted-foreground">Built-in: {(roles?.builtIn ?? []).join(", ")}</p>
                {(roles?.custom ?? []).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-secondary/30">
                    <span className="font-medium">{r.name}</span>
                    <div className="flex flex-wrap gap-1 mt-1">{r.permissions.map((p) => <Badge key={p} variant="info" className="text-xs">{p}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <Card>
            <CardHeader><CardTitle>Organization Policies</CardTitle><CardDescription>MFA, IP allowlist, geo restrictions.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div><p className="font-medium">Require MFA</p><p className="text-sm text-muted-foreground">All members must have MFA.</p></div>
                <Switch checked={!!policies?.mfa_required} onCheckedChange={(v) => setPolicy.mutate({ policyType: "mfa_required", config: {}, enabled: v })} />
              </div>
              <div className="space-y-1">
                <Label>IP allowlist (CIDRs, comma-separated)</Label>
                <div className="flex gap-2">
                  <Input value={allowlist} onChange={(e) => setAllowlist(e.target.value)} placeholder="203.0.113.0/24, 198.51.100.5" />
                  <Button variant="outline" onClick={() => setPolicy.mutate({ policyType: "ip_allowlist", config: { cidrs: allowlist.split(",").map((s) => s.trim()).filter(Boolean) } })}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA */}
        <TabsContent value="sla">
          <Card>
            <CardHeader><CardTitle>SLA</CardTitle><CardDescription>Targets + monthly attainment and service credits.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {sla?.definition && <p className="text-sm">Uptime target <b>{sla.definition.uptime_target}%</b> · latency <b>{sla.definition.latency_target_ms}ms</b> · success <b>{sla.definition.success_target}%</b></p>}
              <div className="space-y-1">
                {(sla?.periods ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-3 text-center">No SLA periods computed yet.</p> :
                  (sla?.periods ?? []).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{new Date(p.period_start).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span>uptime {p.uptime}%</span>
                        {p.violated ? <Badge variant="destructive">credit ${p.credit_amount}</Badge> : <Badge variant="success">met</Badge>}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* White-label */}
        <TabsContent value="wl">
          <Card>
            <CardHeader><CardTitle>White-label</CardTitle><CardDescription>Custom domain + branding for your portal.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <WhiteLabelForm wl={wl} onSave={(cfg) => upsertWl.mutate(cfg)} saving={upsertWl.isPending} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Custom Domains</CardTitle><CardDescription>Add a domain, verify ownership via DNS TXT, then we issue TLS.</CardDescription></CardHeader>
            <CardContent><DomainManager /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DomainManager() {
  const { data: domains } = useWhiteLabelDomains();
  const addDomain = useAddWhiteLabelDomain();
  const verifyDomain = useVerifyWhiteLabelDomain();
  const [domain, setDomain] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="proxy.customer-company.com" />
        <Button disabled={addDomain.isPending || !domain} onClick={() => { addDomain.mutate(domain); setDomain(""); }}>Add domain</Button>
      </div>
      <div className="space-y-2">
        {(domains ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-2">No custom domains yet.</p> :
          (domains ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
              <code className="font-mono text-xs">{d.domain}</code>
              <div className="flex items-center gap-2">
                <Badge variant={d.verified ? "success" : "warning"}>{d.verified ? "verified" : "pending"}</Badge>
                <Badge variant={d.cert_status === "issued" ? "success" : "secondary"}>TLS {d.cert_status}</Badge>
                {!d.verified && <Button size="sm" variant="ghost" onClick={() => verifyDomain.mutate(d.id)}>Verify</Button>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function WhiteLabelForm({ wl, onSave, saving }: { wl: any; onSave: (c: Record<string, unknown>) => void; saving: boolean }) {
  const [f, setF] = useState({ domain: wl?.domain || "", brandName: wl?.brand_name || "", primaryColor: wl?.primary_color || "#6d28d9", supportEmail: wl?.support_email || "", enabled: wl?.enabled ?? false });
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1"><Label>Custom domain</Label><Input value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="proxy.customer-company.com" /></div>
        <div className="space-y-1"><Label>Brand name</Label><Input value={f.brandName} onChange={(e) => setF({ ...f, brandName: e.target.value })} /></div>
        <div className="space-y-1"><Label>Primary color</Label><Input value={f.primaryColor} onChange={(e) => setF({ ...f, primaryColor: e.target.value })} /></div>
        <div className="space-y-1"><Label>Support email</Label><Input value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} /></div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} /><span className="text-sm">Enabled</span>
      </div>
      <Button onClick={() => onSave(f)} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save branding</Button>
    </>
  );
}
