
import { Listing, MarketplaceCategory } from "./types";
import { Package, Shirt, Hotel, Ticket, Landmark, UtensilsCrossed, CreditCard } from "lucide-react";

export const MARKETPLACE_PRODUCTS = [
  { id: 'mp-1', name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics', brand: 'Sonix', price: '129', crypto_price: '0.042', image_url: 'https://picsum.photos/seed/prod-1/400/500', rating: 4.7, discount: '20% OFF', originalPrice: '159' },
  { id: 'mp-2', name: 'Everyday Trail Sneakers', category: 'Sports', brand: 'Nordwear', price: '78', crypto_price: '0.026', image_url: 'https://picsum.photos/seed/prod-2/400/500', rating: 4.5 },
  { id: 'mp-3', name: 'Organic Skincare Set', category: 'Beauty', brand: 'Lumière', price: '54', crypto_price: '0.018', image_url: 'https://picsum.photos/seed/prod-3/400/500', rating: 4.8, discount: '15% OFF', originalPrice: '64' },
  { id: 'mp-4', name: 'Minimalist Leather Jacket', category: 'Fashion', brand: 'Voss & Co', price: '210', crypto_price: '0.069', image_url: 'https://picsum.photos/seed/prod-4/400/500', rating: 4.6 },
  { id: 'mp-5', name: 'Mechanical Keyboard 75%', category: 'Electronics', brand: 'KeyForge', price: '145', crypto_price: '0.048', image_url: 'https://picsum.photos/seed/prod-5/400/500', rating: 4.9, discount: '10% OFF', originalPrice: '160' },
  { id: 'mp-6', name: 'Hardcover Notebook Set', category: 'Books', brand: 'Paperloom', price: '22', crypto_price: '0.007', image_url: 'https://picsum.photos/seed/prod-6/400/500', rating: 4.4 },
  { id: 'mp-7', name: 'Cast Iron Cookware Set', category: 'Home & Kitchen', brand: 'Hearthstone', price: '96', crypto_price: '0.032', image_url: 'https://picsum.photos/seed/prod-7/400/500', rating: 4.7 },
  { id: 'mp-8', name: 'Adjustable Dumbbell Pair', category: 'Sports & Fitness', brand: 'IronCore', price: '188', crypto_price: '0.062', image_url: 'https://picsum.photos/seed/prod-8/400/500', rating: 4.6, discount: '25% OFF', originalPrice: '250' },
];

export const RESTAURANTS = [
  { id: 'res-1', name: 'BurgerNation', banner: 'https://picsum.photos/seed/food-1/600/300', logo: '🍔', offer: '20% OFF first order', cuisine: ['American', 'Fast Food'], rating: 4.6, deliveryTime: '25-35 min', minOrder: '$8' },
  { id: 'res-2', name: 'Sakura Sushi House', banner: 'https://picsum.photos/seed/food-2/600/300', logo: '🍣', cuisine: ['Japanese', 'Sushi'], rating: 4.8, deliveryTime: '30-40 min', minOrder: '$15' },
  { id: 'res-3', name: 'Nonna\'s Kitchen', banner: 'https://picsum.photos/seed/food-3/600/300', logo: '🍝', offer: 'Free delivery over $25', cuisine: ['Italian', 'Pasta'], rating: 4.7, deliveryTime: '20-30 min', minOrder: '$12' },
  { id: 'res-4', name: 'Spice Route', banner: 'https://picsum.photos/seed/food-4/600/300', logo: '🍛', cuisine: ['Indian', 'Curry'], rating: 4.5, deliveryTime: '35-45 min', minOrder: '$10' },
];

export const POPULAR_ROUTES = [
  { id: 'rt-1', from: 'New York', to: 'Tokyo', airline: 'Pacific Air', date: 'Flexible dates', duration: '14h 20m', price: '890', crypto: '0.29' },
  { id: 'rt-2', from: 'Dubai', to: 'London', airline: 'Desert Wings', date: 'Flexible dates', duration: '7h 10m', price: '520', crypto: '0.17' },
  { id: 'rt-3', from: 'Mumbai', to: 'Singapore', airline: 'Nexus Air', date: 'Flexible dates', duration: '5h 30m', price: '340', crypto: '0.11' },
  { id: 'rt-4', from: 'São Paulo', to: 'Lisbon', airline: 'Atlantic Route', date: 'Flexible dates', duration: '9h 45m', price: '610', crypto: '0.2' },
];

export const UPCOMING_EVENTS = [
  { id: 'ev-1', name: 'Global Blockchain Summit', type: 'Conference', date: 'Mar 18, 2026 • 09:00', location: 'Dubai, UAE', remaining: 240, generalPrice: '150' },
  { id: 'ev-2', name: 'NEXUS Underground Music Fest', type: 'Concert', date: 'Apr 2, 2026 • 18:00', location: 'Berlin, Germany', remaining: 890, generalPrice: '65' },
  { id: 'ev-3', name: 'Asia Trade & Commerce Expo', type: 'Expo', date: 'Apr 20, 2026 • 10:00', location: 'Singapore', remaining: 410, generalPrice: '40' },
];

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { id: 'commodities', name: 'Commodities', type: 'Physical', icon: Package, itemCount: 842, description: 'Raw materials, minerals, and physical trade goods.' },
  { id: 'clothing', name: 'Clothing', type: 'Digital', icon: Shirt, itemCount: 1240, description: 'Sourcing guides and textile manufacturer access.' },
  { id: 'hotels', name: 'Hotel Booking', type: 'Service', icon: Hotel, itemCount: 560, description: 'Discounted booking access and regional service nodes.' },
  { id: 'events', name: 'Event Booking', type: 'Service', icon: Ticket, itemCount: 320, description: 'Regional ticket access and booking assistance.' },
  { id: 'banking', name: 'Bank Transfer', type: 'Service', icon: Landmark, itemCount: 150, description: 'Cross-border payment guidance and legal aid.' },
  { id: 'food', name: 'Food Items', type: 'Digital', icon: UtensilsCrossed, itemCount: 890, description: 'Regional supplier intel and distribution guides.' },
  { id: 'gift-cards', name: 'Gift Cards', type: 'Digital', icon: CreditCard, itemCount: 2100, description: 'Country-specific digital cards and vouchers.' },
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'L-8472',
    title: 'High-Grade Lithium Concentrate',
    description: 'Bulk supply of high-purity lithium for battery manufacturing. Direct from mine source in South America.',
    region: 'Latin America & Caribbean',
    category: 'Commodities',
    userType: 'Professional',
    price: '15,000',
    cryptoPrice: '4.82',
    currency: 'ETH',
    timestamp: '2h ago',
    deliveryType: 'Physical',
    location: { country: 'Chile', city: 'Antofagasta' },
    seller: { id: 'S-1', name: 'Andes Mining Group', rating: 4.9, reputation: 1240, isVerified: true }
  },
  {
    id: 'L-9102',
    title: 'European Textile Sourcing Guide',
    description: 'Complete directory of 50+ verified eco-friendly garment manufacturers in Portugal and Italy. Includes direct contact logic.',
    region: 'Europe & Central Asia',
    category: 'Clothing',
    userType: 'Seller',
    price: '450',
    cryptoPrice: '450',
    currency: 'USDT',
    timestamp: '5h ago',
    deliveryType: 'Digital',
    location: { country: 'Portugal' },
    seller: { id: 'S-2', name: 'EuroThreads', rating: 4.8, reputation: 842, isVerified: true }
  },
  {
    id: 'L-1123',
    title: 'VIP Tokyo Luxury Suite Access',
    description: 'Exclusive 40% discount access for 5-star properties in Shinjuku and Ginza. Service booking handled by MU concierge.',
    region: 'East Asia & Pacific',
    category: 'Hotel Booking',
    userType: 'Professional',
    price: '1,200',
    cryptoPrice: '0.38',
    currency: 'ETH',
    timestamp: '1d ago',
    deliveryType: 'Service',
    location: { country: 'Japan', city: 'Tokyo' },
    seller: { id: 'S-3', name: 'Nippon Travel Nodes', rating: 5.0, reputation: 2100, isVerified: true }
  },
  {
    id: 'L-4456',
    title: 'MENA Payment Rail Intelligence',
    description: 'Consultation on legal cross-border crypto-to-fiat payment corridors in Dubai and Riyadh. Zero-delay protocols.',
    region: 'Middle East & North Africa',
    category: 'Bank Transfer',
    userType: 'Professional',
    price: '2,500',
    cryptoPrice: '2,500',
    currency: 'USDT',
    timestamp: '3h ago',
    deliveryType: 'Service',
    location: { country: 'UAE', city: 'Dubai' },
    seller: { id: 'S-4', name: 'Desert Capital', rating: 4.7, reputation: 560, isVerified: true }
  }
];
