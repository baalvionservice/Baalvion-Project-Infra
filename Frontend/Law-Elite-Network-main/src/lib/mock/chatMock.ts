/**
 * @fileOverview Chat Mock Storage.
 * Simulates real-time messaging persistence for elite engagements.
 */

import { Chat } from "@/types/chat";

const STORAGE_KEY = "law_elite_chats";

/**
 * Seed data for demonstration: A conversation between Harvey Specter (Lawyer) and Jonathan Edwards (Client)
 */
const DEFAULT_CHATS: Chat[] = [
  {
    id: "chat_1",
    participants: ["1", "2"],
    participantNames: {
      "1": "Jonathan Edwards",
      "2": "Harvey Specter"
    },
    lastMessage: "The discovery motion has been filed.",
    updatedAt: Date.now(),
    messages: [
      {
        id: "msg_1",
        senderId: "1",
        text: "Mr. Specter, what is the status of the acquisition brief?",
        createdAt: Date.now() - 100000
      },
      {
        id: "msg_2",
        senderId: "2",
        text: "We are finalizing the compliance audit. The discovery motion has been filed.",
        createdAt: Date.now() - 50000
      }
    ]
  }
];

export const getChatsMock = (): Chat[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHATS));
    return DEFAULT_CHATS;
  }
  return JSON.parse(data);
};

export const saveChatsMock = (chats: Chat[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};
