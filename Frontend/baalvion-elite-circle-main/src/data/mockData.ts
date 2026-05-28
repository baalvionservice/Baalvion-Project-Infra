/**
 * Centralized Mock Data for Protocol Platform
 * TODO: Replace with API calls when backend is ready
 */

// ============= USERS & PROFILES =============
export const mockUsers = [
  { id: "u1", name: "Alex Morgan", email: "alex@protocol.io", status: "online", lastActive: "Just now", joined: "2024-01-15", avatar: "AM", role: "student" },
  { id: "u2", name: "Sarah Chen", email: "sarah@protocol.io", status: "online", lastActive: "2 min ago", joined: "2024-02-20", avatar: "SC", role: "student" },
  { id: "u3", name: "James Wilson", email: "james@protocol.io", status: "offline", lastActive: "1 hour ago", joined: "2024-01-28", avatar: "JW", role: "student" },
  { id: "u4", name: "Emma Davis", email: "emma@protocol.io", status: "online", lastActive: "Just now", joined: "2024-03-05", avatar: "ED", role: "student" },
  { id: "u5", name: "Michael Brown", email: "michael@protocol.io", status: "offline", lastActive: "3 hours ago", joined: "2024-02-14", avatar: "MB", role: "student" },
  { id: "u6", name: "Lisa Johnson", email: "lisa@protocol.io", status: "offline", lastActive: "Yesterday", joined: "2024-01-10", avatar: "LJ", role: "student" },
  { id: "u7", name: "David Lee", email: "david@protocol.io", status: "online", lastActive: "5 min ago", joined: "2024-03-12", avatar: "DL", role: "student" },
  { id: "u8", name: "Anna Martinez", email: "anna@protocol.io", status: "offline", lastActive: "2 days ago", joined: "2024-02-28", avatar: "AM", role: "student" },
];

// ============= EXPERTS =============
export const mockExperts = [
  { id: "e1", name: "Master Trader", title: "Elite Trading Expert", email: "master@protocol.io", country: "United States", status: "active", students: 1284, revenue: 42850, rating: 4.9, avatar: "MT" },
  { id: "e2", name: "Crypto Sage", title: "Blockchain Specialist", email: "sage@protocol.io", country: "United Kingdom", status: "active", students: 892, revenue: 35200, rating: 4.8, avatar: "CS" },
  { id: "e3", name: "Finance Guru", title: "Investment Strategist", email: "guru@protocol.io", country: "India", status: "active", students: 2156, revenue: 68400, rating: 4.9, avatar: "FG" },
  { id: "e4", name: "Tech Oracle", title: "AI & ML Expert", email: "oracle@protocol.io", country: "Germany", status: "pending", students: 0, revenue: 0, rating: 0, avatar: "TO" },
  { id: "e5", name: "Market Maven", title: "Options Specialist", email: "maven@protocol.io", country: "Canada", status: "active", students: 567, revenue: 23100, rating: 4.7, avatar: "MM" },
];

// ============= REVENUE DATA =============
export const mockRevenueData = {
  monthly: [
    { month: "Jan", revenue: 45000, users: 1200 },
    { month: "Feb", revenue: 52000, users: 1450 },
    { month: "Mar", revenue: 48000, users: 1380 },
    { month: "Apr", revenue: 61000, users: 1620 },
    { month: "May", revenue: 72000, users: 1890 },
    { month: "Jun", revenue: 85000, users: 2150 },
  ],
  daily: [
    { day: "Mon", revenue: 12500, transactions: 145 },
    { day: "Tue", revenue: 15200, transactions: 178 },
    { day: "Wed", revenue: 8900, transactions: 112 },
    { day: "Thu", revenue: 18400, transactions: 203 },
    { day: "Fri", revenue: 21000, transactions: 234 },
    { day: "Sat", revenue: 9800, transactions: 98 },
    { day: "Sun", revenue: 6200, transactions: 67 },
  ],
  totals: {
    totalRevenue: 892450,
    totalExperts: 156,
    totalStudents: 12840,
    activeSubscriptions: 8920,
    avgRevenuePerUser: 69.5,
  }
};

// ============= ACTIVITY DATA =============
export const mockActivityData = [
  { day: "Mon", calls: 12, posts: 8, signups: 45 },
  { day: "Tue", calls: 15, posts: 12, signups: 52 },
  { day: "Wed", calls: 8, posts: 6, signups: 38 },
  { day: "Thu", calls: 20, posts: 15, signups: 67 },
  { day: "Fri", calls: 18, posts: 10, signups: 54 },
  { day: "Sat", calls: 5, posts: 4, signups: 23 },
  { day: "Sun", calls: 3, posts: 2, signups: 18 },
];

