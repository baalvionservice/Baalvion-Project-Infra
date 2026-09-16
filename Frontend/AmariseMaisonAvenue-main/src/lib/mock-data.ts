import {
  Country,
  Product,
  Category,
  Department,
  Collection,
  City,
  BuyingGuide,
  Editorial,
  MaisonStory,
  CustomerServiceInfo,
  VipClient,
  AdminAccount,
  Vendor,
  Campaign,
  AuditLog,
  CustomerSegment,
  SupportTicket,
  SupportStats,
  MaisonIntegration,
  ApiLog,
  IndexingStatus,
  IndexingLog,
  Appointment,
  Invoice,
  Affiliate,
  ReturnRequest,
  CountryCode,
  PaymentPlan,
  FXRate,
  TaxRule,
  Subscription,
} from "./types";
import type {
  HomepageContent,
  PressContent,
  FooterConfig,
  AppointmentsPageContent,
  AuthenticityPageContent,
  ContactPageContent,
  ProvenanceShowcaseContent,
} from "./cms";

// NOTE: office.address / phone / mapUrl are intentionally blank. They previously held
// invented street addresses at real landmarks (730 Fifth Avenue, Old Bond Street, The
// Dubai Mall, Jio World Centre, Marina Bay Sands) with 555-0192 placeholder numbers, and
// were emitted as schema.org Store data. Fill these in only with a real trading address.
export const COUNTRIES: Record<string, Country> = {
  us: {
    code: "us",
    name: "USA",
    currency: "USD",
    symbol: "$",
    locale: "en-US",
    flag: "🇺🇸",
    office: {
      city: "New York",
      address: "",
      phone: "",
      email: "concierge.us@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
  uk: {
    code: "uk",
    name: "UK",
    currency: "GBP",
    symbol: "£",
    locale: "en-GB",
    flag: "🇬🇧",
    office: {
      city: "London",
      address: "",
      phone: "",
      email: "concierge.uk@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
  ae: {
    code: "ae",
    name: "UAE",
    currency: "AED",
    symbol: "د.إ",
    locale: "ar-AE",
    flag: "🇦🇪",
    office: {
      city: "Dubai",
      address: "",
      phone: "",
      email: "concierge.ae@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
  in: {
    code: "in",
    name: "India",
    currency: "INR",
    symbol: "₹",
    locale: "en-IN",
    flag: "🇮🇳",
    office: {
      city: "Mumbai",
      address: "",
      phone: "",
      email: "concierge.in@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
  sg: {
    code: "sg",
    name: "Singapore",
    currency: "SGD",
    symbol: "S$",
    locale: "en-SG",
    flag: "🇸🇬",
    office: {
      city: "Singapore",
      address: "",
      phone: "",
      email: "concierge.sg@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
  ca: {
    code: "ca",
    name: "Canada",
    currency: "CAD",
    symbol: "C$",
    locale: "en-CA",
    flag: "🇨🇦",
    office: {
      city: "Toronto",
      address: "",
      phone: "",
      email: "concierge.ca@amarise-luxe.com",
      mapUrl: "",
      image: "",
    },
  },
};

export const COLORS = [
  "Ivory",
  "Gold",
  "Plum",
  "Midnight",
  "Emerald",
  "Sapphire",
  "Onyx",
];
export const SIZES = ["XS", "S", "M", "L", "XL", "One Size", "Bespoke"];


export const CITIES: City[] = [
  {
    id: "new-york",
    name: "New York",
    countryCode: "us",
    description: "The global pulse.",
    heroImage: "https://picsum.photos/seed/ny-luxe/1920/1080",
    featuredCollections: ["heritage"],
    featuredProducts: ["prod-1", "prod-2"],
    office: COUNTRIES.us.office!,
    trends: [
      { title: "Fifth Ave Minimalism", description: "Monochrome tailoring." },
    ],
  },
  {
    id: "london",
    name: "London",
    countryCode: "uk",
    description: "The heritage soul.",
    heroImage: "https://picsum.photos/seed/ldn-luxe/1920/1080",
    featuredCollections: ["spring-24"],
    featuredProducts: ["prod-3", "prod-4"],
    office: COUNTRIES.uk.office!,
    trends: [
      { title: "Bond Street Classic", description: "Traditional Bespoke." },
    ],
  },
  {
    id: "dubai",
    name: "Dubai",
    countryCode: "ae",
    description: "The desert oasis of gold.",
    heroImage: "https://picsum.photos/seed/dxb-luxe/1920/1080",
    featuredCollections: ["prive"],
    featuredProducts: ["prod-5", "prod-6"],
    office: COUNTRIES.ae.office!,
    trends: [{ title: "Desert Opulence", description: "High Jewelry Focus." }],
  },
];

const generateSEOContent = () => {
  const editorials: Editorial[] = [];
  const guides: BuyingGuide[] = [];

  const topics = [
    {
      title: "The Architecture of Time",
      category: "Artisanal",
      keyword: "luxury watch investment",
    },
    {
      title: "Haute Couture: A Human Dialogue",
      category: "Seasonal",
      keyword: "bespoke couture trends",
    },
    {
      title: "The Soul of Silk",
      category: "Artisanal",
      keyword: "heritage silk craft",
    },
    {
      title: "Opaque Brilliance: Diamonds of the Future",
      category: "Artisanal",
      keyword: "rare diamond collecting",
    },
    {
      title: "Atelier Secrets: Bond Street",
      category: "City Edit",
      keyword: "London luxury shopping guide",
    },
    {
      title: "The Midnight Collection Narrative",
      category: "VIP Exclusive",
      keyword: "limited edition luxury apparel",
    },
  ];

  const countryCodes: CountryCode[] = ["us", "uk", "ae", "in", "sg"];

  for (let i = 1; i <= 100; i++) {
    const country = countryCodes[i % countryCodes.length];
    const topic = topics[i % topics.length];

    editorials.push({
      id: `seo-ed-${i}`,
      title: `${topic.title} in ${COUNTRIES[country].name}`,
      excerpt: `An exploration of ${topic.keyword} within the global Maison context.`,
      content: `In the heart of our global ateliers, the pursuit of ${topic.keyword} remains a dialogue between human brilliance and timeless heritage. Whether observing the craftsmanship in ${COUNTRIES[country].office?.city}, the standard of the absolute is never compromised.`,
      imageUrl: `https://picsum.photos/seed/amarise-seo-${i}/1200/800`,
      category: topic.category as any,
      country: country,
      author: "Elena Vance",
      date: "2024-03-01",
      isVip: i % 10 === 0,
      featuredProducts: [`prod-${i}`, `prod-${i + 1}`],
      targetKeyword: topic.keyword,
      metaDescription: `Discover the expert perspective on ${topic.keyword} at Maison Amarisé. Local context for ${COUNTRIES[country].name}.`,
      contentOutline: [
        "The Heritage of Craft",
        "Modern Market Dynamics",
        "The Collector Perspective",
      ],
      brandId: "amarise-luxe",
      isGlobal: false,
    });

    if (i <= 25) {
      guides.push({
        id: `seo-bg-${i}`,
        title: `The ${COUNTRIES[country].name} Guide to ${topic.keyword}`,
        excerpt: `A masterclass in identifying and acquiring the pinnacle of ${topic.category}.`,
        content: `Acquiring an artifact of this magnitude requires more than wealth; it requires intelligence. This guide explores the provenance, materiality, and emotional resonance of ${topic.keyword}.`,
        tips: [
          `Verify the hallmark of the master artisan.`,
          `Understand the heritage significance of materials.`,
          `Analyze the global investment trajectory.`,
        ],
        featuredProducts: [`prod-${i}`, `prod-${i + 5}`],
        featuredCollections: ["heritage", "prive"],
        imageUrl: `https://picsum.photos/seed/amarise-guide-${i}/1200/800`,
        category: topic.category,
        country: country,
        date: "2024-03-10",
        author: "Elena Vance",
        targetKeyword: `${topic.keyword} buying guide`,
        metaDescription: `Expert advice on ${topic.keyword} acquisition from the senior curators at Maison Amarisé.`,
        investmentOutlook: `Steady 12-15% annual appreciation observed in this category over the last decade.`,
        brandId: "amarise-luxe",
        isGlobal: false,
      });
    }
  }

  return { editorials, guides };
};

const seoContent = generateSEOContent();
export const EDITOR_INITIAL = seoContent.editorials;
export const BUYING_GUIDES = seoContent.guides;

export const MAISON_STORY: MaisonStory = {
  title: "A Standard, Not a Story",
  subtitle: "Established 2025.",
  history: [
    {
      year: "2025",
      milestone: "Founded",
      description: "Amarisé Maison Avenue was established on 11 March 2025.",
    },
  ],
  philosophy: "Provenance before prestige.",
  // We authenticate and resell — we do not manufacture. No atelier or craft claims here.
  craftsmanship: [],
  sustainability: "Preserving the earth.",
  institutionalCharter:
    "Our mission is to maintain the standard of the absolute in every artifact we curate.",
  brandId: "amarise-luxe",
};

export const CUSTOMER_SERVICE: Record<string, CustomerServiceInfo> = {
  us: {
    shipping:
      "White-glove delivery within the United States through our premium logistics network.",
    returns:
      "30-day return policy with free shipping and full authenticity verification.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Contact our concierge team to arrange a private viewing at our New York atelier.",
      },
      {
        question: "Do you offer international shipping?",
        answer:
          "Yes, we provide white-glove shipping worldwide with full insurance coverage.",
      },
      {
        question: "What is your authenticity guarantee?",
        answer:
          "Every piece undergoes rigorous verification by our master curators.",
      },
    ],
  },
  uk: {
    shipping:
      "White-glove delivery within the United Kingdom through our premium logistics network.",
    returns:
      "30-day return policy with free shipping and full authenticity verification.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Contact our concierge team to arrange a private viewing at our London atelier.",
      },
      {
        question: "Do you offer international shipping?",
        answer:
          "Yes, we provide white-glove shipping worldwide with full insurance coverage.",
      },
      {
        question: "What is your authenticity guarantee?",
        answer:
          "Every piece undergoes rigorous verification by our master curators.",
      },
    ],
  },
  ae: {
    shipping:
      "All UAE orders are fulfilled from our international ateliers and delivered via trusted global logistics partners. Order Processing: 1–2 business days. Transit Time: 3–7 business days. Estimated Delivery: 4–9 business days. Free standard shipping across the United Arab Emirates with full insurance coverage.",
    returns:
      "We accept returns for both defective and non-defective products within 30 days of delivery. Items must be unused and in original condition with original packaging, tags, and seals intact. Returns accepted by mail only with free return shipping provided. Refunds processed within 5–7 business days after inspection and approval.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Private consultations are available upon request. Contact our concierge team for a bespoke consultation.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Orders can be cancelled before dispatch. Once shipped, the return policy applies.",
      },
      {
        question: "What if my item arrives damaged?",
        answer: "Contact us within 48 hours with photos for immediate support.",
      },
      {
        question: "What about customs and duties?",
        answer:
          "Duties and taxes (if applicable) are clearly communicated at checkout with no hidden charges after purchase.",
      },
    ],
  },
  in: {
    shipping:
      "White-glove delivery within India through our premium logistics network.",
    returns:
      "30-day return policy with free shipping and full authenticity verification.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Contact our concierge team to arrange a private viewing at our Mumbai atelier.",
      },
      {
        question: "Do you offer international shipping?",
        answer:
          "Yes, we provide white-glove shipping worldwide with full insurance coverage.",
      },
      {
        question: "What is your authenticity guarantee?",
        answer:
          "Every piece undergoes rigorous verification by our master curators.",
      },
    ],
  },
  sg: {
    shipping:
      "All Singapore orders are fulfilled from our international ateliers and delivered via trusted global logistics partners. Order Processing: 1–2 business days. International Transit: 4–8 business days. Estimated Delivery: 5–10 business days. Free standard shipping on all orders to Singapore with full insurance coverage.",
    returns:
      "We accept returns for both defective and non-defective products within 30 days of delivery. Items must be unused and in original condition with original packaging, tags, seals, and certificates intact. Returns accepted by mail only with free return shipping provided. Refunds processed within 5–7 business days after inspection and approval.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Private consultations are available upon request. Contact our concierge team for a bespoke consultation.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Orders can be cancelled before dispatch. Once shipped, the return policy applies.",
      },
      {
        question: "What if my item arrives damaged?",
        answer:
          "Contact us within 48 hours with photos for immediate assistance.",
      },
      {
        question: "What about customs and duties?",
        answer:
          "Any applicable duties or taxes are clearly communicated at checkout with no hidden charges after purchase.",
      },
    ],
  },
  ca: {
    shipping:
      "All Canadian orders are fulfilled from our international ateliers and shipped through trusted global logistics partners. Order Processing: 1–2 business days. International Transit: 5–10 business days. Estimated Delivery: 6–12 business days. Free standard shipping on all orders to Canada with full insurance coverage.",
    returns:
      "We accept returns for both defective and non-defective products within 30 days of delivery. Items must be unused and in original condition with original packaging, tags, seals, and certificates intact. Returns accepted by mail only with free return shipping provided. Refunds processed within 5–7 business days after inspection and approval.",
    faqs: [
      {
        question: "How can I book a private viewing?",
        answer:
          "Private consultations are available upon request. Contact our concierge team for a bespoke consultation.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Orders can be cancelled before dispatch. Once shipped, the return policy applies.",
      },
      {
        question: "What if my item arrives damaged?",
        answer:
          "Please contact us within 48 hours of delivery with photos, and we will assist immediately.",
      },
      {
        question: "What about customs and duties?",
        answer:
          "Any applicable customs duties or taxes are clearly communicated at checkout with no hidden charges after purchase.",
      },
    ],
  },
};

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "plan-silver",
    name: "Silver Member",
    price: 500,
    currency: "USD",
    interval: "yearly",
    tier: "Silver",
    features: ["Curatorial Access", "Standard Shipping", "Digital Provenance"],
  },
  {
    id: "plan-gold",
    name: "Maison Gold",
    price: 2500,
    currency: "USD",
    interval: "yearly",
    tier: "Gold",
    isPopular: true,
    features: [
      "Priority Viewings",
      "White-Glove Dispatch",
      "Annual Heritage Report",
    ],
  },
  {
    id: "plan-diamond",
    name: "Atelier Diamond",
    price: 10000,
    currency: "USD",
    interval: "yearly",
    tier: "Diamond",
    features: [
      "Private Salon Keys",
      "Investment Advisory",
      "Bespoke Sourcing",
      "Unlimited Live Ateliers",
    ],
  },
];

