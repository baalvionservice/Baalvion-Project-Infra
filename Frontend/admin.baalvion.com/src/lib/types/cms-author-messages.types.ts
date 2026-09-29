export type AuthorMessageStatus = 'unread' | 'read';

export interface AuthorMessage {
  id: string;
  websiteId: string;
  authorSlug: string;
  authorName: string;
  senderName: string;
  senderEmail: string;
  message: string;
  status: AuthorMessageStatus;
  emailDelivered: boolean;
  createdAt: string;
  updatedAt: string;
}