// ============= FEED POSTS =============
export const mockFeedPosts = [
  {
    id: "p1",
    type: "text",
    content: "Just finished a deep dive into advanced market analysis techniques. The key insight? Patience and pattern recognition are your best friends.",
    author: "Master Trader",
    avatar: "MT",
    time: "2 hours ago",
    likes: 234,
    comments: 45,
    isPinned: true,
  },
  {
    id: "p2",
    type: "audio",
    content: "New audio message available",
    duration: "5:32",
    author: "Master Trader",
    avatar: "MT",
    time: "5 hours ago",
    likes: 189,
    comments: 23,
    isPinned: false,
  },
  {
    id: "p3",
    type: "video",
    content: "Weekly market recap and predictions for the coming week",
    duration: "12:45",
    author: "Master Trader",
    avatar: "MT",
    time: "1 day ago",
    likes: 567,
    comments: 89,
    isPinned: false,
  },
];

// ============= CALLS =============
export const mockCalls = [
  { id: "c1", title: "Weekly Strategy Session", type: "video", scheduled: "Today, 3:00 PM", status: "live", attendees: 347, duration: "1 hour" },
  { id: "c2", title: "Q&A with Premium Members", type: "video", scheduled: "Tomorrow, 5:00 PM", status: "upcoming", attendees: 156, duration: "2 hours" },
  { id: "c3", title: "Quick Check-in", type: "audio", scheduled: "Jan 15, 1:00 PM", status: "upcoming", attendees: 45, duration: "30 min" },
];

// ============= INVITE LINKS =============
export const mockInvites = [
  { id: "i1", code: "ELITE2024", link: "protocol.io/join/ELITE2024", expiry: "7 days", maxUsers: 50, usedBy: 23, price: "Free", status: "active" },
  { id: "i2", code: "PREMIUM99", link: "protocol.io/join/PREMIUM99", expiry: "30 days", maxUsers: 100, usedBy: 67, price: "$99", status: "active" },
  { id: "i3", code: "VIP500", link: "protocol.io/join/VIP500", expiry: "Unlimited", maxUsers: 10, usedBy: 8, price: "$500", status: "active" },
];

// ============= PRODUCTS =============
export const mockProducts = [
  { id: "pr1", type: "message", title: "Weekly Insider Tips", description: "Get exclusive market insights delivered weekly", price: 9.99, originalPrice: 19.99, sales: 145, featured: true },
  { id: "pr2", type: "document", title: "Complete Trading Guide", description: "200+ pages of comprehensive trading strategies", price: 49.99, originalPrice: 99.99, sales: 89, featured: true },
  { id: "pr3", type: "prompt", title: "Market Analysis Template", description: "Professional templates for technical analysis", price: 14.99, originalPrice: null, sales: 234, featured: false },
  { id: "pr4", type: "ai", title: "AI Trading Assistant", description: "Personalized AI-powered trading recommendations", price: 29.99, originalPrice: 59.99, sales: 67, featured: true },
];

// ============= COUNTRIES =============
export const mockCountries = [
  { id: "cn1", name: "United States", code: "US", flag: "🇺🇸", experts: 45, students: 3420, revenue: 245000 },
  { id: "cn2", name: "United Kingdom", code: "UK", flag: "🇬🇧", experts: 28, students: 1890, revenue: 156000 },
  { id: "cn3", name: "India", code: "IN", flag: "🇮🇳", experts: 34, students: 4560, revenue: 189000 },
  { id: "cn4", name: "Germany", code: "DE", flag: "🇩🇪", experts: 19, students: 1230, revenue: 98000 },
  { id: "cn5", name: "Canada", code: "CA", flag: "🇨🇦", experts: 22, students: 1670, revenue: 134000 },
  { id: "cn6", name: "Australia", code: "AU", flag: "🇦🇺", experts: 15, students: 980, revenue: 87000 },
];

// ============= NOTIFICATIONS =============
export const mockNotifications = [
  { id: "n1", type: "signup", message: "New expert application received", time: "2 min ago", read: false },
  { id: "n2", type: "revenue", message: "Revenue milestone: $100k this month", time: "1 hour ago", read: false },
  { id: "n3", type: "alert", message: "System maintenance scheduled", time: "3 hours ago", read: true },
];

// ============= EMPTY STATE MESSAGES =============
export const emptyStateMessages = {
  noStudents: {
    title: "No members enrolled yet",
    description: "The protocol awakens once members join. Share your invite link to begin.",
    icon: "users",
  },
  noReports: {
    title: "No reports generated",
    description: "Analytics will materialize as activity flows through the protocol.",
    icon: "chart",
  },
  noPosts: {
    title: "The feed awaits content",
    description: "Create your first post to initiate the knowledge transfer protocol.",
    icon: "message",
  },
  noRevenue: {
    title: "Revenue streams pending",
    description: "Financial flows will manifest as transactions traverse the network.",
    icon: "dollar",
  },
  noExperts: {
    title: "Expert network initializing",
    description: "The collective awaits its first thought leaders.",
    icon: "crown",
  },
  noCalls: {
    title: "No sessions scheduled",
    description: "The virtual chambers remain dormant. Schedule your first session.",
    icon: "video",
  },
  noProducts: {
    title: "Content vault empty",
    description: "Premium artifacts will appear once created.",
    icon: "package",
  },
};