export const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    userId: "u-client-1",
    planId: "plan-gold",
    planName: "Maison Gold",
    status: "ACTIVE",
    currentPeriodStart: "2024-01-01T00:00:00Z",
    currentPeriodEnd: "2025-01-01T00:00:00Z",
    amount: 2500,
  },
];

export const FX_RATES: FXRate[] = [
  {
    currencyCode: "USD",
    baseCurrency: "USD",
    rate: 1,
    spread: 0,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
  {
    currencyCode: "GBP",
    baseCurrency: "USD",
    rate: 0.79,
    spread: 0.02,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
  {
    currencyCode: "AED",
    baseCurrency: "USD",
    rate: 3.67,
    spread: 0.01,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
  {
    currencyCode: "INR",
    baseCurrency: "USD",
    rate: 83.2,
    spread: 0.03,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
  {
    currencyCode: "SGD",
    baseCurrency: "USD",
    rate: 1.34,
    spread: 0.02,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
  {
    currencyCode: "CAD",
    baseCurrency: "USD",
    rate: 1.36,
    spread: 0.02,
    lastUpdated: "2024-03-15T12:00:00Z",
    source: "Maison Core",
  },
];

export const TAX_RULES: TaxRule[] = [
  {
    id: "tax-us-gen",
    country: "us",
    taxType: "SALES_TAX",
    category: "general",
    rate: 8.875,
    isInclusive: false,
    lastUpdated: "2024-03-15T12:00:00Z",
  },
  {
    id: "tax-uk-gen",
    country: "uk",
    taxType: "VAT",
    category: "general",
    rate: 20,
    isInclusive: true,
    lastUpdated: "2024-03-15T12:00:00Z",
  },
  {
    id: "tax-ae-gen",
    country: "ae",
    taxType: "VAT",
    category: "general",
    rate: 5,
    isInclusive: true,
    lastUpdated: "2024-03-15T12:00:00Z",
  },
  {
    id: "tax-in-gen",
    country: "in",
    taxType: "GST",
    category: "general",
    rate: 18,
    isInclusive: true,
    lastUpdated: "2024-03-15T12:00:00Z",
  },
  {
    id: "tax-sg-gen",
    country: "sg",
    taxType: "GST",
    category: "general",
    rate: 9,
    isInclusive: true,
    lastUpdated: "2024-03-15T12:00:00Z",
  },
];

export const AFFILIATES: Affiliate[] = [
  {
    id: "aff-1",
    name: "Elena Vance",
    tier: "Diamond",
    referralCode: "ELENA1924",
    salesGenerated: 125000,
    commissionEarned: 12500,
    status: "active",
    brandId: "amarise-luxe",
  },
  {
    id: "aff-2",
    name: "Marcus Aurelius",
    tier: "Gold",
    referralCode: "MARCUS",
    salesGenerated: 45000,
    commissionEarned: 4500,
    status: "active",
    brandId: "amarise-luxe",
  },
];

export const RETURNS: ReturnRequest[] = [
  {
    id: "ret-1",
    orderId: "AM-1001",
    productId: "prod-1",
    reason: "Size mismatch",
    status: "pending",
    warehouseId: "wh-ny",
    requestedAt: "2024-03-15T10:00:00Z",
    brandId: "amarise-luxe",
    country: "us",
  },
];

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: "adm-super",
    name: "Julian Vandervilt",
    email: "julian@amarise-luxe.com",
    role: "super_admin",
    permissions: ["*"],
    status: "active",
    lastActive: "2024-03-15T10:00:00Z",
    twoFactorEnabled: true,
  },
  {
    id: "adm-us",
    name: "Hub Lead (USA)",
    email: "admin.us@amarise-luxe.com",
    role: "manager",
    permissions: ["all"],
    status: "active",
    lastActive: "2024-03-15T09:30:00Z",
    twoFactorEnabled: true,
  },
  {
    id: "adm-uk",
    name: "Hub Lead (UK)",
    email: "admin.uk@amarise-luxe.com",
    role: "manager",
    permissions: ["all"],
    status: "active",
    lastActive: "2024-03-15T11:00:00Z",
    twoFactorEnabled: true,
  },
  {
    id: "adm-ae",
    name: "Hub Lead (UAE)",
    email: "admin.ae@amarise-luxe.com",
    role: "manager",
    permissions: ["all"],
    status: "active",
    lastActive: "2024-03-15T11:00:00Z",
    twoFactorEnabled: true,
  },
  {
    id: "adm-in",
    name: "Hub Lead (India)",
    email: "admin.in@amarise-luxe.com",
    role: "manager",
    permissions: ["all"],
    status: "active",
    lastActive: "2024-03-15T11:00:00Z",
    twoFactorEnabled: true,
  },
  {
    id: "adm-sg",
    name: "Hub Lead (Singapore)",
    email: "admin.sg@amarise-luxe.com",
    role: "manager",
    permissions: ["all"],
    status: "active",
    lastActive: "2024-03-15T11:00:00Z",
    twoFactorEnabled: true,
  },
];

export const VENDORS: Vendor[] = [
  {
    id: "vend-1",
    name: "Lumière Silks",
    category: "Accessories",
    performance: 98,
    productCount: 45,
    salesTotal: 125000,
    status: "active",
    payoutSchedule: "weekly",
    joinedDate: "2023-01-10",
    kpis: { returnRate: 1.2, fulfillmentSpeed: "1.2 days", rating: 4.9 },
    brandId: "amarise-luxe",
  },
  {
    id: "vend-2",
    name: "Geneva Horology",
    category: "Watches",
    performance: 95,
    productCount: 12,
    salesTotal: 850000,
    status: "active",
    payoutSchedule: "monthly",
    joinedDate: "2023-05-15",
    kpis: { returnRate: 0.5, fulfillmentSpeed: "2.4 days", rating: 4.8 },
    brandId: "amarise-luxe",
  },
  {
    id: "vend-3",
    name: "Artisanal Gold",
    category: "Jewelry",
    performance: 92,
    productCount: 28,
    salesTotal: 340000,
    status: "active",
    payoutSchedule: "weekly",
    joinedDate: "2023-08-20",
    kpis: { returnRate: 2.1, fulfillmentSpeed: "1.8 days", rating: 4.7 },
    brandId: "amarise-luxe",
  },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    title: "Midnight Soirée Flash Sale",
    type: "Flash Sale",
    status: "scheduled",
    discountValue: 15,
    startDate: "2024-04-01",
    endDate: "2024-04-03",
    market: "global",
    reach: 45000,
    conversions: 1200,
    roi: 4.5,
    predictedRoi: 5.2,
    abTestActive: true,
    brandId: "amarise-luxe",
  },
  {
    id: "camp-2",
    title: "Heritage Collection Launch",
    type: "Launch",
    status: "active",
    discountValue: 0,
    startDate: "2024-03-10",
    endDate: "2024-03-25",
    market: "us",
    reach: 120000,
    conversions: 800,
    roi: 8.2,
    predictedRoi: 9.0,
    abTestActive: false,
    brandId: "amarise-luxe",
  },
  {
    id: "camp-3",
    title: "Spring Equinox Newsletter",
    type: "Email",
    status: "completed",
    discountValue: 10,
    startDate: "2024-03-01",
    endDate: "2024-03-05",
    market: "global",
    reach: 250000,
    conversions: 4500,
    roi: 12.4,
    predictedRoi: 11.5,
    abTestActive: true,
    brandId: "amarise-luxe",
  },
];

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: "seg-1",
    name: "Ultra-High Net Worth",
    description: "Clients with >$100k lifetime spend.",
    userCount: 450,
    avgOrderValue: 12500,
    tags: ["Diamond", "Bespoke"],
    predictedChurn: 0.05,
    brandId: "amarise-luxe",
  },
  {
    id: "seg-2",
    name: "Seasonal Enthusiasts",
    description: "Purchased in last 3 months.",
    userCount: 2800,
    avgOrderValue: 3200,
    tags: ["Active", "Fashion"],
    predictedChurn: 0.15,
    brandId: "amarise-luxe",
  },
  {
    id: "seg-3",
    name: "Dormant Connoisseurs",
    description: "No purchase in 12 months.",
    userCount: 1200,
    avgOrderValue: 4500,
    tags: ["Inactive", "Luxury"],
    predictedChurn: 0.45,
    brandId: "amarise-luxe",
  },
];

