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
  userName: r.client?.name || r.reviewerLawyer?.name || 'Verified Client',
  rating: Number(r.rating || 0),
  comment: r.comment,
  createdAt: r.created_at || r.createdAt,
  professionalism: r.professionalism ?? undefined,
  communication: r.communication ?? undefined,
  expertise: r.expertise ?? undefined,
  timeliness: r.timeliness ?? undefined,
});

export const addReview = async (review: any) => {
  const hasBreakdown = [review.professionalism, review.communication, review.expertise, review.timeliness]
    .every((v) => v !== undefined && v !== null);
  const res = await reviewApi.create({
    booking_id: review.bookingId ?? review.booking_id,
    comment: review.comment || '',
    ...(hasBreakdown
      ? {
        professionalism: Number(review.professionalism),
        communication: Number(review.communication),
        expertise: Number(review.expertise),
        timeliness: Number(review.timeliness),
      }
      : { rating: Number(review.rating) }),
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
