import { Link } from "react-router-dom";
import { Zap, Shield, Lock, FileText, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const footerLinks = {
  Products: [
    { label: "Residential Proxies", path: "/residential" },
    { label: "Mobile Proxies", path: "/mobile" },
    { label: "Datacenter Proxies", path: "/datacenter" },
    { label: "Proxy Comparison", path: "/proxy-comparison" },
    { label: "Enterprise", path: "/enterprise" },
    { label: "Pricing", path: "/pricing" },
  ],
  Resources: [
    { label: "Documentation", path: "/docs" },
    { label: "Integrations", path: "/integrations" },
    { label: "Case Studies", path: "/case-studies" },
    { label: "Infrastructure", path: "/infrastructure" },
    { label: "Calculator", path: "/calculator" },
    { label: "Book a Demo", path: "/book-demo" },
    { label: "FAQ", path: "/faq" },
    { label: "Blog", path: "/blog" },
  ],
  Company: [
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Status", path: "/status" },
    { label: "Security", path: "/security" },
    { label: "SLA", path: "/sla" },
    { label: "Changelog", path: "/changelog" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Acceptable Use", path: "/aup" },
    { label: "Refund Policy", path: "/refund" },
    { label: "Cookie Policy", path: "/cookies" },
    { label: "Compliance", path: "/compliance-info" },
    { label: "Transparency", path: "/transparency" },
  ],
};

const certBadges = [
  { name: "SOC 2", icon: Shield },
  { name: "ISO 27001", icon: Lock },
  { name: "GDPR", icon: FileText },
  { name: "PCI DSS", icon: Scale },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Baalvion</span>
                <span className="text-xs text-muted-foreground">NetStack</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">Enterprise-grade proxy infrastructure for the modern web.</p>
            <div className="flex flex-wrap gap-2">
              {certBadges.map(cert => (
                <Badge key={cert.name} variant="secondary" className="gap-1 text-xs">
                  <cert.icon className="w-3 h-3" />{cert.name}
                </Badge>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.path + link.label}>
                    <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Baalvion NetStack. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Baalvion NetStack is a product of Baalvion Industries Private Limited.</p>
        </div>
      </div>
    </footer>
  );
}
