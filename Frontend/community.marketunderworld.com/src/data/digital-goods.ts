export interface DigitalGood {
  id: string;
  title: string;
  category: string;
  description: string;
  priceUsd: number;
  imageIcon: string; // e.g. a lucide icon name or image url, we'll use a string and map to an icon in component
  stock: number;
}

export const DIGITAL_GOODS: DigitalGood[] = [
  {
    id: "tut-001",
    title: "Carding Method 2026 - Ultimate Guide",
    category: "Methods",
    description: "Step by step method to bypass latest fraud detection.",
    priceUsd: 150,
    imageIcon: "BookOpen",
    stock: 50,
  },
  {
    id: "tut-002",
    title: "Zero-Day Exploit Tutorial",
    category: "Tutorials Keys",
    description: "Private access key to a comprehensive 0-day exploit video series.",
    priceUsd: 500,
    imageIcon: "Key",
    stock: 10,
  },
  {
    id: "app-001",
    title: "VIP Proxy Tool Key (Lifetime)",
    category: "Application Working Keys",
    description: "License key for the elite proxy switching software.",
    priceUsd: 120,
    imageIcon: "Terminal",
    stock: 99,
  },
  {
    id: "pii-001",
    title: "Fullz - Premium US Batch (10x)",
    category: "Personal Information Keys",
    description: "High quality fullz with high credit score profiles.",
    priceUsd: 250,
    imageIcon: "UserSquare",
    stock: 5,
  },
  {
    id: "meth-002",
    title: "Crypto Washing Method",
    category: "Methods",
    description: "Clean your assets through automated mixer networks seamlessly.",
    priceUsd: 300,
    imageIcon: "RefreshCw",
    stock: 20,
  }
];
