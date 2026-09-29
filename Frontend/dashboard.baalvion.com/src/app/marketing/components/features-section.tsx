import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, DollarSign, BrainCircuit, Users, FileText, ShieldCheck } from 'lucide-react';

const features = [
    { icon: Globe, title: "Global Business Management", description: "Oversee all your international business units from a single, unified interface." },
    { icon: DollarSign, title: "Multi-Currency Finance", description: "Track revenue, expenses, and profits across different currencies with real-time FX rates." },
    { icon: BrainCircuit, title: "AI-Powered Predictions", description: "Leverage AI to forecast revenue, identify growth opportunities, and mitigate risks." },
    { icon: FileText, title: "Equity Management", description: "Visualize your cap table, manage equity distribution, and model profit sharing scenarios." },
    { icon: Users, title: "Employee Tracking", description: "Manage your global workforce, track attendance, and monitor productivity KPIs." },
    { icon: ShieldCheck, title: "Compliance Automation", description: "Stay on top of global compliance requirements with automated monitoring and alerts." },
]

export default function FeaturesSection() {
    return (
        <section id="features" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Everything you need, in one place.</h2>
                    <p className="mt-2 text-lg text-muted-foreground">Baalvion replaces a dozen different tools with one powerful OS for your business empire.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map(feature => (
                        <Card key={feature.title} className="bg-card/50">
                            <CardHeader>
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
