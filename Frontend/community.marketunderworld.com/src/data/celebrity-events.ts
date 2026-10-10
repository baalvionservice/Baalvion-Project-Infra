// Shared data types and mock data for Celebrity Events & DJ Demand features

export type EventType = "celebrity_appearance" | "dj_set" | "live_concert" | "comedy_night";
export type BidStatus = "active" | "outbid" | "won" | "expired";
export type DemandStatus = "open" | "confirmed" | "closed";

export interface CelebrityEvent {
  id: string;
  type: EventType;
  title: string;
  celebrity: string;
  celebrityImage: string;
  clubId: string;
  clubName: string;
  city: string;
  state: string;
  date: string; // ISO
  startTime: string; // "9:00 PM"
  endTime: string;   // "11:00 PM"
  description: string;
  coverImage: string;
  // Standard tickets
  standardTicketPrice: number; // INR
  standardTicketsTotal: number;
  standardTicketsSold: number;
  // Auction seats (premium front-row / backstage)
  auctionEnabled: boolean;
  auctionSeats: number;
  auctionCurrentBid: number;
  auctionMinBid: number;
  auctionEndTime: string; // ISO
  auctionBids: AuctionBid[];
  status: "upcoming" | "live" | "completed" | "cancelled";
}

export interface AuctionBid {
  id: string;
  bidderName: string; // anonymised, e.g. "User ***123"
  amount: number;
  placedAt: string;
}

export interface DjDemand {
  id: string;
  djName: string;
  djImage: string;
  genre: string;
  requestedBy: number; // how many people have requested
  totalBidAmount: number; // sum of all pledge amounts
  clubId: string;
  clubName: string;
  city: string;
  state: string;
  status: DemandStatus;
  userBid?: number; // current user's pledge
  targetAmount: number; // admin-set target to confirm the event
  demandDeadline: string; // ISO
}

// ─── Mock Celebrity Events ────────────────────────────────────────────────────

export const CELEBRITY_EVENTS: CelebrityEvent[] = [
  {
    id: "evt-001",
    type: "celebrity_appearance",
    title: "An Evening with Imran Hashmi",
    celebrity: "Imran Hashmi",
    celebrityImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    clubId: "c1",
    clubName: "Kitty Su",
    city: "Mumbai",
    state: "Maharashtra",
    date: "2026-10-25",
    startTime: "9:00 PM",
    endTime: "11:00 PM",
    description: "Bollywood's serial kisser Imran Hashmi graces Kitty Su for an exclusive 2-hour appearance. Meet, greet, and party with the star. Limited seats available — bid now for premium front-row access.",
    coverImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop",
    standardTicketPrice: 4500,
    standardTicketsTotal: 200,
    standardTicketsSold: 143,
    auctionEnabled: true,
    auctionSeats: 10,
    auctionCurrentBid: 28000,
    auctionMinBid: 15000,
    auctionEndTime: "2026-10-23T23:59:59Z",
    auctionBids: [
      { id: "b1", bidderName: "User ***847", amount: 28000, placedAt: "2026-10-08T18:30:00Z" },
      { id: "b2", bidderName: "User ***312", amount: 25000, placedAt: "2026-10-08T16:20:00Z" },
      { id: "b3", bidderName: "User ***991", amount: 22000, placedAt: "2026-10-07T22:10:00Z" },
      { id: "b4", bidderName: "User ***654", amount: 18500, placedAt: "2026-10-07T14:00:00Z" },
    ],
    status: "upcoming",
  },
  {
    id: "evt-002",
    type: "dj_set",
    title: "DJ Nucleya — Desi Bass Night",
    celebrity: "DJ Nucleya",
    celebrityImage: "https://images.unsplash.com/photo-1571266028243-d220c6a7ad1c?w=400&auto=format&fit=crop",
    clubId: "c2",
    clubName: "Privee",
    city: "Delhi",
    state: "Delhi (NCT)",
    date: "2026-11-01",
    startTime: "10:00 PM",
    endTime: "2:00 AM",
    description: "India's king of bass, DJ Nucleya, plays an exclusive 4-hour set at Privee. Known for his iconic desi electronic sound, this is a night you cannot miss.",
    coverImage: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=1200&auto=format&fit=crop",
    standardTicketPrice: 3000,
    standardTicketsTotal: 350,
    standardTicketsSold: 289,
    auctionEnabled: true,
    auctionSeats: 5,
    auctionCurrentBid: 12000,
    auctionMinBid: 8000,
    auctionEndTime: "2026-10-29T23:59:59Z",
    auctionBids: [
      { id: "b5", bidderName: "User ***227", amount: 12000, placedAt: "2026-10-08T20:00:00Z" },
      { id: "b6", bidderName: "User ***445", amount: 10500, placedAt: "2026-10-08T12:00:00Z" },
    ],
    status: "upcoming",
  },
  {
    id: "evt-003",
    type: "celebrity_appearance",
    title: "Badshah Live — VIP Night",
    celebrity: "Badshah",
    celebrityImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
    clubId: "c3",
    clubName: "Privee at Aerocity",
    city: "Delhi",
    state: "Delhi (NCT)",
    date: "2026-11-15",
    startTime: "9:30 PM",
    endTime: "11:30 PM",
    description: "Rapper and performer Badshah hosts an exclusive VIP night at his own club in Aerocity. Personal appearance, photo ops, and live performance.",
    coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop",
    standardTicketPrice: 6000,
    standardTicketsTotal: 150,
    standardTicketsSold: 72,
    auctionEnabled: true,
    auctionSeats: 8,
    auctionCurrentBid: 35000,
    auctionMinBid: 20000,
    auctionEndTime: "2026-11-13T23:59:59Z",
    auctionBids: [
      { id: "b7", bidderName: "User ***001", amount: 35000, placedAt: "2026-10-09T01:00:00Z" },
      { id: "b8", bidderName: "User ***789", amount: 30000, placedAt: "2026-10-08T23:00:00Z" },
    ],
    status: "upcoming",
  },
  {
    id: "evt-004",
    type: "dj_set",
    title: "DJ KSHMR — Bollywood to Bass",
    celebrity: "DJ KSHMR",
    celebrityImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop",
    clubId: "c4",
    clubName: "Social Kitty",
    city: "Bangalore",
    state: "Karnataka",
    date: "2026-11-20",
    startTime: "9:00 PM",
    endTime: "1:00 AM",
    description: "Grammy-nominated DJ KSHMR brings his signature Bollywood-meets-bass sound to Bangalore. One night only.",
    coverImage: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop",
    standardTicketPrice: 3500,
    standardTicketsTotal: 400,
    standardTicketsSold: 180,
    auctionEnabled: false,
    auctionSeats: 0,
    auctionCurrentBid: 0,
    auctionMinBid: 0,
    auctionEndTime: "",
    auctionBids: [],
    status: "upcoming",
  },
];

