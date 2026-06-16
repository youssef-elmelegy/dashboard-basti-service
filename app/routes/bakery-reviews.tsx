import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useReviewStore } from "@/stores/reviewStore";
import { useBakeryStore } from "@/stores/bakeryStore";
import type { Review } from "@/data/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY_REVIEWS: Review[] = [];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const customerName = `${review.firstName} ${review.lastName}`;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {review.profileImage ? (
              <img
                src={review.profileImage}
                alt={customerName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{customerName}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {review.rating}.0
          </Badge>
        </div>
        <RatingStars rating={review.rating} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{review.reviewText}</p>
        <p className="text-xs text-muted-foreground mt-3">
          {format(new Date(review.createdAt), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
}

const BakeryReviewsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const bakeryId = admin?.bakeryId;

  const currentBakery = useBakeryStore((state) => state.currentBakery);
  const getBakeryById = useBakeryStore((state) => state.getBakeryById);

  const allReviews = useReviewStore((s) => s.reviews) ?? EMPTY_REVIEWS;
  const isLoading = useReviewStore((s) => s.isLoading);
  const reviewError = useReviewStore((s) => s.error);

  const reviews = useMemo(() => {
    if (!bakeryId) return EMPTY_REVIEWS;
    return allReviews.filter((r) => r.bakeryId === bakeryId);
  }, [bakeryId, allReviews]);

  // Headline stats come from the bakery aggregate, NOT the loaded page slice —
  // otherwise pagination would shift the displayed average/count as more pages load.
  const bakeryAggregate =
    currentBakery && currentBakery.id === bakeryId ? currentBakery : null;
  const averageRating = bakeryAggregate?.averageRating
    ? Math.round(Number(bakeryAggregate.averageRating) * 10) / 10
    : 0;
  const totalReviews = bakeryAggregate?.totalReviews ?? 0;

  const fetchReviews = useCallback(
    (id: string) => useReviewStore.getState().fetchReviewsByBakeryId(id),
    [],
  );
  const fetchMoreReviews = useCallback(
    (id: string) => useReviewStore.getState().fetchNextPageReviewsByBakeryId(id),
    [],
  );

  useEffect(() => {
    if (bakeryId) {
      getBakeryById(bakeryId).catch((err) =>
        console.error("Failed to fetch bakery:", err),
      );
      fetchReviews(bakeryId).catch((err) =>
        console.error("Failed to fetch reviews:", err),
      );
    }
  }, [bakeryId, getBakeryById, fetchReviews]);

  // Infinite scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bakeryId || isLoading || isLoadingMore) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if ((scrollTop + clientHeight) / scrollHeight > 0.8) {
        setIsLoadingMore(true);
        fetchMoreReviews(bakeryId)
          .then(() => setIsLoadingMore(false))
          .catch(() => setIsLoadingMore(false));
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [bakeryId, isLoading, isLoadingMore, fetchMoreReviews]);

  if (!bakeryId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("bakeryStock.noBakeryLinked") ||
              "No bakery linked to this account."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const bakeryName =
    currentBakery && currentBakery.id === bakeryId ? currentBakery.name : "";

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Star className="w-6 h-6" />
              {t("bakeryReviews.title") || "Reviews"}
            </h1>
            {bakeryName && (
              <p className="text-sm text-muted-foreground mt-1">{bakeryName}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/orders/bakery/${bakeryId}`)}
          >
            <ArrowLeft className="w-4 h-4 me-1" />
            {t("bakeryOrders.backToActive") || "Back to orders"}
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Rating Summary */}
        <Card className="mb-4 relative overflow-hidden border-yellow-400/40 bg-linear-to-br from-yellow-400/15 via-amber-300/5 to-transparent shadow-sm">
          <div className="absolute inset-y-0 start-0 w-1 bg-linear-to-b from-yellow-400 to-amber-500" />
          <div className="absolute -top-10 -end-10 w-32 h-32 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {t("bakeriesManagement.reviews") || "Reviews"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline justify-center gap-1 py-2 px-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                <span className="text-4xl font-extrabold leading-none text-yellow-600 dark:text-yellow-400 tabular-nums">
                  {averageRating}
                </span>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  / 5
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <RatingStars rating={averageRating} />
                <p className="text-sm font-medium">
                  <span className="text-foreground">{totalReviews}</span>{" "}
                  <span className="text-muted-foreground">
                    {totalReviews === 1
                      ? t("bakeriesManagement.review") || "review"
                      : t("bakeriesManagement.reviewPlural") || "reviews"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews list */}
        {reviewError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{reviewError}</p>
            </CardContent>
          </Card>
        ) : isLoading && reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("bakeriesManagement.loadingReviews") ||
                  "Loading reviews..."}
              </p>
            </CardContent>
          </Card>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {isLoadingMore && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("bakeriesManagement.loadingReviews") ||
                      "Loading more reviews..."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("bakeryReviews.noReviews") || "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BakeryReviewsPage;
