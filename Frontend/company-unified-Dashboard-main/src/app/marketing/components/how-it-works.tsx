import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const steps = [
    { step: 1, title: "Connect your businesses", description: "Securely link your business entities, bank accounts, and payment gateways." },
    { step: 2, title: "Get unified insights", description: "Our platform aggregates and analyzes your data, providing a single source of truth." },
    { step: 3, title: "Make smarter decisions", description: "Use AI-powered forecasts and strategic planners to guide your empire's growth." },
]

export default function HowItWorks() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Get started in minutes.</h2>
                    <p className="mt-2 text-lg text-muted-foreground">It's never been easier to manage a global portfolio.</p>
                </div>
                <div className="relative grid md:grid-cols-3 gap-8 items-center">
                    {steps.map((step, index) => (
                        <div key={step.step} className="relative z-10">
                            <Card className="text-center">
                                <CardHeader>
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 mx-auto">{step.step}</div>
                                    <CardTitle>{step.title}</CardTitle>
                                    <CardDescription>{step.description}</CardDescription>
                                </CardHeader>
                            </Card>
                            {index < steps.length - 1 && (
                                <div className="absolute top-1/2 -right-1/2 -translate-y-1/2 hidden md:block">
                                    <ArrowRight className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
