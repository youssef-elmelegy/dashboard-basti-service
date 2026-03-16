/**
 * Review Store (Zustand)
 *
 * Manages review data globally.
 */

import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { type Review, type PaginatedReviewsResponse } from "@/data/reviews";

interface ReviewState {
  reviews: Review[];
  bakeryReviewsCache: Map<string, { data: Review[]; timestamp: number }>;
  bakeryPagination: Map<string, { currentPage: number; totalPages: number }>;
  isLoading: boolean;
  error: string | null;
  getReviewsByBakeryId: (bakeryId: string) => Review[];
  getAverageRating: (bakeryId: string) => number;
  fetchReviewsByBakeryId: (
    bakeryId: string,
  ) => Promise<PaginatedReviewsResponse | null>;
  fetchNextPageReviewsByBakeryId: (
    bakeryId: string,
  ) => Promise<PaginatedReviewsResponse | null>;
  fetchReviews: () => Promise<void>;
  addReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
}

// Cache reviews for 5 minutes
const REVIEW_CACHE_TIME = 5 * 60 * 1000;

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  bakeryReviewsCache: new Map(),
  bakeryPagination: new Map(),
  isLoading: false,
  error: null,

  getReviewsByBakeryId: (bakeryId: string) => {
    return get().reviews.filter((review) => review.bakeryId === bakeryId);
  },

  getAverageRating: (bakeryId: string) => {
    const bakeryReviews = get().reviews.filter(
      (review) => review.bakeryId === bakeryId,
    );
    if (bakeryReviews.length === 0) return 0;
    const total = bakeryReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / bakeryReviews.length) * 10) / 10;
  },

  fetchReviewsByBakeryId: async (bakeryId: string) => {
    console.log("[ReviewStore] Fetching reviews for bakeryId:", bakeryId);
    const state = get();
    const cached = state.bakeryReviewsCache.get(bakeryId);
    const now = Date.now();

    // Return cached data if still fresh
    if (cached && now - cached.timestamp < REVIEW_CACHE_TIME) {
      console.log(
        "[ReviewStore] Using cached reviews for bakeryId:",
        bakeryId,
        "cached items:",
        cached.data.length,
      );
      return {
        reviews: cached.data,
        averageRating:
          cached.data.length > 0
            ? cached.data.reduce((sum, r) => sum + r.rating, 0) /
              cached.data.length
            : 0,
        totalReviews: cached.data.length,
        pagination: {
          total: cached.data.length,
          totalPages: 1,
          page: 1,
          limit: 10,
        },
      };
    }

    set({ isLoading: true, error: null });
    try {
      const endpoint = `/reviews/bakery/${bakeryId}?page=1&limit=10`;
      console.log("[ReviewStore] Fetching from endpoint:", endpoint);

      const result = await apiClient.get<PaginatedReviewsResponse>(endpoint);
      console.log("[ReviewStore] API Response:", result);

      if (!result.data || !Array.isArray(result.data.reviews)) {
        throw new Error("Invalid API response structure: missing data.reviews");
      }

      const reviewsData = result.data.reviews as Review[];
      console.log("[ReviewStore] Extracted reviews:", reviewsData.length);

      // Update cache and store
      const cache = new Map(state.bakeryReviewsCache);
      cache.set(bakeryId, { data: reviewsData, timestamp: now });

      // Store pagination info
      const pagination = new Map(state.bakeryPagination);
      pagination.set(bakeryId, {
        currentPage: result.data.pagination.page,
        totalPages: result.data.pagination.totalPages,
      });

      set((state) => ({
        reviews: [
          ...state.reviews.filter((r) => r.bakeryId !== bakeryId),
          ...reviewsData,
        ],
        bakeryReviewsCache: cache,
        bakeryPagination: pagination,
        isLoading: false,
      }));

      return result.data as PaginatedReviewsResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch reviews";
      console.error("[ReviewStore] Error fetching reviews:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchNextPageReviewsByBakeryId: async (bakeryId: string) => {
    const state = get();
    const paginationInfo = state.bakeryPagination.get(bakeryId);

    // If no pagination info or already on last page, don't fetch
    if (
      !paginationInfo ||
      paginationInfo.currentPage >= paginationInfo.totalPages
    ) {
      console.log("[ReviewStore] Already on last page or no pagination info");
      return null;
    }

    const nextPage = paginationInfo.currentPage + 1;
    console.log(
      "[ReviewStore] Fetching page",
      nextPage,
      "for bakeryId:",
      bakeryId,
    );

    set({ isLoading: true, error: null });
    try {
      const endpoint = `/reviews/bakery/${bakeryId}?page=${nextPage}&limit=10`;
      console.log("[ReviewStore] Fetching from endpoint:", endpoint);

      const result = await apiClient.get<PaginatedReviewsResponse>(endpoint);
      console.log("[ReviewStore] API Response for page", nextPage, ":", result);

      if (!result.data || !Array.isArray(result.data.reviews)) {
        throw new Error("Invalid API response structure: missing data.reviews");
      }

      const reviewsData = result.data.reviews as Review[];
      const paginationData = result.data.pagination;
      console.log(
        "[ReviewStore] Extracted reviews from page",
        nextPage,
        ":",
        reviewsData.length,
      );

      // Append new reviews (don't replace existing ones)
      set((state) => {
        const pagination = new Map(state.bakeryPagination);
        pagination.set(bakeryId, {
          currentPage: paginationData.page,
          totalPages: paginationData.totalPages,
        });

        return {
          reviews: [...state.reviews, ...reviewsData],
          bakeryPagination: pagination,
          isLoading: false,
        };
      });

      return result.data as PaginatedReviewsResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch next page of reviews";
      console.error("[ReviewStore] Error fetching next page:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  fetchReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.get<{ reviews: Review[] }>(
        "/reviews/my-reviews",
      );

      if (!result.data) {
        throw new Error("Failed to fetch reviews: Invalid response");
      }

      const reviewsData = Array.isArray(result.data.reviews)
        ? result.data.reviews
        : Array.isArray(result.data)
          ? (result.data as Review[])
          : [];

      set({ reviews: reviewsData, isLoading: false });
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
        review.id === id ? { ...review, ...updates } : review,
      ),
    }));
  },

  deleteReview: (id: string) => {
    set((state) => ({
      reviews: state.reviews.filter((review) => review.id !== id),
    }));
  },
}));
