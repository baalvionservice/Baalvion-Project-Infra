/**
 * @fileOverview Review Mock Storage.
 * Simulates persistence for practitioner ratings and feedback.
 */

import { Review } from "@/types/review";

const STORAGE_KEY = "law_elite_reviews";

/**
 * Seed data for initial network feel.
 */
const DEFAULT_REVIEWS: Review[] = [
  {
    id: "rev_1",
    lawyerId: "2", // Harvey Specter
    userId: "1",
    userName: "Jonathan Edwards",
    rating: 5,
    comment: "Exceptional strategic counsel. Mr. Specter handled our acquisition with unparalleled precision.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "rev_2",
    lawyerId: "2",
    userId: "mock_user_99",
    userName: "Alex Williams",
    rating: 5,
    comment: "The benchmark of corporate litigation. Highly recommended for high-stakes matters.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  }
];

export const getReviewsMock = (): Review[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  }
  return JSON.parse(data);
};

export const saveReviewsMock = (data: Review[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
