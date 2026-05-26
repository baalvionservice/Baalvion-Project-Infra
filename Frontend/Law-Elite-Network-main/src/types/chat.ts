/**
 * @fileOverview Core Chat Type definitions for the Law Elite Network.
 */

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: string;
  updatedAt: number;
  messages: Message[];
}
