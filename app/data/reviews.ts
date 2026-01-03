/**
 * Reviews Data
 *
 * This is mock data for bakery reviews.
 * In production, this would come from an API.
 */

export type Review = {
  id: string;
  bakeryId: string;
  customerName: string;
  customerImage?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  createdAt: string; // ISO date string
};

export const REVIEWS_DATA: Review[] = [
  {
    id: "review1",
    bakeryId: "bakery1",
    customerName: "Sarah Ahmed",
    customerImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    title: "Excellent Quality and Taste!",
    comment:
      "The cakes from Sweet Cairo Bakery are absolutely delicious. Fresh ingredients and beautiful presentation. Highly recommended!",
    createdAt: "2026-01-01T10:30:00Z",
  },
  {
    id: "review2",
    bakeryId: "bakery1",
    customerName: "Mohamed Hassan",
    customerImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 4,
    title: "Great Service",
    comment:
      "Very professional team and quick delivery. The cake was delicious but arrived slightly warmer than expected.",
    createdAt: "2025-12-28T14:20:00Z",
  },
  {
    id: "review3",
    bakeryId: "bakery1",
    customerName: "Fatima Ibrahim",
    rating: 5,
    title: "Perfect for Wedding",
    comment:
      "Our wedding cake was absolutely stunning! The design was exactly what we wanted and it tasted even better than we imagined.",
    createdAt: "2025-12-20T09:00:00Z",
  },
  {
    id: "review4",
    bakeryId: "bakery1",
    customerName: "Ali Mahmoud",
    customerImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 4,
    title: "Good Value for Money",
    comment: "Affordable prices for the quality offered. Will order again!",
    createdAt: "2025-12-15T11:45:00Z",
  },
  {
    id: "review5",
    bakeryId: "bakery2",
    customerName: "Laila Samir",
    customerImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    title: "Amazing Pastries",
    comment:
      "Alex Pastry House has the best macarons in Alexandria. Fresh, colorful, and delicious. A must-visit!",
    createdAt: "2025-12-22T15:30:00Z",
  },
  {
    id: "review6",
    bakeryId: "bakery2",
    customerName: "Omar Khaled",
    rating: 3,
    title: "Average Experience",
    comment:
      "Decent pastries but service could be improved. The waiting time was longer than expected.",
    createdAt: "2025-12-10T12:00:00Z",
  },
  {
    id: "review7",
    bakeryId: "bakery3",
    customerName: "Nour El-Din",
    customerImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    title: "Best Large Cakes",
    comment:
      "Giza Cake Factory creates the most beautiful and delicious large cakes. Perfect for celebrations!",
    createdAt: "2025-12-18T10:15:00Z",
  },
  {
    id: "review8",
    bakeryId: "bakery3",
    customerName: "Hana Youssef",
    rating: 4,
    title: "Great Customization",
    comment:
      "They were very flexible with custom designs. The final product exceeded our expectations!",
    createdAt: "2025-12-05T13:20:00Z",
  },
  {
    id: "review9",
    bakeryId: "bakery4",
    customerName: "Ahmed Hassan",
    rating: 5,
    title: "Hidden Gem in Aswan",
    comment:
      "Aswan Sweets offers wonderful baked goods with authentic flavors. Highly recommended to anyone visiting Aswan.",
    createdAt: "2025-12-01T08:45:00Z",
  },
  {
    id: "review10",
    bakeryId: "bakery5",
    customerName: "Yasmin Fathy",
    customerImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    title: "Versatile Selection",
    comment:
      "Delta Cakes Group has everything! From small cakes to large custom designs. Quality is consistent across all products.",
    createdAt: "2025-11-28T16:10:00Z",
  },
];
