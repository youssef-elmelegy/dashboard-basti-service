/**
 * Reviews Data
 *
 * This is mock data for bakery reviews.
 * In production, this would come from an API.
 */

export type Review = {
  id: string;
  bakeryId: string;
  userId: string;
  orderId: string;
  rating: number; // 1-5
  reviewText: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// For backward compatibility with component props that expect customerName
export type ReviewDisplay = Review & {
  customerName?: string;
  customerImage?: string;
  title?: string;
  comment?: string;
};

export type PaginatedReviewsResponse = {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};

/**
 * Empty array - Reviews are now fetched from the API
 * Keeping export for backward compatibility
 */
export const REVIEWS_DATA: Review[] = [];
