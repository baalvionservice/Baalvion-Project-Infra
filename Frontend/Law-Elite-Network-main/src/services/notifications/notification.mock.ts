/**
 * @fileOverview Mock Notification Implementation
 */

const STORAGE_KEY = 'law_elite_notifications';

export const mockCreateNotification = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  
  // Ensure absolute uniqueness even for rapid mock generations
  const timestamp = Date.now();
  const entropy = Math.random().toString(36).substring(2, 9);
  const internalId = `mock_ntf_${timestamp}_${entropy}`;

  const newNotification = {
    id: data.id || internalId,
    notificationId: data.notificationId || internalId,
    isRead: false,
    createdAt: timestamp,
    ...data
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newNotification, ...existing]));
  // Trigger storage event for cross-tab or local listener simulation
  window.dispatchEvent(new Event('storage'));
};

export const mockGetNotifications = (userId: string) => {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((n: any) => n.userId === userId);
};

export const mockMarkAsRead = async (notificationId: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updated = existing.map((n: any) => 
    (n.id === notificationId || n.notificationId === notificationId) ? { ...n, isRead: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
};
