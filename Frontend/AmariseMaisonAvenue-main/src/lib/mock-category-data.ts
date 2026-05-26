// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubItem {
  id: string;
  label: string;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  subItems?: SubItem[];
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarNavItem[];
}

export interface ColorOption {
  name: string;
  count: number;
  hex?: string;
  isMulti?: boolean;
  border?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isNew?: boolean;
}

export interface FilterState {
  color: string[];
  hardware: string[];
  size: string[];
  style: string[];
  priceMin: number;
  priceMax: number;
}

// ─── Price Constants ──────────────────────────────────────────────────────────

export const PRICE_ABSOLUTE_MIN = 0;
export const PRICE_ABSOLUTE_MAX = 500000;
export const PRICE_DEFAULT_MIN = 78445;
export const PRICE_DEFAULT_MAX = 245500;

// ─── Sidebar Navigation Data ──────────────────────────────────────────────────

export const HERMES_SIDEBAR: SidebarSection[] = [
  {
    id: "handbags",
    label: "HANDBAGS",
    items: [
      {
        id: "hermes-birkin-handbags",
        label: "Birkin Bags",
        subItems: [
          { id: "birkin-25cm", label: "Birkin 25CM" },
          { id: "birkin-30cm", label: "Birkin 30CM" },
          { id: "birkin-35cm", label: "Birkin 35CM" },
          { id: "birkin-40cm", label: "Birkin 40+CM" },
          { id: "birkin-shoulder", label: "Shoulder Birkins" },
        ],
      },
      {
        id: "hermes-kelly-handbags",
        label: "Kelly Bags",
        subItems: [
          { id: "kelly-20cm", label: "Kelly 20CM" },
          { id: "kelly-25cm", label: "Kelly 25CM" },
          { id: "kelly-28cm", label: "Kelly 28CM" },
          { id: "kelly-32cm", label: "Kelly 32CM" },
          { id: "kelly-35cm", label: "Kelly 35CM+" },
        ],
      },
      {
        id: "hermes-constance-handbags",
        label: "Constance Bags",
        subItems: [
          { id: "constance-18cm", label: "Constance 18CM" },
          { id: "constance-24cm", label: "Constance 24/25CM" },
        ],
      },
      { id: "pochettes", label: "Pochettes & Kelly Cuts" },
      { id: "hss", label: "Horseshoe Stamp (HSS) Bags" },
      {
        id: "evelyne",
        label: "Evelyne Bags",
        subItems: [{ id: "mini-evelyne", label: "Mini Evelyne (TPM) Bags" }],
      },
      { id: "picotin", label: "Picotin Bags" },
      { id: "lindy", label: "Lindy Bags" },
      { id: "bolide", label: "Bolide Bags" },
      { id: "herbag", label: "Herbag Collection" },
      { id: "other-bags", label: "Other Bags" },
    ],
  },

  {
    id: "hermes-accessories",
    label: "ACCESSORIES",
    items: [
      { id: "wallets", label: "Wallets" },
      { id: "watches", label: "Watches" },
      { id: "belts", label: "Belts" },
      { id: "charms", label: "Charms" },
      { id: "scarves", label: "Scarves" },
      { id: "shoes", label: "Shoes" },
      { id: "jewelry-acc", label: "Jewelry" },
    ],
  },
  {
    id: "jewelry-hermes",
    label: "JEWELRY",
    items: [{ id: "fine-jewelry", label: "Fine Jewelry" }],
  },
  {
    id: "hermes-shoes",
    label: "SHOES",
    items: [],
  },
  {
    id: "hermes-curations",
    label: "CURATIONS",
    items: [
      { id: "new-arrivals", label: "New Arrivals" },
      { id: "best-sellers", label: "Best Sellers" },
      { id: "exotic", label: "Exotic Handbags" },
      { id: "rare", label: "Rare & Unique Bags" },
      { id: "hss-curation", label: "HSS Horseshoe Stamp Bags" },
      { id: "pre-owned", label: "Pre-Owned & Vintage Handbags" },
      { id: "home-goods", label: "Home Goods" },
      { id: "atelier", label: "Atelier Bags" },
      { id: "palm-beach", label: "Palm Beach Collection" },
    ],
  },
];

// ─── Chanel Sidebar ───────────────────────────────────────────────────────────