export const APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    customerId: "vip-1",
    customerName: "Julian Vandervilt",
    type: "Private Viewing",
    date: "2024-03-20",
    time: "14:00",
    city: "London",
    status: "confirmed",
    brandId: "amarise-luxe",
  },
  {
    id: "apt-2",
    customerId: "vip-2",
    customerName: "Sophia Chen",
    type: "Virtual Try-on",
    date: "2024-03-22",
    time: "10:30",
    city: "Dubai",
    status: "pending",
    brandId: "amarise-luxe",
  },
];

export const INVOICES: Invoice[] = [
  {
    id: "inv-1001",
    orderId: "AM-1001",
    customerName: "Julian Vandervilt",
    amount: 45000,
    currency: "USD",
    status: "paid",
    date: "2024-03-10",
    taxAmount: 3600,
    taxRate: 8,
    complianceCertified: true,
    brandId: "amarise-luxe",
  },
  {
    id: "inv-1002",
    orderId: "AM-1002",
    customerName: "Sophia Chen",
    amount: 12500,
    currency: "GBP",
    status: "issued",
    date: "2024-03-14",
    taxAmount: 2500,
    taxRate: 20,
    complianceCertified: true,
    brandId: "amarise-luxe",
  },
];

export const AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    adminId: "adm-1",
    adminName: "Maison CEO",
    action: "Approved Vendor Geneva Horology",
    module: "Vendor Management",
    timestamp: "2024-03-15T08:00:00Z",
    ipAddress: "Institutional Node Alpha",
    severity: "low",
  },
  {
    id: "log-2",
    adminId: "adm-2",
    adminName: "Operations Lead",
    action: "Updated Global Tax Rules (UAE)",
    module: "Website Settings",
    timestamp: "2024-03-15T07:45:00Z",
    ipAddress: "Institutional Node Beta",
    severity: "medium",
  },
];

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "t-1",
    customerId: "vip-1",
    customerName: "Julian Vandervilt",
    customerTier: "Diamond",
    subject: "Provenance inquiry regarding Heritage series",
    status: "open",
    priority: "urgent",
    category: "Product Query",
    lastMessage: "I am seeking archival documentation for the 1924 series.",
    updatedAt: "2024-03-15T12:00:00Z",
    createdAt: "2024-03-15T10:00:00Z",
    messages: [
      {
        id: "m-1",
        sender: "customer",
        text: "I am seeking archival documentation for the 1924 series.",
        timestamp: "2024-03-15T10:00:00Z",
      },
    ],
    brandId: "amarise-luxe",
  },
];

