import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Code, Terminal, BookOpen, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useDeleteApiKey } from "@/hooks/usePlatform";
import type { ApiKeyCreated } from "@/lib/platformClient";

const codeExamples = {
  curl: `curl -X GET "http://localhost:4000/v1/proxies" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Org-Id: org_demo" \\
  -H "Content-Type: application/json"`,
  python: `import requests

api_key = "YOUR_API_KEY"
headers = {
    "Authorization": f"Bearer {api_key}",
    "X-Org-Id": "org_demo",
    "Content-Type": "application/json"
}

response = requests.get(
    "http://localhost:4000/v1/proxies",
    headers=headers
)
print(response.json())`,
  node: `const response = await fetch('http://localhost:4000/v1/proxies', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'X-Org-Id': 'org_demo',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);`,
};

const API_DOCS = [
  { method: "GET", endpoint: "/v1/proxies", description: "List all proxies" },
  { method: "POST", endpoint: "/v1/proxies", description: "Create a new proxy" },
  { method: "GET", endpoint: "/v1/proxies/:id", description: "Get proxy details" },
  { method: "POST", endpoint: "/v1/proxies/:id/rotate", description: "Rotate proxy IP" },
  { method: "GET", endpoint: "/v1/presets", description: "List proxy presets" },
  { method: "POST", endpoint: "/v1/presets", description: "Create preset" },
  { method: "GET", endpoint: "/v1/billing/subscription", description: "Get subscription" },
  { method: "GET", endpoint: "/v1/billing/invoices", description: "List invoices" },
  { method: "GET", endpoint: "/v1/usage/summary", description: "Usage summary" },
  { method: "GET", endpoint: "/v1/analytics/bandwidth", description: "Bandwidth analytics" },
];

export default function ApiKeys() {
  const { data: apiKeys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const deleteKey = useDeleteApiKey();

  const [showKey, setShowKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("curl");
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreated, setNewlyCreated] = useState<ApiKeyCreated | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    const result = await createKey.mutateAsync({ name: newKeyName.trim() });
    setNewlyCreated(result);
    setNewKeyName("");
    setCreateOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const activeKeys = apiKeys?.filter(k => !k.revokedAt) ?? [];
  const revokedKeys = apiKeys?.filter(k => k.revokedAt) ?? [];

  return (
    <div className="space-y-6">
      <SEOHead title="API Keys & Documentation" description="Manage your API keys and explore the Baalvion API reference." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys & Documentation</h1>
          <p className="text-muted-foreground">Manage API keys and explore the API reference.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Generate New Key
        </Button>
      </div>

      {/* Newly created key banner */}
      {newlyCreated && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-accent">Copy your new key now — it won't be shown again</p>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={newlyCreated.rawKey} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={() => handleCopy(newlyCreated.rawKey)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNewlyCreated(null)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Active API Keys
          </CardTitle>
          <CardDescription>Keys used to authenticate API requests. Keep them secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading keys...
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No active API keys. Generate one to get started.</p>
            </div>
          ) : (
            activeKeys.map((k) => (
              <div key={k.id} className="p-4 rounded-xl bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{k.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={showKey === k.id ? k.keyPrefix + "•".repeat(28) : "•".repeat(40)}
                    readOnly
                    className="font-mono text-sm bg-secondary/50"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowKey(showKey === k.id ? null : k.id)}>
                    {showKey === k.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(k.keyPrefix)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Revoke" onClick={() => setConfirmRevoke(k.id)}
                    className="text-warning hover:text-warning">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(k.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {revokedKeys.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Revoked ({revokedKeys.length})</p>
              {revokedKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 opacity-60">
                  <div>
                    <span className="text-sm font-medium line-through">{k.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Revoked {new Date(k.revokedAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7"
                    onClick={() => setConfirmDelete(k.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Docs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {API_DOCS.map((ep) => (
              <div key={ep.endpoint}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Badge variant={ep.method === "GET" ? "info" : ep.method === "POST" ? "success" : "destructive"}
                    className="w-16 justify-center text-xs">{ep.method}</Badge>
                  <code className="text-sm font-mono">{ep.endpoint}</code>
                </div>
                <span className="text-sm text-muted-foreground">{ep.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" /> Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="curl"><Terminal className="w-4 h-4 mr-1" />cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
            </TabsList>
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-background overflow-x-auto text-sm border border-border/50">
                    <code>{code}</code>
                  </pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2"
                    onClick={() => handleCopy(code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input placeholder="e.g. Production Key" value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newKeyName.trim() || createKey.isPending}>
              {createKey.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!confirmRevoke} onOpenChange={() => setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>This key will stop working immediately. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => { revokeKey.mutate(confirmRevoke!); setConfirmRevoke(null); }}>
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this key record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground"
              onClick={() => { deleteKey.mutate(confirmDelete!); setConfirmDelete(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
