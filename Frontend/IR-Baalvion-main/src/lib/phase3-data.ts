export const operatorData = {
    name: "Elena Petrov",
    expertise: "AI in Logistics & Supply Chain",
    grant: {
        totalShares: 25000,
        type: "RSUs (Non-Voting)",
        date: "2024-07-30",
    },
    vesting: {
        schedule: "4-year vest, 1-year cliff, monthly thereafter",
        cliffDate: "2025-07-30",
        cliffStatus: "Pending",
        vestingStartDate: "2025-08-30",
        vestedShares: 6250,
        unvestedShares: 18750,
        totalVestedPercent: 25,
        nextVestingDate: "2025-08-30",
        nextVestingAmount: 520.83,
    },
    kpis: [
        {
            id: 1,
            name: "Reduce Supply Chain Cost by 5%",
            target: "Q4 2024",
            progress: 100,
            status: "Achieved",
            accelerationBonus: "1,250",
        },
        {
            id: 2,
            name: "Implement AI predictive routing",
            target: "Q1 2025",
            progress: 60,
            status: "In Progress",
            accelerationBonus: "2,500",
        },
        {
            id: 3,
            name: "Onboard 3 new enterprise clients to AI module",
            target: "Q2 2025",
            progress: 33,
            status: "In Progress",
            accelerationBonus: "2,500",
        },
    ],
    notifications: [
        { id: 1, type: 'milestone', message: "KPI Achieved: 'Reduce Supply Chain Cost by 5%'. 1,250 RSUs vesting accelerated.", date: "2024-07-31" },
        { id: 2, type: 'vesting', message: "Your 1-year cliff is approaching on 2025-07-30.", date: "2024-07-01" },
        { id: 3, type: 'grant', message: "Your grant of 25,000 RSUs was successfully issued.", date: "2024-07-30" },
    ],
    documents: [
        { id: 1, name: "Operator Grant Agreement.pdf", link: "#" },
        { id: 2, name: "IP Assignment Agreement.pdf", link: "#" },
        { id: 3, name: "Confidentiality & Non-Compete.pdf", link: "#" },
    ]
};
