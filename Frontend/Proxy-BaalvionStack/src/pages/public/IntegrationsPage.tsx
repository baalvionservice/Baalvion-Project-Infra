import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Terminal, Webhook, Puzzle, ArrowRight, Copy } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const integrations = [
  { name: "Puppeteer", category: "browser", description: "Headless Chrome automation with proxy support", badge: "Popular", code: `const browser = await puppeteer.launch({\n  args: ['--proxy-server=http://proxy.baalvion.com:8080']\n});\nconst page = await browser.newPage();\nawait page.authenticate({\n  username: 'user',\n  password: 'API_KEY'\n});` },
  { name: "Playwright", category: "browser", description: "Cross-browser automation framework", badge: "Popular", code: `const browser = await chromium.launch({\n  proxy: {\n    server: 'http://proxy.baalvion.com:8080',\n    username: 'user',\n    password: 'API_KEY'\n  }\n});` },
  { name: "Selenium", category: "browser", description: "Classic browser automation with WebDriver", badge: "", code: `from selenium.webdriver.common.proxy import Proxy\nproxy = Proxy({\n  'httpProxy': 'user:API_KEY@proxy.baalvion.com:8080',\n  'sslProxy': 'user:API_KEY@proxy.baalvion.com:8080'\n})` },
  { name: "Scrapy", category: "scraping", description: "Python web scraping framework", badge: "", code: `# settings.py\nDOWNLOADER_MIDDLEWARES = {\n  'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 1\n}\nHTTP_PROXY = 'http://user:API_KEY@proxy.baalvion.com:8080'` },
  { name: "Zapier", category: "automation", description: "Connect apps and automate workflows", badge: "New", code: `// Webhook trigger\n{\n  "url": "https://api.baalvion.com/v1/proxy/create",\n  "method": "POST",\n  "headers": { "Authorization": "Bearer API_KEY" }\n}` },
  { name: "Webhooks", category: "automation", description: "Real-time event notifications", badge: "", code: `// Configure webhook endpoint\nPOST /api/v1/webhooks\n{\n  "url": "https://your-app.com/webhook",\n  "events": ["proxy.created", "usage.threshold"]\n}` },
  { name: "Node.js SDK", category: "sdk", description: "Official Node.js client library", badge: "Official", code: `import { BaalvionClient } from '@baalvion/sdk';\n\nconst client = new BaalvionClient({\n  apiKey: process.env.BAALVION_API_KEY\n});\n\nconst proxy = await client.proxies.create({\n  type: 'residential',\n  country: 'US'\n});` },
  { name: "Python SDK", category: "sdk", description: "Official Python client library", badge: "Official", code: `from baalvion import Client\n\nclient = Client(api_key="YOUR_API_KEY")\nproxy = client.proxies.create(\n  type="residential",\n  country="US"\n)` },
];

const categories = [
  { value: "all", label: "All" },
  { value: "browser", label: "Browser Automation" },
  { value: "scraping", label: "Web Scraping" },
  { value: "automation", label: "Automation" },
  { value: "sdk", label: "SDKs" },
];

export default function IntegrationsPage() {
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied to clipboard"); };

  return (
    <div className="pt-24 pb-16">
      <SEOHead title="Integrations — Baalvion NetStack" description="Integrate Baalvion NetStack with Puppeteer, Playwright, Selenium, Scrapy, Zapier, and more. Official SDKs and code examples." />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4"><Puzzle className="w-3 h-3 mr-1" />Integration Ecosystem</Badge>
          <h1 className="text-4xl font-bold mb-4">Connect with Your Stack</h1>
          <p className="text-lg text-muted-foreground">Integrate Baalvion NetStack with your favorite tools and frameworks. Official SDKs, code examples, and automation workflows.</p>
        </div>

        <Tabs defaultValue="all" className="max-w-5xl mx-auto">
          <TabsList className="mx-auto flex justify-center mb-8">
            {categories.map(c => <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>)}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.value} value={cat.value}>
              <div className="grid md:grid-cols-2 gap-6">
                {integrations.filter(i => cat.value === "all" || i.category === cat.value).map(integration => (
                  <Card key={integration.name} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Terminal className="w-5 h-5 text-primary" />
                          {integration.name}
                        </CardTitle>
                        {integration.badge && <Badge variant={integration.badge === "New" ? "success" : integration.badge === "Popular" ? "default" : "secondary"} className="text-xs">{integration.badge}</Badge>}
                      </div>
                      <CardDescription>{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-xs font-mono overflow-x-auto max-h-[200px]">
                          <code>{integration.code}</code>
                        </pre>
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyCode(integration.code)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
          <p className="text-muted-foreground mb-6">Our team can help you build custom integrations for your specific use case.</p>
          <Button variant="hero" asChild><Link to="/contact">Contact Us <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
        </div>
      </div>
    </div>
  );
}