export const SUPPORT_STATS: SupportStats = {
  openTickets: 12,
  resolvedToday: 8,
  avgResponseTime: "12m",
  csatScore: 4.9,
  activeChats: 4,
};

export const INTEGRATIONS: MaisonIntegration[] = [
  {
    id: "i-1",
    name: "Global Payment Node",
    type: "Payment",
    provider: "Stripe Institutional",
    status: "Connected",
    lastSync: "2024-03-15T12:00:00Z",
    uptime: 99.9,
    brandId: "amarise-luxe",
  },
  {
    id: "i-2",
    name: "White-Glove Logistics",
    type: "Logistics",
    provider: "FedEx Custom Critical",
    status: "Connected",
    lastSync: "2024-03-15T12:00:00Z",
    uptime: 99.8,
    brandId: "amarise-luxe",
  },
];

export const API_LOGS: ApiLog[] = [
  {
    id: "log-1",
    timestamp: "2024-03-15T12:00:00Z",
    endpoint: "/v1/authorize",
    method: "POST",
    status: 200,
    latency: "42ms",
    integrationId: "i-1",
  },
  {
    id: "log-2",
    timestamp: "2024-03-15T11:55:00Z",
    endpoint: "/v1/shipping/quote",
    method: "GET",
    status: 200,
    latency: "124ms",
    integrationId: "i-2",
  },
];

