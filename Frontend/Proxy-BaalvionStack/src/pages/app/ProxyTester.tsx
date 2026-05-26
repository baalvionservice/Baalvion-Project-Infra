import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Globe, Clock, MapPin, Server, Play, Loader2, AlertCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useTestProxy } from "@/hooks/usePlatform";
import { ProxyTestResult } from "@/lib/platformClient";

const COUNTRIES = ["US", "UK", "DE", "JP", "BR", "AU", "CA", "FR", "IN", "SG"];

export default function ProxyTester() {
  const [url, setUrl] = useState("https://httpbin.org/ip");
  const [proxyType, setProxyType] = useState("residential");
  const [country, setCountry] = useState("US");
  const [result, setResult] = useState<ProxyTestResult | null>(null);

  const testProxy = useTestProxy();

  const sendRequest = async () => {
    setResult(null);
    try {
      const res = await testProxy.mutateAsync({ url, type: proxyType, country });
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setResult({ success: false, error: msg });
    }
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Proxy Tester" description="Test proxy requests interactively." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" /> Proxy Request Tester
        </h1>
        <p className="text-muted-foreground">Send a real request through your proxy network and inspect the response.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Target URL</label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-secondary/50 font-mono"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Proxy Type</label>
              <Select value={proxyType} onValueChange={setProxyType}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="datacenter">Datacenter</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={sendRequest} disabled={testProxy.isPending || !url.trim()} className="w-full">
                {testProxy.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  : <><Play className="w-4 h-4 mr-2" /> Send Request</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Response Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Server className="w-4 h-4" /> Status
                </span>
                {result.success
                  ? <Badge variant="success">{result.statusCode ?? 200} OK</Badge>
                  : <Badge variant="destructive">Failed</Badge>}
              </div>

              {result.ip && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Proxy IP
                  </span>
                  <span className="font-mono text-sm">{result.ip}</span>
                </div>
              )}

              {result.location && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location
                  </span>
                  <span className="text-sm">{result.location}</span>
                </div>
              )}

              {result.latency != null && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Latency
                  </span>
                  <Badge variant={result.latency < 200 ? "success" : result.latency < 400 ? "warning" : "destructive"}>
                    {result.latency}ms
                  </Badge>
                </div>
              )}

              {result.error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {result.headers && Object.keys(result.headers).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Response Headers</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm font-mono p-2 rounded bg-secondary/20">
                      <span className="text-primary">{k}:</span>
                      <span className="text-muted-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