// ─── Mock DJ Demands ──────────────────────────────────────────────────────────

export const DJ_DEMANDS: DjDemand[] = [
  {
    id: "dmd-001",
    djName: "DJ Snake",
    djImage: "https://images.unsplash.com/photo-1571266028243-d220c6a7ad1c?w=400&auto=format&fit=crop",
    genre: "Electronic / Trap",
    requestedBy: 1284,
    totalBidAmount: 642000,
    clubId: "c1",
    clubName: "Kitty Su",
    city: "Mumbai",
    state: "Maharashtra",
    status: "open",
    targetAmount: 1000000,
    demandDeadline: "2026-11-30T23:59:59Z",
  },
  {
    id: "dmd-002",
    djName: "Armin van Buuren",
    djImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop",
    genre: "Trance / EDM",
    requestedBy: 987,
    totalBidAmount: 485000,
    clubId: "c5",
    clubName: "F Bar & Lounge",
    city: "Mumbai",
    state: "Maharashtra",
    status: "open",
    targetAmount: 800000,
    demandDeadline: "2026-12-15T23:59:59Z",
  },
  {
    id: "dmd-003",
    djName: "DJ Nucleya",
    djImage: "https://images.unsplash.com/photo-1571266028243-d220c6a7ad1c?w=400&auto=format&fit=crop",
    genre: "Bass / Desi Electronic",
    requestedBy: 2341,
    totalBidAmount: 1170000,
    clubId: "c2",
    clubName: "Privee",
    city: "Delhi",
    state: "Delhi (NCT)",
    status: "confirmed",
    targetAmount: 1000000,
    demandDeadline: "2026-10-31T23:59:59Z",
  },
  {
    id: "dmd-004",
    djName: "Martin Garrix",
    djImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
    genre: "Progressive House",
    requestedBy: 756,
    totalBidAmount: 320000,
    clubId: "c6",
    clubName: "Tryst",
    city: "Delhi",
    state: "Delhi (NCT)",
    status: "open",
    targetAmount: 1200000,
    demandDeadline: "2026-12-31T23:59:59Z",
  },
  {
    id: "dmd-005",
    djName: "Sunburn DJ",
    djImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    genre: "Bollywood / Commercial",
    requestedBy: 543,
    totalBidAmount: 163000,
    clubId: "c7",
    clubName: "Sinq Beach Club",
    city: "Goa",
    state: "Goa",
    status: "open",
    targetAmount: 500000,
    demandDeadline: "2026-11-30T23:59:59Z",
  },
];
