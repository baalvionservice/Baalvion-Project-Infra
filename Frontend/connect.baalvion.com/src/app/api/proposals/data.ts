import { Proposal } from "@/types/proposal";

// In-memory store
export let proposals: Proposal[] = [
  {
    id: "prop_1",
    dealId: "deal_1",
    companyName: "Lumina Tech",
    totalPrice: 4500,
    status: "sent",
    deliverables: [
      {
        id: "d1",
        type: "reel",
        quantity: 2,
        creatorTier: "mid",
        pricePerUnit: 525,
      },
    ],
    pricingBreakdown: [
      { label: "Subtotal", amount: 3913 },
      { label: "Platform Fee (15%)", amount: 587 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
