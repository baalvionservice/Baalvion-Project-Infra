/**
 * @fileOverview ChatService
 * Primary service layer for elite messaging and real-time synchronization simulation.
 */

import { Chat, Message } from "@/types/chat";
import { getChatsMock, saveChatsMock } from "@/lib/mock/chatMock";

/**
 * Retrieves all conversations involving the specified member.
 */
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chats = getChatsMock();
  return chats.filter((c) => c.participants.includes(userId));
};

/**
 * Retrieves a specific conversation dossier by its identifier.
 */
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const chats = getChatsMock();
  return chats.find((c) => c.id === chatId) || null;
};

/**
 * Broadcasts a new message within a specific executive channel.
 */
export const sendMessage = async (chatId: string, message: Message): Promise<void> => {
  const chats = getChatsMock();

  const updated = chats.map((chat) => {
    if (chat.id === chatId) {
      return {
        ...chat,
        lastMessage: message.text,
        updatedAt: Date.now(),
        messages: [...chat.messages, message],
      };
    }
    return chat;
  });

  saveChatsMock(updated);
};
