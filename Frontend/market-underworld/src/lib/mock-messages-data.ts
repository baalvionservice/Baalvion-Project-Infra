
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageRole = 'teacher' | 'student' | 'seller' | 'admin' | 'system' | 'bot';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: MessageRole;
  text: string;
  timestamp: string;
  status: MessageStatus;
  type: 'text' | 'image' | 'file' | 'voice' | 'payment' | 'booking' | 'system' | 'link';
  mediaUrl?: string;
  fileSize?: string;
  fileName?: string;
  amount?: string;
  usdAmount?: string;
  txHash?: string;
  reactions?: { [emoji: string]: number };
  replyToId?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  role: MessageRole;
  status: 'online' | 'away' | 'dnd' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean;
  isGroup?: boolean;
  membersCount?: number;
  region?: string;
  country?: string;
  rating?: number;
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Priya Sharma',
    avatar: 'https://picsum.photos/seed/priya/200/200',
    role: 'teacher',
    status: 'online',
    lastMessage: 'You: See you tomorrow at 4PM! 📅',
    lastMessageTime: 'now',
    unreadCount: 0,
    isPinned: true,
    region: 'South Asia 🌿',
    country: 'India 🇮🇳',
    rating: 4.9
  },
  {
    id: 'conv-2',
    name: 'NEXUS Support',
    avatar: '🤖',
    role: 'bot',
    status: 'online',
    lastMessage: 'Your order #NX-2026-01247 has been shipped!',
    lastMessageTime: '15m',
    unreadCount: 2,
    region: 'Global',
    country: 'NEXUS'
  },
  {
    id: 'conv-3',
    name: 'Chemistry Study Group',
    avatar: '👥',
    role: 'student',
    status: 'online',
    lastMessage: 'Rahul: Does anyone have the notes from last week?',
    lastMessageTime: '45m',
    unreadCount: 5,
    isGroup: true,
    membersCount: 8
  },
  {
    id: 'conv-4',
    name: 'Rahul Patel',
    avatar: 'https://picsum.photos/seed/rahul/200/200',
    role: 'student',
    status: 'away',
    lastMessage: 'Thanks for sharing the notes 🙏',
    lastMessageTime: '2h',
    unreadCount: 0,
    region: 'South Asia',
    country: 'India'
  },
  {
    id: 'conv-5',
    name: 'TechGadgets Store',
    avatar: '🏪',
    role: 'seller',
    status: 'offline',
    lastMessage: 'Your MacBook Air M4 order has been confirmed',
    lastMessageTime: '3h',
    unreadCount: 1,
    region: 'Global',
    country: 'USA'
  },
  {
    id: 'conv-6',
    name: 'Arjun Kumar',
    avatar: 'https://picsum.photos/seed/arjun/200/200',
    role: 'student',
    status: 'online',
    lastMessage: 'You: Are you free tonight to study together?',
    lastMessageTime: '5h',
    unreadCount: 0
  }
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm1',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "Hi Aryan! Just wanted to confirm tomorrow's class at 4PM 📅",
      timestamp: 'Yesterday, 9:00 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm2',
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: 'https://picsum.photos/seed/aryan/200/200',
      senderRole: 'student',
      text: "Yes confirmed! I've been reviewing the notes from last week 📝",
      timestamp: 'Yesterday, 9:01 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm3',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "Excellent preparation! 🎉 We'll be covering Faraday's laws tomorrow — it's a fascinating topic",
      timestamp: 'Yesterday, 9:01 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm4',
      senderId: 'system',
      senderName: 'System',
      senderAvatar: '',
      senderRole: 'system',
      text: "💰 0.02 ETH payment confirmed for class",
      timestamp: 'Yesterday, 9:02 AM',
      status: 'read',
      type: 'system'
    },
    {
      id: 'm5',
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: 'https://picsum.photos/seed/aryan/200/200',
      senderRole: 'student',
      text: "Payment sent! Looking forward to it 🙏",
      timestamp: 'Yesterday, 9:02 AM',
      status: 'read',
      type: 'text',
      reactions: { '❤️': 1 }
    },
    {
      id: 'm6',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "I've prepared some extra practice problems for you",
      timestamp: 'Yesterday, 9:03 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm7',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "Chemistry_Practice_Ch8.pdf",
      timestamp: 'Yesterday, 9:03 AM',
      status: 'read',
      type: 'file',
      fileName: 'Chemistry_Practice_Ch8.pdf',
      fileSize: '2.4 MB'
    },
    {
      id: 'm8',
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: 'https://picsum.photos/seed/aryan/200/200',
      senderRole: 'student',
      text: "Thank you so much! These are really helpful 🙌",
      timestamp: 'Yesterday, 9:05 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm9',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "Good morning Aryan! Ready for today's class? See you at 4PM 🔬",
      timestamp: 'Today, 8:30 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm10',
      senderId: 'priya',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://picsum.photos/seed/priya/200/200',
      senderRole: 'teacher',
      text: "Electrolytic Cell Diagram",
      timestamp: 'Today, 8:30 AM',
      status: 'read',
      type: 'image',
      mediaUrl: 'https://picsum.photos/seed/chem-dia/600/400'
    },
    {
      id: 'm11',
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: 'https://picsum.photos/seed/aryan/200/200',
      senderRole: 'student',
      text: "Good morning! Ready and excited! 🚀",
      timestamp: 'Today, 8:45 AM',
      status: 'read',
      type: 'text'
    },
    {
      id: 'm12',
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: 'https://picsum.photos/seed/aryan/200/200',
      senderRole: 'student',
      text: "See you tomorrow at 4PM! 📅",
      timestamp: '2 min ago',
      status: 'read',
      type: 'text'
    }
  ]
};
