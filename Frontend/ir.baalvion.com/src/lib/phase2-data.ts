export const phase2InvestorData = {
    name: "Acme Capital Partners",
    spv: {
        name: "Project Olympus SPV",
        commitment: 5000000,
        dealName: "Project Olympus Clean Energy Fund",
        profitSharing: "80/20 split over 8% hurdle rate",
        status: "Active"
    },
    capitalAccount: {
        commitment: 5000000,
        contributions: 2000000,
        distributions: 0,
        balance: 2000000,
        unfundedCommitment: 3000000
    },
    activity: [
        { id: 1, date: "2024-07-29", description: "Acknowledged 'SPV Operating Agreement v1.1'", status: "Completed"},
        { id: 2, date: "2024-07-28", description: "KYC/AML documentation approved", status: "Completed"},
        { id: 3, date: "2024-07-27", description: "Capital Call #1 Notice Sent ($2,000,000.00)", status: "Action Required"},
        { id: 4, date: "2024-07-25", description: "Signed 'Project Olympus SPV Subscription Agreement'", status: "Completed"},
    ]
}

export type Document = {
  id: string;
  name: string;
  category: string;
  version: string;
  date: string;
  status: 'Acknowledged' | 'Pending' | 'Not Required';
}

export type DocumentCategory = {
    category: string;
    description: string;
    docs: Document[];
}

export const phase2Documents: DocumentCategory[] = [
    {
        category: "Onboarding & Legal",
        description: "Core legal, subscription, and verification documents.",
        docs: [
            { id: "L01", name: "SPV Subscription Agreement", category: "Legal", version: "2.0", date: "2024-07-25", status: "Acknowledged" },
            { id: "L02", name: "SPV Operating Agreement", category: "Legal", version: "1.1", date: "2024-07-29", status: "Acknowledged" },
            { id: "L03", name: "SPV Private Placement Memorandum (PPM)", category: "Legal", version: "1.5", date: "2024-07-20", status: "Acknowledged" },
            { id: "O01", name: "Investor Suitability Questionnaire", category: "Onboarding", version: "1.0", date: "2024-07-25", status: "Acknowledged" },
            { id: "O02", name: "KYC/AML Document Submission", category: "Onboarding", version: "N/A", date: "2024-07-28", status: "Acknowledged" },
            { id: "O03", name: "W-8BEN-E / W-9 Form", category: "Onboarding", version: "1.2", date: "2024-07-26", status: "Acknowledged" },
        ]
    },
    {
        category: "Capital Control & Financials",
        description: "Documents related to capital calls, banking, and financial statements.",
        docs: [
            { id: "C01", name: "Capital Call Notice #1", category: "Capital", version: "1.0", date: "2024-07-27", status: "Pending" },
            { id: "C02", name: "Wire / Banking Instructions", category: "Capital", version: "1.0", date: "2024-07-25", status: "Acknowledged" },
            { id: "F01", name: "SPV Audited Financial Statements (Y2023)", category: "Financials", version: "1.0", date: "2024-06-30", status: "Pending" },
            { id: "F02", name: "SPV Unaudited Quarterly Report (Q2 2024)", category: "Financials", version: "1.0", date: "2024-07-15", status: "Pending" },
            { id: "F03", name: "Portfolio Company Financials (Q2 2024)", category: "Financials", version: "1.0", date: "2024-07-18", status: "Pending" },
        ]
    },
    {
        category: "Portfolio & Performance",
        description: "Information and reports on the underlying investment.",
        docs: [
            { id: "P01", name: "Portfolio Company Investment Memo", category: "Portfolio", version: "1.0", date: "2024-07-10", status: "Acknowledged" },
            { id: "P02", name: "Portfolio Company Pitch Deck", category: "Portfolio", version: "3.2", date: "2024-07-10", status: "Acknowledged" },
            { id: "P03", name: "Quarterly Performance Report (Q2 2024)", category: "Performance", version: "1.0", date: "2024-07-19", status: "Pending" },
            { id: "P04", name: "Valuation Policy", category: "Performance", version: "1.0", date: "2024-01-15", status: "Acknowledged" },
        ]
    },
    {
        category: "Tax & Compliance",
        description: "Tax-related documents and ongoing compliance filings.",
        docs: [
            { id: "T01", name: "Schedule K-1 (2023)", category: "Tax", version: "1.0", date: "2024-03-15", status: "Acknowledged" },
            { id: "T02", name: "Tax Information Statement", category: "Tax", version: "1.1", date: "2024-01-30", status: "Acknowledged" },
            { id: "C03", name: "Annual Compliance Certificate", category: "Compliance", version: "2024", date: "2024-06-15", status: "Pending" },
            { id: "C04", name: "Data Privacy & GDPR Policy", category: "Compliance", version: "2.3", date: "2024-01-01", status: "Acknowledged" },
        ]
    }
];

// In a real app, this list would be far more extensive as per the prompt.
// This is a representative sample.
const allDocs = [
    ...phase2Documents[0].docs,
    ...phase2Documents[1].docs,
    ...phase2Documents[2].docs,
    ...phase2Documents[3].docs,
]
const moreDocsToAdd = 50 - allDocs.length;
let docCounter = 1;

if(moreDocsToAdd > 0) {
    const otherCategory = {
        category: "General & Miscellaneous",
        description: "Other supporting documentation.",
        docs: [] as Document[]
    };
    for(let i=0; i < moreDocsToAdd; i++) {
        otherCategory.docs.push(
            { id: `G${docCounter}`, name: `General Document ${docCounter}`, category: "General", version: "1.0", date: "2024-05-15", status: "Pending" }
        )
        docCounter++;
    }
    phase2Documents.push(otherCategory);
}