export const CHANEL_SIDEBAR: SidebarSection[] = [
  {
    id: "handbags",
    label: "HANDBAGS",
    items: [
      {
        id: "chanel-flap",
        label: "Classic Flap Bags",
        subItems: [
          { id: "chanel-mini", label: "Classic Mini" },
          { id: "chanel-small", label: "Classic Small" },
          { id: "chanel-medium", label: "Classic Medium" },
          { id: "chanel-jumbo", label: "Classic Jumbo & Maxi" },
        ],
      },
      { id: "chanel-22", label: "Chanel 22 Bags" },
      { id: "chanel-25", label: "Chanel 25 Bags" },
      { id: "chanel-totes", label: "Totes" },
      { id: "chanel-woc", label: "Wallet on Chain" },
      { id: "chanel-runway", label: "Fashion & Runway Bags" },
    ],
  },

  {
    id: "chanel-wallets",
    label: "WALLETS",
    items: [],
  },

  {
    id: "vintage-chanel-jewelry",
    label: "JEWELRY",
    items: [
      { id: "vintage-chanel-jewelry", label: "Vintage Jewelry" },
      { id: "contemporary-chanel-jewelry", label: "Contemporary Jewelry" },
    ],
  },
  {
    id: "chanel-shoes",
    label: "SHOES",
    items: [],
  },
];

// ─── Goyard Sidebar ───────────────────────────────────────────────────────────

export const GOYARD_SIDEBAR: SidebarSection[] = [
  {
    id: "handbags",
    label: "HANDBAGS",
    items: [
      {
        id: "goyard-saint-louis",
        label: "Saint Louis",
        subItems: [
          { id: "saint-louis-pm", label: "Saint Louis PM" },
          { id: "saint-louis-gm", label: "Saint Louis GM" },
        ],
      },
      {
        id: "goyard-saigon",
        label: "Saigon",
        subItems: [
          { id: "saigon-mini", label: "Saigon Mini" },
          { id: "saigon-mm", label: "Saigon MM" },
        ],
      },
      { id: "goyard-anjou", label: "Anjou" },
      { id: "goyard-artois", label: "Artois" },
      { id: "goyard-other", label: "Other Styles" },
      { id: "goyard", label: "All Goyard Bags" },
    ],
  }
];

// ─── Jewelry Sidebar ──────────────────────────────────────────────────────────

export const JEWELRY_SIDEBAR: SidebarSection[] = [
  {
    id: "fine-jewelry",
    label: "JEWELRY",
    items: [
      { id: "jewelry-new-arrivals", label: "New Arrivals" },
      { id: "costume-jewelry", label: "Costume Jewelry" },
      { id: "jewelry-vintage", label: "Vintage" },
      { id: "jewelry-contemporary", label: "Contemporary" },
    ],
  },
  {
    id: "category",
    label: "CATEGORY",
    items: [
      { id: "fine-jewelry-earrings", label: "Earrings" },
      { id: "fine-jewelry-bracelets", label: "Bracelets" },
      { id: "fine-jewelry-necklaces", label: "Necklaces" },
      { id: "fine-jewelry-rings", label: "Rings" },
      { id: "watches", label: "Watches" },
    ],
  },
  {
    id: "brand",
    label: "BRAND",
    items: [
      { id: "jewelry-hermes", label: "Hermès" },
      { id: "jewelry-tiffany", label: "Tiffany & Co." },
      { id: "jewelry-van-cleef", label: "Van Cleef & Arpels" },
      { id: "jewelry-chanel", label: "Chanel" },
      { id: "jewelry-cartier", label: "Cartier" },
    ],
  },
];

// ─── Other Brands Sidebar ─────────────────────────────────────────────────────

export const OTHER_BRANDS_SIDEBAR: SidebarSection[] = [
  {
    id: "brands",
    label: "BRANDS",
    items: [
      { id: "other-the-row", label: "The Row" },
      { id: "other-louis-vuitton", label: "Louis Vuitton" },
      { id: "other-christian-dior", label: "Christian Dior" },
      { id: "other-fendi", label: "Fendi" },
      { id: "other-loro-piana", label: "Loro Piana" },
      { id: "other-bottega", label: "Bottega Veneta" },
      { id: "other-prada", label: "Prada" },
      { id: "other-celine", label: "Celine" },
    ],
  },
  {
    id: "curations",
    label: "CURATIONS",
    items: [
      { id: "new-arrivals", label: "New Arrivals" },
      { id: "other-best-sellers", label: "Best Sellers" },
      { id: "other-vintage", label: "Vintage & Pre-Owned" },
    ],
  },
];

// ─── Category Sidebar Map ─────────────────────────────────────────────────────

