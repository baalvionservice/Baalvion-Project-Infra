/**
 * @fileOverview Mock Chat Implementation
 * Simulates real-time messaging using LocalStorage and window events.
 */

const STORAGE_KEY = 'law_elite_messages_v2';

export const mockSendMessage = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newMessage = {
    id: `mock_msg_${Date.now()}`,
    ...data,
    isRead: false,
    createdAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newMessage]));
  window.dispatchEvent(new Event('chat_update'));
  return newMessage;
};

export const mockGetMessages = (caseId: string) => {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((m: any) => m.caseId === caseId);
};

export const mockMarkAsRead = async (messageId: string) => {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updated = existing.map((m: any) => 
    m.id === messageId ? { ...m, isRead: true } : m
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('chat_update'));
};
