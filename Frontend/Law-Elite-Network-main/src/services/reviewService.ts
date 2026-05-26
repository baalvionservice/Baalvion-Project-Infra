/**
 * @fileOverview ReviewService
 * Orchestrates the reputation management and rating calculations.
 */

import { Review } from "@/types/review";
import { getReviewsMock, saveReviewsMock } from "@/lib/mock/reviewMock";

/**
 * Commits a new professional review to the network.
 */
export const addReview = async (review: Review): Promise<void> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const reviews = getReviewsMock();
  saveReviewsMock([review, ...reviews]);
};

/**
 * Retrieves all reviews for a specific practitioner.
 */
export const getReviewsByLawyer = async (lawyerId: string): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const reviews = getReviewsMock();
  return reviews.filter((r) => r.lawyerId === lawyerId);
};

/**
 * Algorithmically calculates the average rating for a dossier.
 */
export const getAverageRating = (reviews: Review[]): string => {
  if (reviews.length === 0) return "5.0";

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return (total / reviews.length).toFixed(1);
};
