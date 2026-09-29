export const pendingApprovalsP1 = [
    { id: "INV001", name: "John Doe", date: "2024-07-28", status: "Pending" },
    { id: "INV002", name: "Jane Smith", date: "2024-07-27", status: "Pending" },
    { id: "INV005", name: "Sam Wilson", date: "2024-07-29", status: "Pending" },
  ];

  export const pendingApprovalsP2 = [
    { id: "SPV-003", name: "Acme Capital", entity: "Project Olympus", date: "2024-07-29", status: "Docs Submitted" },
    { id: "SPV-004", name: "Synergy Ventures", entity: "Project Titan", date: "2024-07-28", status: "Pending Docs" },
  ];

  export const phase3Data = {
    pool: {
      totalAllocation: "7.50%",
      totalShares: 750000,
      issuedGrants: 3,
      issuedShares: 75000,
      availableGrants: 27,
      availableShares: 675000,
    },
    operators: [
      {
        id: "OP001",
        name: "Elena Petrov",
        expertise: "AI in Logistics & Supply Chain",
        grant: 25000,
        status: "Active",
        vestingProgress: 25,
      },
      {
        id: "OP002",
        name: "Marcus Holloway",
        expertise: "Cybersecurity & Trade Finance",
        grant: 25000,
        status: "Active",
        vestingProgress: 15,
      },
      {
        id: "OP003",
        name: "Jian Li",
        expertise: "APAC Market Expansion",
        grant: 25000,
        status: "Active",
        vestingProgress: 5,
      },
      {
        id: "OP004",
        name: "Sofia Rodriguez",
        expertise: "Regulatory Tech & Compliance",
        grant: 0,
        status: "Pending Docs",
        vestingProgress: 0,
      }
    ]
  }
