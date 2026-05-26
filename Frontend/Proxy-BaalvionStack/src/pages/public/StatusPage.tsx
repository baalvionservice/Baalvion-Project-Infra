import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Activity, ChevronRight } from "lucide-react";
import { statusHistory } from "@/data/mockData";
import { IncidentDetailModal } from "@/components/status/IncidentDetailModal";
import { IncidentDetail } from "@/types/admin";

const incidentDetails: IncidentDetail[] = [
  {
    id: "inc-detail-1",
    title: "Minor latency increase in EU region",
    summary: "Users experienced elevated response times through European endpoints. Traced to network congestion at a major peering point.",
    affectedProxyTypes: ["Residential", "Datacenter"],
    affectedCountries: ["Germany", "Netherlands", "France"],
    startTime: "2024-03-12 14:30 UTC",
    endTime: "2024-03-12 16:45 UTC",
    duration: "2h 15m",
    status: "resolved",
    resolutionNotes: "Traffic rerouted through alternative peering points. Normal latency restored.",
    updates: [
      { time: "14:30", message: "Investigating elevated latency reports from EU users" },
      { time: "14:45", message: "Issue identified as network congestion at DE-CIX" },
      { time: "15:30", message: "Implementing traffic rerouting" },
      { time: "16:45", message: "Issue resolved, monitoring" },
    ],
  },
  {
    id: "inc-detail-2",
    title: "Provider maintenance window",
    summary: "Scheduled maintenance on mobile proxy infrastructure affecting APAC region.",
    affectedProxyTypes: ["Mobile"],
    affectedCountries: ["Japan", "South Korea", "Singapore"],
    startTime: "2024-03-10 02:00 UTC",
    endTime: "2024-03-10 04:00 UTC",
    duration: "2h 00m",
    status: "resolved",
    resolutionNotes: "Planned maintenance completed successfully. All systems operational.",
    updates: [
      { time: "02:00", message: "Maintenance window started as scheduled" },
      { time: "03:30", message: "Core updates complete, running verification" },
      { time: "04:00", message: "Maintenance completed, all systems nominal" },
    ],
  },
];

export default function StatusPage() {
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleIncidentClick = (entry: typeof statusHistory[0]) => {
    // Find corresponding incident detail
    const incident = incidentDetails.find(inc => 
      inc.title.toLowerCase().includes(entry.incident?.toLowerCase().slice(0, 20) || "")
    ) || incidentDetails[0];
    
    if (incident) {
      setSelectedIncident(incident);
      setModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Current Status */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-success/10 border border-success/20 mb-6">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-success font-medium">All Systems Operational</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Baalvion NetStack Status</h1>
        <p className="text-muted-foreground">
          Current status of all services and infrastructure.
        </p>
      </div>

      {/* Service Status */}
      <div className="max-w-3xl mx-auto space-y-4 mb-16">
        {[
          { name: "Residential Proxy Network", status: "operational", uptime: "99.99%" },
          { name: "Mobile Proxy Network", status: "operational", uptime: "99.95%" },
          { name: "Datacenter Proxy Network", status: "operational", uptime: "100%" },
          { name: "API Gateway", status: "operational", uptime: "99.99%" },
          { name: "Dashboard & Control Panel", status: "operational", uptime: "99.99%" },
          { name: "Authentication Services", status: "operational", uptime: "100%" },
        ].map((service) => (
          <Card key={service.name} variant="glass">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{service.uptime} uptime</span>
                <Badge variant="success">Operational</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Uptime Chart Visual */}
      <Card variant="default" className="max-w-3xl mx-auto mb-16">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            90-Day Uptime
          </CardTitle>
          <CardDescription>
            Overall system uptime: 99.98%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }).map((_, i) => {
              const isGood = Math.random() > 0.02;
              return (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${isGood ? "bg-success" : "bg-warning"}`}
                  title={`Day ${90 - i}: ${isGood ? "100%" : "98.5%"}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Incident History */}
      <Card variant="default" className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Incident History
          </CardTitle>
          <CardDescription>Click on an incident to view details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusHistory.map((entry) => (
            <div 
              key={entry.date} 
              className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                entry.incident 
                  ? "bg-secondary/30 hover:bg-secondary/50 cursor-pointer" 
                  : "bg-secondary/30"
              }`}
              onClick={() => entry.incident && handleIncidentClick(entry)}
            >
              {entry.status === "operational" && !entry.incident ? (
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{entry.date}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.status === "operational" && !entry.incident ? "success" : "warning"}>
                      {entry.uptime}% uptime
                    </Badge>
                    {entry.incident && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {entry.incident && (
                  <p className="text-sm text-muted-foreground">{entry.incident}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-16">
        <p className="text-sm text-muted-foreground">
          Baalvion NetStack is a product of Baalvion Industries Private Limited.
        </p>
      </div>

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
