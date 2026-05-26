import { Shield, Lock, Eye, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const certifications = [
  { name: "SOC 2 Type II", status: "Certified", icon: Shield },
  { name: "ISO 27001", status: "Certified", icon: Lock },
  { name: "GDPR Compliant", status: "Compliant", icon: Eye },
  { name: "CCPA Compliant", status: "Compliant", icon: Eye },
];

const practices = [
  { title: "End-to-End Encryption", desc: "All data encrypted in transit (TLS 1.3) and at rest (AES-256). Zero plain-text storage." },
  { title: "Zero-Knowledge Architecture", desc: "We cannot access your proxy traffic content. Only metadata for routing and billing." },
  { title: "Infrastructure Security", desc: "Multi-region deployment with geographic redundancy. DDoS protection and WAF enabled." },
  { title: "Access Controls", desc: "Role-based access, MFA enforcement, and audit logging for all administrative actions." },
  { title: "Vulnerability Management", desc: "Continuous security scanning, regular penetration testing, and responsible disclosure program." },
  { title: "Incident Response", desc: "24/7 security operations center with <15 minute incident response SLA." },
];

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Security</h1>
        <p className="text-lg text-muted-foreground">Enterprise-grade security at every layer</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {certifications.map((c) => (
          <Card key={c.name} className="glass-card text-center">
            <CardContent className="p-6">
              <c.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
              <p className="font-semibold text-foreground text-sm">{c.name}</p>
              <Badge variant="default" className="mt-2">{c.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-6">
        {practices.map((p) => (
          <Card key={p.title} className="glass-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
