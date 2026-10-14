export type CommunityLink = {
  id: 'telegram' | 'whatsapp' | 'potato' | 'discord';
  label: string;
  blurb: string;
  href: string;
  color: string;
};

export const COMMUNITY_LINKS: CommunityLink[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    blurb: 'Live drops, announcements and the main operator chat.',
    href: 'https://t.me/+UOPUd0amDDU5NDQ1',
    color: '#229ED9',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'Join the WhatsApp community for updates on your phone.',
    href: 'https://chat.whatsapp.com/CQko1RagiXWJndClgmPlQh',
    color: '#25D366',
  },
  {
    id: 'potato',
    label: 'Potato',
    blurb: 'Our official Hell Road channel on Potato.',
    href: 'https://tatokdym.org/hellroadofficial',
    color: '#E8A33D',
  },
  {
    id: 'discord',
    label: 'Discord',
    blurb: 'Voice rooms, support and member discussion.',
    href: 'https://discord.gg/WuuKfCzjT',
    color: '#5865F2',
  },
];
