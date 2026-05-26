import { Globe } from 'lucide-react';

const logos = [
    { name: "PlaceholderCo", hint: "abstract logo" },
    { name: "Quantum Inc", hint: "tech logo" },
    { name: "Innovate Ltd", hint: "geometric logo" },
    { name: "Apex Global", hint: "minimalist logo" },
    { name: "Synergy Corp", hint: "line art logo" }
];

export default function LogosSection() {
    return (
        <section className="py-12 bg-muted/50">
            <div className="container mx-auto px-4 text-center">
                <p className="text-muted-foreground">Trusted by businesses in 5+ countries</p>
                <div className="mt-6 flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                    {logos.map(logo => (
                        <div key={logo.name} className="flex items-center gap-2 text-gray-400" data-ai-hint={logo.hint}>
                            <Globe className="h-6 w-6" />
                            <span className="font-semibold text-lg">{logo.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
