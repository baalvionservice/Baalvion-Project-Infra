/**
 * @fileOverview Notification Mock Storage.
 * Simulates real-time event persistence for executive alerts.
 */

export const getNotificationsMock = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem("law_elite_notifications") || "[]");
};

export const saveNotificationsMock = (data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("law_elite_notifications", JSON.stringify(data));
};
