/**
 * Review Store (Zustand)
 *
 * Manages review data globally.
 */

import { create } from "zustand";
import { REVIEWS_DATA, type Review } from "@/data/reviews";

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  getReviewsByBakeryId: (bakeryId: string) => Review[];
  getAverageRating: (bakeryId: string) => number;
  fetchReviews: () => Promise<void>;
  addReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: REVIEWS_DATA,
  isLoading: false,
  error: null,

  getReviewsByBakeryId: (bakeryId: string) => {
    return get().reviews.filter((review) => review.bakeryId === bakeryId);
  },

  getAverageRating: (bakeryId: string) => {
    const bakeryReviews = get().reviews.filter(
      (review) => review.bakeryId === bakeryId
    );
    if (bakeryReviews.length === 0) return 0;
    const total = bakeryReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / bakeryReviews.length) * 10) / 10;
  },

  fetchReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API when ready
      // const response = await fetch('/api/reviews');
      // const data = await response.json();
      const data = REVIEWS_DATA;
      set({ reviews: data, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch reviews";
      set({ error: errorMessage, isLoading: false });
    }
  },

  addReview: (review: Review) => {
    set((state) => ({ reviews: [...state.reviews, review] }));
  },

  updateReview: (id: string, updates: Partial<Review>) => {
    set((state) => ({
      reviews: state.reviews.map((review) =>
        review.id === id ? { ...review, ...updates } : review
      ),
    }));
  },

  deleteReview: (id: string) => {
    set((state) => ({
      reviews: state.reviews.filter((review) => review.id !== id),
    }));
  },
}));