/** Maps a category URL slug prefix to its sidebar data */
export const CATEGORY_SIDEBAR_MAP: Record<string, SidebarSection[]> = {
  hermes: HERMES_SIDEBAR,
  chanel: CHANEL_SIDEBAR,
  goyard: GOYARD_SIDEBAR,
  jewelry: JEWELRY_SIDEBAR,
  "fine-jewelry": JEWELRY_SIDEBAR,
  "costume-jewelry": JEWELRY_SIDEBAR,
  watches: JEWELRY_SIDEBAR,
  "new-arrivals": HERMES_SIDEBAR, // fallback to Hermès for new arrivals
};

/**
 * Returns the sidebar data for a given category ID.
 * Matches by exact key or by prefix (e.g. "hermes-birkin" → HERMES_SIDEBAR).
 */
export function getCategorySidebar(id: string): SidebarSection[] | null {
  if (!id) return null;
  if (id === "view-all-new-arrivals") return null;
  // Try exact match first
  if (CATEGORY_SIDEBAR_MAP[id]) return CATEGORY_SIDEBAR_MAP[id];
  // Try prefix match (e.g. "hermes-birkin" starts with "hermes")
  for (const key of Object.keys(CATEGORY_SIDEBAR_MAP)) {
    if (id.startsWith(key)) return CATEGORY_SIDEBAR_MAP[key];
    if (id.includes(key)) return CATEGORY_SIDEBAR_MAP[key];
  }
  return null;
}

// ─── Filter Options ───────────────────────────────────────────────────────────

export const COLORS: ColorOption[] = [
  { name: "Beige", count: 14, hex: "#C8A97A" },
  { name: "Black", count: 43, hex: "#0a0a0a" },
  { name: "Blue", count: 99, hex: "#3B5998" },
  { name: "Multi", count: 12, isMulti: true },
  { name: "Pink", count: 50, hex: "#E8829B" },
  { name: "Ivory", count: 29, hex: "#F8F4EC", border: true },
  { name: "Orange", count: 22, hex: "#E8622A" },
  { name: "Red", count: 18, hex: "#C0392B" },
  { name: "Green", count: 31, hex: "#2D6A4F" },
  { name: "Brown", count: 27, hex: "#7D5A3C" },
  { name: "Grey", count: 15, hex: "#8B8B8B" },
  { name: "White", count: 11, hex: "#FFFFFF", border: true },
  { name: "Gold", count: 8, hex: "#C9A84C" },
  { name: "Burgundy", count: 19, hex: "#722F37" },
];

export const HARDWARE_OPTIONS = [
  "Gold",
  "Silver",
  "Palladium",
  "Brushed Gold",
  "Rose Gold",
  "Ruthenium",
  "Black Hardware",
  "Permabrass",
];

export const SIZE_OPTIONS = [
  "Mini",
  "25cm",
  "28cm",
  "30cm",
  "32cm",
  "35cm",
  "40cm+",
];

export const STYLE_OPTIONS = [
  "Birkin",
  "Kelly",
  "Constance",
  "Evelyne",
  "Picotin",
  "Lindy",
  "Herbag",
  "Other",
];

// ─── Mock Products ────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Hermès Special Order (HSS) Birkin 25 White and Etoupe Clemence Brushed Gold Hardware",
    price: 31741.89,
    imageUrl: "https://picsum.photos/seed/hermes-birkin-1/600/750",
    isNew: true,
  },
  {
    id: "prod-2",
    name: "Hermès Special Order (HSS) Birkin 25 White and Rose Sakura Clemence Rose Gold Hardware",
    price: 33481.17,
    imageUrl: "https://picsum.photos/seed/hermes-birkin-2/600/750",
    isNew: true,
  },
  {
    id: "prod-3",
    name: "Hermès Birkin 25 New White Swift Palladium Hardware",
    price: 27393.69,
    imageUrl: "https://picsum.photos/seed/hermes-birkin-3/600/750",
    isNew: true,
  },
  {
    id: "prod-4",
    name: "Hermès Kelly 28 Sellier Gold Togo Gold Hardware",
    price: 24800.0,
    imageUrl: "https://picsum.photos/seed/hermes-kelly-4/600/750",
  },
  {
    id: "prod-5",
    name: "Hermès Constance 24 Black Epsom Gold Hardware",
    price: 18950.0,
    imageUrl: "https://picsum.photos/seed/hermes-constance-5/600/750",
  },
  {
    id: "prod-6",
    name: "Hermès Birkin 30 Orange Togo Gold Hardware Brand New",
    price: 29500.0,
    imageUrl: "https://picsum.photos/seed/hermes-birkin-6/600/750",
    isNew: true,
  },
];

// ─── Format Helpers ───────────────────────────────────────────────────────────

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const formatPriceShort = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