export const INDEXING_STATUS: IndexingStatus = {
  catalogItems: 1240,
  indexedItems: 1240,
  lastFullScan: "2024-03-15T08:00:00Z",
  searchEngineStatus: "Optimal",
  sitemapStatus: "Up to date",
  autoSyncEnabled: true,
};

export const INDEXING_LOGS: IndexingLog[] = [
  {
    id: "idx-1",
    timestamp: "2024-03-15T08:00:00Z",
    action: "Catalog Re-index",
    itemsAffected: 1240,
    duration: "1.2s",
    status: "Success",
  },
];

export const formatPrice = (price: number, countryCode: string = "us") => {
  const country = COUNTRIES[countryCode] || COUNTRIES.us;
  const rates: Record<string, number> = {
    us: 1,
    uk: 0.79,
    ae: 3.67,
    in: 83.2,
    sg: 1.34,
  };
  const converted = price * (rates[countryCode] || 1);

  // Custom HSS Formatting for prod-11
  if (price === 31741.89) {
    return `€31,741.89`;
  }

  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: 0,
  }).format(converted);
};

export const getLocalizedMockText = (text: string, countryCode: string) => text;

/**
 * Last-resort homepage copy used when the CMS is unseeded or unreachable, so the
 * storefront landing page is NEVER blank. Mirrors the `homepage` CMS document the
 * admin edits (src/lib/cms.ts → getHomepage). Images are intentionally left empty
 * so <BrandImage> renders the elegant branded panel until real photography is
 * uploaded from the admin Media library. Positioning = hybrid maison heritage +
 * authenticated resale.
 */
