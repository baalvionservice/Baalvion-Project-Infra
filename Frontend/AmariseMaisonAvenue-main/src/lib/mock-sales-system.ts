import { SalesScript } from './types';

export const ACQUISITION_SCRIPTS: SalesScript[] = [
  {
    id: 'script-init',
    name: 'Initial Curatorial Response',
    stage: 'new',
    template: `Thank you for your inquiry. Your request has been personally reviewed by our acquisition desk.

Before we proceed, I would like to understand your intent more precisely — are you looking for:
• A collectible investment piece
• A personal statement acquisition
• Or a rare archival find

We curate differently based on purpose.

— AMARISÉ Curatorial Desk`
  },
  {
    id: 'script-investor',
    name: 'Investment Advisory Lead',
    stage: 'qualifying',
    triggerKeywords: ['investment', 'roi', 'appreciate', 'market', 'value'],
    template: `Understood. Our Investment Advisory specializes in artifacts with proven resale liquidity and historical appreciation trajectories. 

I am currently analyzing the provenance of this piece against recent secondary market auctions. Would you like a detailed Investment Resilience Report?`
  },
  {
    id: 'script-personal',
    name: 'Personal Legacy Lead',
    stage: 'qualifying',
    triggerKeywords: ['personal', 'gift', 'myself', 'wear', 'use', 'wedding'],
    template: `A distinguished choice. This artifact was crafted to be an extension of one's legacy. 

In our Parisian atelier, we believe such pieces find their rightful guardians. May I share some close-up frame captures of the hand-finishing details?`
  },
  {
    id: 'script-price',
    name: 'Price & Value Handling',
    stage: 'presenting',
    triggerKeywords: ['price', 'cost', 'how much', 'expensive'],
    template: `The acquisition value for an artifact of this rarity is optimized for market stability. 

For private clients, we provide a bespoke allocation quote that includes global white-glove logistics and institutional authentication. Shall I prepare your formal quote?`
  },
  {
    id: 'script-scarcity',
    name: 'Inventory Scarcity Push',
    stage: 'closing',
    triggerKeywords: ['wait', 'thinking', 'later', 'available'],
    template: `I must inform you that this specific archive entry has attracted significant interest from a collector in our Dubai hub. 

Due to its provenance, we can only maintain a private hold for the next 24 business hours. Do you wish to secure the allocation now?`
  },
  {
    id: 'script-closing',
    name: 'Final Reservation Protocol',
    stage: 'closing',
    template: `Your acquisition request has been moved to final verification. 

A senior curator will now finalize the logistics charter. You may proceed to reserve the piece via your private dashboard.`
  }
];
