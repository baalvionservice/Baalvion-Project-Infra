const stats = [
    { value: "284", label: "Employees Managed" },
    { value: "5", label: "Countries" },
    { value: "$8.2M", label: "Revenue Tracked" },
    { value: "99.97%", label: "Uptime" }
];

export default function StatsBar() {
    return (
        <section className="bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map(stat => (
                        <div key={stat.label}>
                            <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                            <p className="text-sm opacity-80">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