export const HOMEPAGE_FALLBACK: HomepageContent = {
  hero: {
    eyebrow: "Maison Amarisé · Est. 2025",
    title: "The Art of Authenticated Luxury",
    subtitle:
      "Rare and pre-owned Hermès, Chanel and fine jewelry — every piece authenticated in-house before it is listed.",
    ctaLabel: "Discover New Arrivals",
    ctaHref: "/category/new-arrivals-handbags",
    secondaryCtaLabel: "Sell or Consign",
    secondaryCtaHref: "/how-to-sell",
    image: "",
  },
  announcements: [
    "Complimentary white-glove delivery worldwide",
    "Read our 100% Authenticity Guarantee",
    "Book a private appointment — in showroom or virtually",
  ],
  featuredCollections: [
    { title: "Hermès", subtitle: "Birkin, Kelly & the rare archive", image: "", href: "/category/hermes-handbags" },
    { title: "Chanel", subtitle: "Timeless flaps & vintage", image: "", href: "/category/chanel-bags" },
    { title: "Fine Jewelry", subtitle: "Van Cleef, Cartier & heritage", image: "", href: "/category/fine-jewelry" },
    { title: "New Arrivals", subtitle: "The latest acquisitions", image: "", href: "/category/new-arrivals-handbags" },
  ],
  newArrivals: {
    title: "New Arrivals",
    subtitle: "The latest treasures to enter the Maison, ready to ship.",
    limit: 8,
    ctaLabel: "Shop All New Arrivals",
    ctaHref: "/category/new-arrivals-handbags",
  },
  services: [
    {
      icon: "ShieldCheck",
      title: "100% Authenticity Guarantee",
      body: "Every piece is verified in-house by master authenticators and ships with its certificate of provenance.",
      ctaLabel: "Our Guarantee",
      href: "/authenticity",
    },
    {
      icon: "Repeat",
      title: "Sell or Consign",
      body: "Receive a fast, fair quote for your Hermès, Chanel and fine jewelry. White-glove, fully insured.",
      ctaLabel: "Get a Quote",
      href: "/how-to-sell",
    },
    {
      icon: "Crown",
      title: "Private Concierge",
      body: "Personal acquisitions, private viewings and bespoke sourcing through your dedicated client advisor.",
      ctaLabel: "Book an Appointment",
      href: "/appointments",
    },
  ],
  trust: {
    title: "The Maison Standard of Authenticity",
    body: "For a century, Amarisé has been trusted for the rare, the iconic and the extraordinary. Every acquisition passes a rigorous multi-point authentication before it is offered to our clients.",
    badge: "100% Authentic, Guaranteed",
    points: [
      "In-house expert authentication on every item",
      "Certificate of provenance with each piece",
      "Fully insured, white-glove global delivery",
      "30-day returns with complete buyer protection",
    ],
  },
  testimonials: [
    {
      quote:
        "The most trusted name for a collector. My Birkin arrived flawless, with provenance documented to the stitch.",
      author: "Isabella R.",
      location: "New York",
    },
    {
      quote:
        "Discreet, impeccable and genuinely expert. The concierge sourced a piece I had searched years for.",
      author: "Amelia K.",
      location: "London",
    },
    {
      quote:
        "Consigning with Amarisé was effortless — a fair valuation and payment faster than I imagined.",
      author: "Sophia L.",
      location: "Dubai",
    },
  ],
  pressTitle: "As Seen In",
  pressSubtitle: "Recognised by the world's leading authorities on luxury.",
};

