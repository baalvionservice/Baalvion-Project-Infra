import { Teacher, Region, Product } from "./types";

export const REGIONS_DATA: Region[] = [
  { id: 'eap', name: "East Asia & Pacific", icon: "🌏", color: "#00D4FF", description: "Digital innovation hub covering Japan, China, and Oceania." },
  { id: 'eca', name: "Europe & Central Asia", icon: "🌍", color: "#6C63FF", description: "Historical center of academic excellence and cultural exchange." },
  { id: 'lac', name: "Latin America", icon: "🌎", color: "#FF6584", description: "Fastest growing region for conversational language learning." },
  { id: 'men', name: "Middle East & N. Africa", icon: "🕌", color: "#FFD600", description: "Strategic gateway for Islamic studies and global trade." },
  { id: 'nam', name: "North America", icon: "🗽", color: "#00E676", description: "Leading the world in coding bootcamps and tech dev." },
  { id: 'sas', name: "South Asia", icon: "🌿", color: "#FF9500", description: "Elite hub for competitive exam prep and organic chemistry." },
  { id: 'ssa', name: "Sub-Saharan Africa", icon: "🌍", color: "#A855F7", description: "Rising tech landscape with high demand for data science." },
];

export const COUNTRIES_DATA = [
  { id: 'in', name: "India", flag: "🇮🇳", regionId: "sas", admin: "Priya Sharma", revenue: 18420, teachers: 7, students: 70 },
  { id: 'pk', name: "Pakistan", flag: "🇵🇰", regionId: "sas", admin: "Ahmed Khan", revenue: 7230, teachers: 7, students: 70 },
  { id: 'bd', name: "Bangladesh", flag: "🇧🇩", regionId: "sas", admin: "Rahim Chowdhury", revenue: 4560, teachers: 7, students: 70 },
  { id: 'lk', name: "Sri Lanka", flag: "🇱🇰", regionId: "sas", admin: "Nimal Fernando", revenue: 3240, teachers: 7, students: 70 },
  { id: 'np', name: "Nepal", flag: "🇳🇵", regionId: "sas", admin: "Bikram Thapa", revenue: 2890, teachers: 7, students: 70 },
  { id: 'mv', name: "Maldives", flag: "🇲🇻", regionId: "sas", admin: "Hassan Ali", revenue: 1640, teachers: 7, students: 70 },
  { id: 'bt', name: "Bhutan", flag: "🇧🇹", regionId: "sas", admin: "Karma Wangchuk", revenue: 780, teachers: 7, students: 70 },
];

export const TEACHERS: Teacher[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    region: 'South Asia',
    regionId: 'sas',
    country: 'India',
    countryCode: 'IN',
    subject: 'Chemistry',
    price_crypto: '12',
    price_usd: '12',
    currency: 'USDT',
    rating: 4.9,
    reviewCount: 247,
    students_count: 10,
    avatar_url: 'https://picsum.photos/seed/priya/200/200',
    bio: 'Expert in Organic Chemistry and laboratory protocol training.',
    longBio: 'I am a certified chemistry teacher from India. I have helped hundreds of students master organic chemistry for competitive exams like JEE and NEET.',
    memberSince: 'Jan 2024',
    classesGiven: 247,
    hoursTaught: 360,
    totalEarned: '1.24 ETH',
    is_live: false,
    tags: ['Organic', 'Inorganic', 'Exam Prep'],
    skills: [{ name: 'Organic Chemistry', level: 98 }, { name: 'Lab Protocols', level: 92 }],
    education: [{ year: '2016', degree: 'MSc Chemistry', institution: 'IIT Bombay' }]
  },
  {
    id: 'rahul-patel',
    name: 'Rahul Patel',
    region: 'South Asia',
    regionId: 'sas',
    country: 'India',
    countryCode: 'IN',
    subject: 'Physics',
    price_crypto: '0.012',
    price_usd: '35',
    currency: 'ETH',
    rating: 4.8,
    reviewCount: 156,
    students_count: 10,
    avatar_url: 'https://picsum.photos/seed/rahul/200/200',
    bio: 'Specialized in mechanical physics and foundation concepts.',
    is_live: false,
    tags: ['Mechanics', 'Foundation']
  },
  {
    id: 'yuki-tanaka',
    name: 'Yuki Tanaka',
    region: 'East Asia & Pacific',
    regionId: 'eap',
    country: 'Japan',
    countryCode: 'JP',
    subject: 'Mathematics',
    price_crypto: '0.02',
    price_usd: '58',
    currency: 'ETH',
    rating: 4.9,
    reviewCount: 247,
    students_count: 1240,
    avatar_url: 'https://picsum.photos/seed/yuki/200/200',
    bio: 'Specialized in high-level calculus and competitive math strategies.',
    is_live: true,
    tags: ['Calculus', 'Algebra', 'Competitive']
  },
];

export const TICKER_DATA = [
  { pair: 'BTC/USDT', price: '94,231.42', change: '+2.4%' },
  { pair: 'ETH/USDT', price: '3,124.89', change: '-0.8%' },
  { pair: 'SOL/USDT', price: '198.45', change: '+5.1%' },
  { pair: 'BNB/USDT', price: '642.12', change: '+1.2%' },
];
