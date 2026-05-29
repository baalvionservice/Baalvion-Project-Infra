/**
 * @fileOverview ReviewService — LIVE (law-service reviews / Postgres). No mock, no Firebase.
 * Reviews are tied to a completed booking; creating one recalculates the lawyer's rating.
 */
import { reviewApi } from '@/lib/api/client';

const unwrapList = (res: any): any[] => res?.data?.data?.items || (Array.isArray(res?.data?.data) ? res.data.data : []);

const adaptReview = (r: any) => ({
  id: String(r.id),
  bookingId: r.booking_id != null ? String(r.booking_id) : undefined,
  clientId: r.client_id != null ? String(r.client_id) : undefined,
  lawyerId: r.lawyer_id != null ? String(r.lawyer_id) : undefined,
  clientName: r.client?.name || 'Verified Client',
  rating: Number(r.rating || 0),
  comment: r.comment,
  createdAt: r.created_at || r.createdAt,
});

export const addReview = async (review: any) => {
  const res = await reviewApi.create({
    booking_id: review.bookingId ?? review.booking_id,
    rating: Number(review.rating),
    comment: review.comment || '',
  });
  return adaptReview(res?.data?.data);
};

export const getReviewsByLawyer = async (lawyerId: string) => {
  const res = await reviewApi.list(lawyerId);
  return unwrapList(res).map(adaptReview);
};

export const getAverageRating = (reviews: any[]): string => {
  if (!reviews || reviews.length === 0) return '0.0';
  const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
  return (total / reviews.length).toFixed(1);
};
