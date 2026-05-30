import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Book, 
  Key, 
  Code, 
  Copy, 
  Check, 
  Terminal,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/platformClient";
import { apiEndpoints as fallbackApiEndpoints } from "@/data/mockData";

const mockApiKeys = [
  { id: 1, name: "Production Key", key: "bv_live_a8f7b2c4d9e1f3a5b7c9d2e4f6a8b0c2", created: "Jan 15, 2024", lastUsed: "2 hours ago", status: "active" },
  { id: 2, name: "Development Key", key: "bv_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6", created: "Feb 20, 2024", lastUsed: "5 days ago", status: "active" },
];

const errorCodes = [
  { code: "200", status: "OK", description: "Request successful" },
  { code: "201", status: "Created", description: "Resource created successfully" },
  { code: "400", status: "Bad Request", description: "Invalid request parameters" },
  { code: "401", status: "Unauthorized", description: "Invalid or missing API key" },
  { code: "403", status: "Forbidden", description: "Insufficient permissions" },
  { code: "404", status: "Not Found", description: "Resource not found" },
  { code: "429", status: "Too Many Requests", description: "Rate limit exceeded" },
  { code: "500", status: "Internal Server Error", description: "Server error, please retry" },
  { code: "503", status: "Service Unavailable", description: "Service temporarily unavailable" },
];

const codeExamples = {
  curl: `curl -X GET "https://api.baalvion.com/v1/proxies" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Generate proxy list
curl -X POST "https://api.baalvion.com/v1/proxies/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "residential",
    "country": "US",
    "quantity": 10,
    "protocol": "http"
  }'`,
  python: `import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.baalvion.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# List all proxies
response = requests.get(f"{BASE_URL}/proxies", headers=headers)
proxies = response.json()

# Generate proxy list
payload = {
    "type": "residential",
    "country": "US",
    "quantity": 10,
    "protocol": "http"
}

response = requests.post(
    f"{BASE_URL}/proxies/generate",
    headers=headers,
    json=payload
)
proxy_list = response.json()

# Use a proxy
proxy = proxy_list["proxies"][0]
proxies_config = {
    "http": f"http://{proxy['ip']}:{proxy['port']}",
    "https": f"http://{proxy['ip']}:{proxy['port']}"
}

response = requests.get(
    "https://example.com",
    proxies=proxies_config,
    auth=(proxy["username"], proxy["password"])
)`,
  node: `const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://api.baalvion.com/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

// List all proxies
async function listProxies() {
  const response = await client.get('/proxies');
  return response.data;
}

// Generate proxy list
async function generateProxies() {
  const response = await client.post('/proxies/generate', {
    type: 'residential',
    country: 'US',
    quantity: 10,
    protocol: 'http'
  });
  return response.data;
}

// Use a proxy with fetch
async function useProxy(proxy) {
  const HttpsProxyAgent = require('https-proxy-agent');
  const agent = new HttpsProxyAgent(
    \`http://\${proxy.username}:\${proxy.password}@\${proxy.ip}:\${proxy.port}\`
  );
  
  const response = await fetch('https://example.com', {
    agent
  });
  return response.text();
}

// Example usage
(async () => {
  const proxies = await generateProxies();
  console.log('Generated proxies:', proxies);
})();`
};