/**
 * Fallback press content for /press when the CMS is unseeded. Logos use empty
 * image URLs so the wordmark renders until real assets are uploaded in admin.
 */
export const PRESS_FALLBACK: PressContent = {
  title: "Amarisé in the Press",
  subtitle: "",
  // Deliberately empty. This previously listed Vogue, Bloomberg, the Financial Times, WWD,
  // Robb Report and Harper's Bazaar as "As Seen In", with three invented articles attributed
  // to those mastheads — all href:"#". The house was founded 11 March 2025 and has no press
  // coverage; naming real publications as endorsers is a false-association claim, not a
  // placeholder. PressStrip returns null on an empty logos array, so the strip simply does
  // not render until there is something real to put in it.
  logos: [],
  articles: [],
};

export const FOOTER_FALLBACK: FooterConfig = {
  columns: [
    {
      title: "Customer Care",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "My Account", href: "/account" },
        { label: "Track Order", href: "/track-order" },
        { label: "Shipping & Returns", href: "/customer-service" },
        { label: "Authenticity Guarantee", href: "/customer-service" },
        { label: "Sell To Us", href: "/how-to-sell" },
        { label: "Showrooms", href: "/appointments" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Visit Us", href: "/contact" },
        { label: "Message From Our Founder", href: "/about" },
        { label: "Affiliates", href: "/journal" },
        { label: "Blog", href: "/journal" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      title: "Shop",
      links: [
        { label: "Archive Registry", href: "/category/hermes" },
        { label: "New Arrivals", href: "/category/new-arrivals" },
        { label: "Hermès", href: "/category/hermes" },
        { label: "Chanel", href: "/category/chanel" },
      ],
    },
    {
      title: "Sell With Us",
      links: [
        { label: "How to Consign", href: "/how-to-sell" },
        { label: "Partner Portal", href: "/sell" },
      ],
    },
  ],
  socialLinks: [
    { name: "Phone", href: "tel:+1234567890", icon: "phone" },
    { name: "Email", href: "mailto:info@amarisemaisonavenue.com", icon: "email" },
    { name: "Whatsapp", href: "https://wa.me/1234567890", icon: "whatsapp" },
  ],
  trustBadge: {
    eyebrow: "100% Authentic",
    title: "Guaranteed",
    description: "The #1 Trusted Seller of New & Pre-Owned Hermès Bags",
  },
  brandName: "AMARISÉ",
  brandSuffix: "MAISON AVENUE",
  copyrightText:
    "© 2026 Amarisé Maison Avenue. All Rights Reserved. Amarisé Maison Avenue is a registered Trademark of Amarisé Maison Avenue Inc.",
  legalLinks: [
    { label: "Our Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};

export const APPOINTMENTS_PAGE_FALLBACK: AppointmentsPageContent = {
  eyebrow: "Private Salon Experience",
  title: "Book Your Visit",
  quoteTitle: "The Atelier Protocol",
  quote:
    "An intimate exploration of the Maison's archive, guided by our senior curators in a private environment.",
  benefits: [
    { icon: "ShieldCheck", label: "Complimentary Viewing", description: "No acquisition obligation." },
    { icon: "Globe", label: "Global Concierge", description: "Available in all 5 international hubs." },
    { icon: "Sparkles", label: "Bespoke Presentation", description: "Curated selection based on your taste." },
  ],
  appointmentTypes: [
    { value: "showroom", label: "Private Showroom Viewing" },
    { value: "virtual", label: "Virtual Try-on" },
    { value: "in_home", label: "In-Home Presentation" },
    { value: "phone", label: "Telephone Consultation" },
  ],
};

export const AUTHENTICITY_FALLBACK: AuthenticityPageContent = {
  eyebrow: "The AMARISÉ Standard",
  title: "Authenticity, Guaranteed.",
  subtitle:
    "Provenance is the soul of an artifact. Every piece in our registry is authenticated by experts and certified — so your acquisition is beyond question.",
  steps: [
    { icon: "Microscope", title: "Expert Examination", body: "In-house gemologists and master authenticators inspect hardware, stitching, materials, date codes and provenance against verified references." },
    { icon: "Fingerprint", title: "Provenance Verification", body: "Ownership history and documentation are validated. Pieces without a verifiable chain of provenance never enter the registry." },
    { icon: "FileText", title: "Certificate of Authenticity", body: "Each acquisition is issued a uniquely numbered certificate that accompanies the piece and is recorded in your account." },
    { icon: "ShieldCheck", title: "Lifetime Guarantee", body: "Our Authenticity Guarantee stands for the life of the piece. A verified inauthenticity claim is met with a full refund and complimentary return." },
  ],
  ctaTitle: "A question of provenance?",
  ctaSubtitle: "Our specialists are available for a private dialogue.",
  ctaLabel: "Contact a Specialist",
};

export const CONTACT_PAGE_FALLBACK: ContactPageContent = {
  title: "Speak with the Maison",
  subtitle:
    "Our concierge team is at your disposal for bespoke requests, private appointments, and heritage inquiries.",
  inquiryTypes: [
    { value: "bespoke", label: "Bespoke Commission" },
    { value: "salon", label: "Private Salon Appointment" },
    { value: "order", label: "Order Support" },
    { value: "press", label: "Press & Media" },
  ],
};

export const PROVENANCE_SHOWCASE_FALLBACK: ProvenanceShowcaseContent = {
  narrative:
    "This artifact represents the absolute pinnacle of the Maison's craftsmanship. Hand-finished in our central atelier, it serves as a testament to human brilliance and the pursuit of the absolute standard. Every stitch and material selection has been audited for heritage compliance, ensuring its position as a primary pillar of any elite collection.",
  originLabel: "Maison Central Ateliers, Heritage Series v1.2. Audited provenance records included.",
  authenticityLabel: "NFC Certification Included",
  securityMatrixTitle: "Security Matrix",
  securityMatrixBody: "NFC Authenticity Certification and Secure Digital Ledger Tracking.",
};
