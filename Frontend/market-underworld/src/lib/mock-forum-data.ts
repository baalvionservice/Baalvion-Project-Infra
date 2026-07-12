import { ForumThread, ForumReply } from "./types";

export const FORUM_CATEGORIES = [
  "Education", "Crypto & Payments", "Trading", "Regional Culture",
  "Tech & Coding", "Study Methods", "Teacher Reviews", "Marketplace",
  "Platform News", "General Chat", "Success Stories", "Help & Support"
];

export const INTERESTING_TOPICS = [
  {
    id: 1,
    image: "https://picsum.photos/seed/topic1/100/100",
    badges: [
      { text: "INTERESTING", color: "bg-[#ffd700] text-black" },
      { text: "EDUCATION", color: "bg-[#e67e22] text-white" }
    ],
    title: "Carding from WWH-CLUB",
    meta: "New group 04/13/26 | v3"
  },
  {
    id: 2,
    image: "https://picsum.photos/seed/topic2/100/100",
    badges: [
      { text: "Verified", color: "bg-[#27ae60] text-white", icon: "CheckCircle2" }
    ],
    title: "Sombrero Checker — Your cards will live forever!",
    meta: "(New bot https://t.me/SombreroV2_bot)"
  },
  {
    id: 3,
    image: "https://picsum.photos/seed/topic3/100/100",
    badges: [
      { text: "Verified", color: "bg-[#27ae60] text-white", icon: "CheckCircle2" },
      { text: "Ruby", color: "bg-[#e91e63] text-white", icon: "Award" }
    ],
    title: "⚡⚡⚡ BAN Instagram, WhatsApp, FB, YouTube, Twitter & TikTok ⚡⚡⚡",
    meta: "- 🔥 Block Instagram, 🔥 Twitter and TikTok, WhatsApp, FB, 🔥 YouTube messengers",
    isHighlighted: true
  },
  {
    id: 4,
    image: "https://picsum.photos/seed/topic4/100/100",
    badges: [],
    title: "CLOUD&CASHOUT - WE WORK IN THE USA FROM THE USA.",
    meta: ""
  },
  {
    id: 5,
    image: "https://picsum.photos/seed/topic5/100/100",
    badges: [
      { text: "Paid section", color: "bg-[#9b59b6] text-white" },
      { text: "VIP", color: "bg-[#1abc9c] text-white", icon: "Crown" },
      { text: "Ruby", color: "bg-[#e91e63] text-white", icon: "Award" }
    ],
    title: "Remus - 24/7 support, a stealer with unique functionality, 90% typing accuracy, even a child can figure it out",
    meta: ""
  }
];

export const FORUM_THREADS: ForumThread[] = [
  {
    id: "thread-1",
    title: "[OFFICIAL] Welcome to NEXUS Forums — Rules & Guidelines",
    preview: "Please read our community guidelines before posting. We maintain a high standard of elite discussion...",
    author: {
      name: "Admin_Zero",
      avatar: "https://picsum.photos/seed/admin/100/100",
      role: "Admin",
      region: "Global",
      country: "NEXUS"
    },
    category: "Platform News",
    regionId: "global",
    views: 12450,
    replies: 0,
    likes: 842,
    timestamp: "2026-01-01T00:00:00Z",
    isPinned: true,
    tags: ["Rules", "Guide"]
  },
  {
    id: "thread-2",
    title: "Best crypto wallets for students in Asia 2026",
    preview: "I've been testing several non-custodial wallets for paying my tuition fees in ETH. Here is my definitive ranking...",
    author: {
      name: "Yuki Tanaka",
      avatar: "https://picsum.photos/seed/yuki/100/100",
      role: "Teacher",
      region: "East Asia & Pacific",
      country: "JP"
    },
    category: "Crypto & Payments",
    regionId: "eap",
    views: 3420,
    replies: 89,
    likes: 247,
    timestamp: "2026-03-10T14:00:00Z",
    isHot: true,
    tags: ["Wallet", "Security", "ETH"]
  },
  {
    id: "thread-3",
    title: "How I went from F to A+ in math in 8 weeks — full story",
    preview: "It started with one session with a NEXUS tutor. I realized I didn't hate math, I just hated how it was taught...",
    author: {
      name: "Aryan Mehta",
      avatar: "https://picsum.photos/seed/aryan/100/100",
      role: "Student",
      region: "South Asia",
      country: "IN"
    },
    category: "Success Stories",
    regionId: "sas",
    views: 8910,
    replies: 67,
    likes: 532,
    timestamp: "2026-03-09T10:00:00Z",
    isSolved: true,
    tags: ["Mathematics", "Inspiration"]
  },
  {
    id: "thread-4",
    title: "Advanced trading methods — private signals discussion",
    preview: "CONTENT LOCKED. This thread is only accessible to NEXUS VIP members. Discussion includes Fibonacci extensions and HFT...",
    author: {
      name: "Market_Maker",
      avatar: "https://picsum.photos/seed/trader/100/100",
      role: "Teacher",
      region: "Global",
      country: "CH"
    },
    category: "Trading",
    regionId: "global",
    views: 1200,
    replies: 56,
    likes: 89,
    timestamp: "2026-03-10T08:00:00Z",
    isVip: true,
    tags: ["Signals", "Trading", "Alpha"]
  },
  {
    id: "thread-5",
    title: "IELTS 8.0 in 3 months — my exact study plan with Sofia Rossi",
    preview: "Many people ask how I improved my speaking score so fast. It was 100% due to the 1-on-1 practice sessions...",
    author: {
      name: "Emma L.",
      avatar: "https://picsum.photos/seed/emma/100/100",
      role: "Student",
      region: "Europe & Central Asia",
      country: "DE"
    },
    category: "Education",
    regionId: "eca",
    views: 5670,
    replies: 142,
    likes: 312,
    timestamp: "2026-03-08T16:00:00Z",
    isSolved: true,
    tags: ["IELTS", "English", "Europe"]
  }
];

export const FORUM_REPLIES: ForumReply[] = [
  {
    id: "reply-1",
    threadId: "thread-2",
    content: "I've been using Yuki for 3 months and the results are incredible. His method for integration is completely different from what schools teach. Highly recommend booking the monthly package.",
    author: {
      name: "Aryan Mehta",
      avatar: "https://picsum.photos/seed/aryan/100/100",
      role: "Student",
      region: "South Asia",
      country: "IN",
      postsCount: 247,
      memberSince: "Jan 2024"
    },
    likes: 34,
    timestamp: "2026-03-10T15:30:00Z",
    isBestAnswer: true
  },
  {
    id: "reply-2",
    threadId: "thread-2",
    content: "As a fellow teacher on NEXUS, I can confirm that crypto payments make international teaching so much smoother. No bank delays, instant confirmation.",
    author: {
      name: "Priya Sharma",
      avatar: "https://picsum.photos/seed/priya/100/100",
      role: "Teacher",
      region: "South Asia",
      country: "IN",
      postsCount: 156,
      memberSince: "Feb 2024"
    },
    likes: 28,
    timestamp: "2026-03-10T16:00:00Z"
  }
];
