export interface PendingComment {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  content: {
    id: string;
    title: string;
    slug: string;
  };
}