export default function DocsPage() {
  const { toast } = useToast();
  const { data: apiEndpoints = fallbackApiEndpoints } = useQuery({
    queryKey: ["public", "api-reference"],
    queryFn: () => publicApi.apiReference(),
    staleTime: 10 * 60 * 1000,
  });
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "API Key Generated",
      description: `New API key "${newKeyName}" has been created.`,
    });
    setNewKeyName("");
  };

  const toggleKeyVisibility = (id: number) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "•".repeat(32) + key.slice(-4);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <Book className="w-3 h-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to integrate Baalvion NetStack into your applications. 
              Get started with our RESTful API in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">Get API Key</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('api-keys')?.scrollIntoView({ behavior: 'smooth' })}>
                <Key className="w-4 h-4 mr-2" />
                Manage Keys
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-12 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Quick Start</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card variant="interactive" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Get Your API Key</h3>
                <p className="text-sm text-muted-foreground">Sign up and generate your API credentials</p>
              </Card>
              <Card variant="interactive" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Make Your First Request</h3>
                <p className="text-sm text-muted-foreground">Use the examples below to get started</p>
              </Card>
              <Card variant="interactive" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Scale Your Integration</h3>
                <p className="text-sm text-muted-foreground">Explore advanced features and endpoints</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-semibold mb-4">On This Page</h3>
              <a href="#api-keys" className="block text-sm text-muted-foreground hover:text-foreground py-1">
                API Keys
              </a>
              <a href="#endpoints" className="block text-sm text-muted-foreground hover:text-foreground py-1">
                Endpoints
              </a>
              <a href="#examples" className="block text-sm text-muted-foreground hover:text-foreground py-1">
                Code Examples
              </a>
              <a href="#error-codes" className="block text-sm text-muted-foreground hover:text-foreground py-1">
                Error Codes
              </a>
              <a href="#rate-limits" className="block text-sm text-muted-foreground hover:text-foreground py-1">
                Rate Limits
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* API Keys Section */}
            <section id="api-keys">
              <Card variant="default">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">API Keys</CardTitle>
                      <CardDescription>Manage your API authentication credentials</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Generate New Key */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter key name (e.g., Production)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                    <Button onClick={handleGenerateKey}>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Key
                    </Button>
                  </div>

                  {/* Existing Keys */}
                  <div className="space-y-3">
                    {mockApiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{apiKey.name}</span>
                            <Badge variant={apiKey.status === "active" ? "success" : "muted"}>
                              {apiKey.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                            >
                              {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(apiKey.key, `key-${apiKey.id}`)}
                            >
                              {copiedId === `key-${apiKey.id}` ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <code className="text-sm font-mono text-muted-foreground">
                          {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Created: {apiKey.created}</span>
                          <span>Last used: {apiKey.lastUsed}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Keep your API keys secure</p>
                      <p className="text-muted-foreground">Never share your API keys or commit them to version control. Use environment variables in production.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Endpoints Section */}
            <section id="endpoints">
              <Card variant="default">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">API Endpoints</CardTitle>
                      <CardDescription>Available endpoints and their methods</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    Base URL: <code className="px-2 py-1 rounded bg-secondary text-foreground">https://api.baalvion.com/v1</code>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="w-24">Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiEndpoints.map((endpoint, index) => (
                        <TableRow key={index} className="border-border/50">
                          <TableCell>
                            <Badge variant={
                              endpoint.method === "GET" ? "success" :
                              endpoint.method === "POST" ? "default" :
                              endpoint.method === "PUT" ? "warning" : "destructive"
                            } className="font-mono">
                              {endpoint.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                          <TableCell className="text-muted-foreground">{endpoint.description}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-border/50">
                        <TableCell>
                          <Badge variant="success" className="font-mono">GET</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">/api/v1/proxies/:id</TableCell>
                        <TableCell className="text-muted-foreground">Get proxy details by ID</TableCell>
                      </TableRow>
                      <TableRow className="border-border/50">
                        <TableCell>
                          <Badge variant="warning" className="font-mono">PUT</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">/api/v1/subusers/:id</TableCell>
                        <TableCell className="text-muted-foreground">Update sub-user settings</TableCell>
                      </TableRow>
                      <TableRow className="border-border/50">
                        <TableCell>
                          <Badge variant="success" className="font-mono">GET</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">/api/v1/health</TableCell>
                        <TableCell className="text-muted-foreground">Check API health status</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>

            {/* Code Examples Section */}
            <section id="examples">
              <Card variant="default">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Code className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Code Examples</CardTitle>
                      <CardDescription>Get started quickly with these examples</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="curl" className="gap-2">
                        <Terminal className="w-4 h-4" />
                        cURL
                      </TabsTrigger>
                      <TabsTrigger value="python" className="gap-2">
                        <Code className="w-4 h-4" />
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="node" className="gap-2">
                        <Code className="w-4 h-4" />
                        Node.js
                      </TabsTrigger>
                    </TabsList>

                    {Object.entries(codeExamples).map(([lang, code]) => (
                      <TabsContent key={lang} value={lang}>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopy(code, `code-${lang}`)}
                          >
                            {copiedId === `code-${lang}` ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <pre className="p-4 rounded-lg bg-secondary/50 border border-border/50 overflow-x-auto">
                            <code className="text-sm font-mono">{code}</code>
                          </pre>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </section>

            {/* Error Codes Section */}
            <section id="error-codes">
              <Card variant="default">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Error Codes</CardTitle>
                      <CardDescription>HTTP status codes and their meanings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="w-24">Code</TableHead>
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorCodes.map((error) => (
                        <TableRow key={error.code} className="border-border/50">
                          <TableCell>
                            <Badge variant={
                              error.code.startsWith("2") ? "success" :
                              error.code.startsWith("4") ? "warning" : "destructive"
                            } className="font-mono">
                              {error.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{error.status}</TableCell>
                          <TableCell className="text-muted-foreground">{error.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>

            {/* Rate Limits Section */}
            <section id="rate-limits">
              <Card variant="default">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Rate Limits</CardTitle>
                      <CardDescription>API request limits per plan</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Plan</TableHead>
                        <TableHead>Requests/Minute</TableHead>
                        <TableHead>Requests/Day</TableHead>
                        <TableHead>Burst Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-border/50">
                        <TableCell><Badge variant="muted">Starter</Badge></TableCell>
                        <TableCell>60</TableCell>
                        <TableCell>10,000</TableCell>
                        <TableCell>100</TableCell>
                      </TableRow>
                      <TableRow className="border-border/50">
                        <TableCell><Badge variant="success">Professional</Badge></TableCell>
                        <TableCell>300</TableCell>
                        <TableCell>100,000</TableCell>
                        <TableCell>500</TableCell>
                      </TableRow>
                      <TableRow className="border-border/50">
                        <TableCell><Badge variant="default">Enterprise</Badge></TableCell>
                        <TableCell>1,000</TableCell>
                        <TableCell>Unlimited</TableCell>
                        <TableCell>2,000</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <h4 className="font-medium mb-2">Rate Limit Headers</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Each API response includes headers to help you track your rate limit status:
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary">X-RateLimit-Limit</code>
                        <span className="text-muted-foreground">- Maximum requests per window</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary">X-RateLimit-Remaining</code>
                        <span className="text-muted-foreground">- Requests remaining in window</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary">X-RateLimit-Reset</code>
                        <span className="text-muted-foreground">- Time when the limit resets (Unix timestamp)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get your API key and start integrating Baalvion NetStack into your applications today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                <Key className="w-4 h-4 mr-2" />
                Get API Key
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
