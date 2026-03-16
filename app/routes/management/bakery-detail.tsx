import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useBakeryItemStore } from "@/stores/bakeryItemStore";
import { useReviewStore } from "@/stores/reviewStore";
import { useStockStore } from "@/stores/stockStore";
import type { Review } from "@/data/reviews";
import type { AddOnStock } from "@/data/stock";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, MapPin, Package, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddOnStockGrid } from "@/components/AddOnStockDisplay";
import { RestockDialog } from "@/components/RestockDialog";
import { BakeryItemsDisplay } from "@/components/BakeryItemsDisplay";

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

export default function BakeryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Bakery store
  const bakeries = useBakeryStore((state) => state.bakeries);
  const bakery = bakeries.find((b) => b.id === id) || null;

  // Bakery items store with subscription to updates
  const allItems = useBakeryItemStore((state) => state.items);
  const isItemsLoading = useBakeryItemStore((state) => state.isLoading);

  // Filter items for this bakery - use useMemo to avoid re-filtering on every render
  const bakeryItems = useMemo(() => {
    if (!id) return [];
    return allItems.filter((item) => item.bakeryId === id);
  }, [id, allItems]);

  const fetchBakeryItems = useCallback(async (bakeryId: string) => {
    return useBakeryItemStore.getState().fetchBakeryItems(bakeryId);
  }, []);

  // Reviews - Get all reviews from store
  const allReviews = useReviewStore((state) => state.reviews);
  const isReviewsLoading = useReviewStore((state) => state.isLoading);
  const reviewError = useReviewStore((state) => state.error);

  // Memoize filtered reviews to prevent infinite loop
  const reviews = useMemo(() => {
    if (!bakery) return [];
    return allReviews.filter((review) => review.bakeryId === bakery.id);
  }, [bakery, allReviews]);

  const averageRating = useMemo(() => {
    if (!bakery || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [bakery, reviews]);

  const fetchReviews = useCallback(async (bakeryId: string) => {
    console.log("Fetching reviews for bakeryId:", bakeryId);
    return useReviewStore.getState().fetchReviewsByBakeryId(bakeryId);
  }, []);

  const fetchMoreReviews = useCallback(async (bakeryId: string) => {
    console.log("Fetching more reviews for bakeryId:", bakeryId);
    return useReviewStore.getState().fetchNextPageReviewsByBakeryId(bakeryId);
  }, []);

  // Ref for reviews container to handle scroll
  const reviewsContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle scroll detection for infinite scroll
  useEffect(() => {
    const container = reviewsContainerRef.current;
    if (!container || !bakery || isReviewsLoading || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when 80% scrolled
      if (scrollPercentage > 0.8) {
        setIsLoadingMore(true);
        fetchMoreReviews(bakery.id)
          .then(() => setIsLoadingMore(false))
          .catch(() => setIsLoadingMore(false));
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [bakery, isReviewsLoading, isLoadingMore, fetchMoreReviews]);

  // Legacy stock
  const [selectedStock, setSelectedStock] = useState<AddOnStock | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Fetch bakery items when bakery ID changes
  useEffect(() => {
    if (id) {
      fetchBakeryItems(id).catch((error) => {
        console.error("Failed to fetch bakery items:", error);
        alert(t("bakeriesManagement.failedToLoadItems"));
      });
      // Fetch reviews for this bakery
      fetchReviews(id).catch((error) => {
        console.error("Failed to fetch reviews:", error);
      });
    }
  }, [id, fetchBakeryItems, fetchReviews, t]);

  // Get all stocks for this bakery
  const allStocks = useMemo(
    () => (bakery ? useStockStore.getState().getStocksByBakery(bakery.id) : []),
    [bakery],
  );

  // Filter stocks to only show add-ons for this bakery's region
  const stocks = useMemo(() => {
    if (!bakery || !allStocks.length) return [];

    // Return only stocks for this bakery's region
    return allStocks.filter((stock) => stock.regionName === bakery.regionId);
  }, [bakery, allStocks]);

  const handleEditStock = (stock: AddOnStock) => {
    setSelectedStock(stock);
    setIsRestockOpen(true);
  };

  if (!bakery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">
          {t("bakeriesManagement.noBakeries")}
        </h1>
        <Button onClick={() => navigate("/management/bakeries")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("bakeriesManagement.backToBakeries")}
        </Button>
      </div>
    );
  }

  const getBakeryTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      small_cakes: "smallCakes",
      large_cakes: "largeCakes",
      others: "othersType",
    };
    return t(`bakeriesManagement.${typeMap[type] || type}`);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/management/regions">
                  {t("bakeriesManagement.breadcrumbRegions")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/management/bakeries">
                  {t("bakeriesManagement.breadcrumbBakeries")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{bakery.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold tracking-tight">{bakery.name}</h1>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/management/bakeries")}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("bakeriesManagement.back")}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left Column - Bakery Details */}
        <div
          className={cn(
            "lg:col-span-2 space-y-6 overflow-y-auto pr-4",
            isRTL && "pl-4 pr-0",
          )}
        >
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{bakery.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                {bakery.types.map((type) => (
                  <Badge key={type} variant="secondary">
                    {getBakeryTypeLabel(type)}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    {t("bakeriesManagement.location")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bakery.locationDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    {t("bakeriesManagement.capacity")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bakery.capacity} {t("bakeriesManagement.units")}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />
            </CardContent>
          </Card>

          {/* Stock Management Section */}
          {stocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("bakeriesManagement.stock")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddOnStockGrid stocks={stocks} onEdit={handleEditStock} />
              </CardContent>
            </Card>
          )}

          {/* Stored Items Section (from API) */}
          {bakeryItems && bakeryItems.length > 0 && (
            <BakeryItemsDisplay
              items={bakeryItems}
              bakeryId={id || ""}
              isLoading={isItemsLoading}
            />
          )}
        </div>

        {/* Right Column - Reviews Sidebar */}
        <div
          ref={reviewsContainerRef}
          className={cn(
            "overflow-y-auto space-y-4",
            isRTL && "pl-4",
            !isRTL && "pr-4",
          )}
        >
          {/* Rating Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {t("bakeriesManagement.reviews")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{averageRating}</div>
                <div className="flex flex-col gap-1">
                  <RatingStars rating={averageRating} />
                  <p className="text-xs text-muted-foreground">
                    {reviews.length}{" "}
                    {reviews.length === 1
                      ? t("bakeriesManagement.review")
                      : t("bakeriesManagement.reviewPlural")}
                  </p>
                </div>
              </div>

              {/* Rating Distribution */}
              <Separator />
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const percentage =
                    reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-4">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-5 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          {reviewError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-600">{reviewError}</p>
              </CardContent>
            </Card>
          ) : isReviewsLoading ? (
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
                      Loading more reviews...
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("bakeriesManagement.noReviews")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Restock Dialog */}
      {selectedStock && (
        <RestockDialog
          stock={selectedStock}
          open={isRestockOpen}
          onOpenChange={setIsRestockOpen}
        />
      )}
    </div>
  );
}
