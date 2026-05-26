import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const faqCategories = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is Baalvion NetStack?",
        a: "Baalvion NetStack is an enterprise-grade proxy infrastructure platform offering residential, mobile, and datacenter proxies across 195+ countries. It provides an API-first SaaS with real-time analytics, team management, and granular access controls.",
      },
      {
        q: "How do I get started?",
        a: "Sign up for a free trial — no credit card required. Our onboarding wizard will guide you through choosing a proxy type, configuring your first endpoint, and generating an API key in under 2 minutes.",
      },
      {
        q: "Do you offer a free trial?",
        a: "Yes. Every new account gets a 7-day free trial with 1 GB of bandwidth. You can test any proxy type and all dashboard features during the trial period.",
      },
      {
        q: "What proxy types are available?",
        a: "We offer three proxy types: Residential (45M+ IPs from real ISPs), Mobile (10M+ 4G/5G carrier IPs), and Datacenter (500K+ high-speed IPs). Each type is optimized for different use cases.",
      },
    ],
  },
  {
    title: "Billing & Pricing",
    items: [
      {
        q: "How does billing work?",
        a: "Billing is based on bandwidth consumed (GB). You choose a monthly plan with a pre-allocated bandwidth allowance. Overages are billed at a per-GB rate shown on your plan page. You can also use Pay-As-You-Go with no commitment.",
      },
      {
        q: "Can I upgrade or downgrade my plan?",
        a: "Yes. Plan changes take effect immediately. When upgrading, you're charged a prorated amount. When downgrading, the remaining balance is applied as credit to your next billing cycle.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Visa, Mastercard, American Express, wire transfer, and regional payment methods including UPI (India), iDEAL (Netherlands), Bancontact (Belgium), and more. Enterprise clients can pay via invoice with Net-30/60 terms.",
      },
      {
        q: "What is your refund policy?",
        a: "We offer a pro-rata refund within the first 7 days if you're unsatisfied. After 7 days, unused bandwidth is non-refundable but plan downgrades apply credit to future cycles. See our full refund policy for details.",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        q: "What protocols are supported?",
        a: "All proxy types support HTTP, HTTPS, and SOCKS5. Connection strings are provided in the dashboard with copy-to-clipboard support and code examples for cURL, Python, Node.js, and Go.",
      },
      {
        q: "What is the average latency?",
        a: "Residential proxies average 80–150 ms, mobile proxies 100–200 ms, and datacenter proxies 10–30 ms. Actual latency depends on the target country and your origin location.",
      },
      {
        q: "Do you support sticky sessions?",
        a: "Yes. You can configure sticky sessions from 1 to 60 minutes for residential and mobile proxies. Datacenter proxies support static sessions with dedicated IPs.",
      },
      {
        q: "Is there an API?",
        a: "Yes. Our RESTful API lets you manage proxies, sub-users, presets, and billing programmatically. Full OpenAPI documentation and SDKs for Python, Node.js, Go, and Java are available.",
      },
      {
        q: "What happens if I exceed my bandwidth limit?",
        a: "Depending on your plan settings, you can choose between soft cap (overage billing at a per-GB rate) or hard cap (connections are paused until the next billing cycle or you upgrade). You'll receive warnings at 80%, 90%, and 100% usage.",
      },
    ],
  },
  {
    title: "Security & Compliance",
    items: [
      {
        q: "Is my data secure?",
        a: "Yes. We are SOC 2 Type II certified, ISO 27001 compliant, and GDPR-ready. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never log your traffic content.",
      },
      {
        q: "Do you support 2FA?",
        a: "Yes. Two-factor authentication is available via authenticator apps (TOTP). It can be enforced organization-wide by admins on Business and Enterprise plans.",
      },
      {
        q: "Can I restrict API key access by IP?",
        a: "Yes. Each API key supports IP allowlisting. You can restrict keys to specific CIDR ranges and also set scope permissions (read-only, read-write, admin).",
      },
    ],
  },
  {
    title: "Enterprise",
    items: [
      {
        q: "Do you offer custom plans?",
        a: "Yes. Enterprise clients get dedicated account management, custom SLAs, volume discounts, private IP pools, and white-label options. Contact our sales team to discuss your requirements.",
      },
      {
        q: "Can I manage multiple teams?",
        a: "Yes. Our organization model supports multiple workspaces, departments, and cost centers. Assign per-user bandwidth limits, API key scopes, and role-based access controls across your organization.",
      },
      {
        q: "What SLA do you guarantee?",
        a: "Standard plans include a 99.9% uptime SLA. Enterprise plans can negotiate 99.99% SLA with financial credits for any downtime. See our SLA page for full terms.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <SEOHead
        title="FAQ — Frequently Asked Questions"
        description="Find answers to common questions about Baalvion NetStack proxies, billing, API, security, and enterprise features."
        canonical="https://baalvion.com/faq"
      />
      <div className="text-center mb-16">
        <Badge variant="info" className="mb-4">FAQ</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about Baalvion NetStack. Can't find the answer you're looking for? Reach out to our support team.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-10">
        {faqCategories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-xl font-semibold mb-4">{cat.title}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {cat.items.map((item, i) => (
                <AccordionItem key={i} value={`${cat.title}-${i}`} className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/20">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      <Card variant="glow" className="max-w-3xl mx-auto mt-16">
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">Our support team is available 24/7 to help you.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="hero" asChild><Link to="/contact">Contact Support</Link></Button>
            <Button variant="outline" asChild><Link to="/docs">Read Documentation</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
