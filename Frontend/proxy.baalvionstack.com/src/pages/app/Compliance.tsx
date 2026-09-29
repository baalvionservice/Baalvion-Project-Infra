import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileText,
  Download,
  Check,
  Clock,
  Server,
  Lock,
  Eye,
  Globe,
  RefreshCw,
} from "lucide-react";
import { HelpTooltip } from "@/components/enterprise/ContextualHelp";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";

const complianceReports = [
  {
    id: "soc2",
    name: "SOC 2 Type II Report",
    description: "Service Organization Control report covering security, availability, and confidentiality.",
    lastUpdated: "December 2025",
    status: "current",
  },
  {
    id: "gdpr",
    name: "GDPR Compliance Statement",
    description: "Documentation of our data protection practices under EU regulation.",
    lastUpdated: "November 2025",
    status: "current",
  },
  {
    id: "iso27001",
    name: "ISO 27001 Certificate",
    description: "Information security management system certification.",
    lastUpdated: "October 2025",
    status: "current",
  },
  {
    id: "dpa",
    name: "Data Processing Agreement",
    description: "Standard contractual clauses for data processing activities.",
    lastUpdated: "January 2026",
    status: "current",
  },
];

const securityPractices = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our infrastructure is hosted in SOC 2 compliant data centers with 24/7 monitoring.",
  },
  {
    icon: Eye,
    title: "Access Controls",
    description: "Role-based access control with multi-factor authentication for all accounts.",
  },
  {
    icon: RefreshCw,
    title: "Regular Audits",
    description: "Quarterly security assessments and annual penetration testing by third parties.",
  },
];

const dataRetentionPolicies = [
  { type: "Proxy Logs", retention: "30 days", description: "Connection logs and request metadata" },
  { type: "Usage Analytics", retention: "90 days", description: "Bandwidth and performance metrics" },
  { type: "Audit Logs", retention: "1 year", description: "Account activity and changes" },
  { type: "Billing Records", retention: "7 years", description: "Invoices and payment history" },
  { type: "Account Data", retention: "Until deletion", description: "Profile and settings" },
];

export default function Compliance() {
  const handleDownload = (reportId: string) => {
    // Mock download - in real app would trigger actual file download
    const mockContent = `Mock ${reportId.toUpperCase()} compliance report content...`;
    const blob = new Blob([mockContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baalvion-${reportId}-report.pdf`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Compliance & Security" description="Access compliance certifications, data retention policies, and GDPR data export tools." />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Compliance & Security
          <HelpTooltip
            title="Compliance Center"
            description="Access compliance documentation, security certifications, and data handling policies."
          />
        </h1>
        <p className="text-muted-foreground">
          Security certifications, data policies, and compliance documentation.
        </p>
      </div>

      {/* Compliance Status */}
      <Card variant="glow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-success" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Fully Compliant</h2>
                <Badge variant="success">Verified</Badge>
              </div>
              <p className="text-muted-foreground">
                All security certifications are up to date. Last audit completed December 2025.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">4</p>
                <p className="text-xs text-muted-foreground">Certifications</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">100%</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Compliance Reports
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {complianceReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-success border-success/30">
                      <Check className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Updated: {report.lastUpdated}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Practices */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Security Practices
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityPractices.map((practice, index) => (
            <motion.div
              key={practice.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card variant="interactive" className="h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <practice.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{practice.title}</h3>
                  <p className="text-sm text-muted-foreground">{practice.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Data Retention Policies
          </CardTitle>
          <CardDescription>
            How long we retain different types of data in our systems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataRetentionPolicies.map((policy) => (
              <div
                key={policy.type}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
              >
                <div>
                  <p className="font-medium">{policy.type}</p>
                  <p className="text-sm text-muted-foreground">{policy.description}</p>
                </div>
                <Badge variant="secondary">{policy.retention}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Data */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Request Your Data</h3>
              <p className="text-sm text-muted-foreground">
                Export all your personal data or request account deletion in compliance with GDPR.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                Request Deletion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
