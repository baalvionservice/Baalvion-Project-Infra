export const SITE = {
  name: 'Baalvion',
  url: 'https://baalvion.com',
  title: 'Baalvion — Global Trade & Procurement, Coordinated',
  description:
    'Baalvion is the trade operations platform where buyers, sellers, and trade agents run sourcing, procurement, and cross-border fulfillment from one shared source of truth.',
} as const;

export const TRADE_PORTAL = {
  base: 'https://trade.baalvion.com',
  login: 'https://trade.baalvion.com/login',
} as const;

export type NavLink = {
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Platform', href: '/platform' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Resources', href: '/resources' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export type Role = 'buyers' | 'sellers' | 'trade-agents';

export const ROLE_META: Record<Role, { label: string; short: string; loginLabel: string }> = {
  buyers: { label: 'Buyers', short: 'Buyer', loginLabel: 'Go to Buyer Login' },
  sellers: { label: 'Sellers', short: 'Seller', loginLabel: 'Go to Seller Login' },
  'trade-agents': { label: 'Trade Agents', short: 'Trade Agent', loginLabel: 'Go to Trade Agent Login' },
};
