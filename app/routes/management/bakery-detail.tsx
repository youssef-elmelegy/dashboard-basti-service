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
  const { t } = useTranslation();

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

  // Headline stats come from the bakery aggregate, not the loaded page slice —
  // so pagination doesn't shift the displayed average/count.
  const averageRating = bakery?.averageRating
    ? Math.round(Number(bakery.averageRating) * 10) / 10
    : 0;
  const totalReviews = bakery?.totalReviews ?? 0;

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
          <ChevronLeft className="w-4 h-4 me-2" />
          {t("bakeriesManagement.backToBakeries")}
        </Button>
      </div>
    );
  }

  const getBakeryTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      small_cakes: "smallCakes",
      big_cakes: "bigCakes",
      large_cakes: "bigCakes",
      others: "othersType",
    };
    return t(`bakeriesManagement.${typeMap[type] || type}`, {
      defaultValue: type,
    });
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
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pe-4">
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
          className="overflow-y-auto space-y-4 pe-4"
        >
          {/* Rating Summary Card */}
          <Card className="relative overflow-hidden border-yellow-400/40 bg-linear-to-br from-yellow-400/15 via-amber-300/5 to-transparent shadow-sm">
            <div className="absolute inset-y-0 start-0 w-1 bg-linear-to-b from-yellow-400 to-amber-500" />
            <div className="absolute -top-10 -end-10 w-32 h-32 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {t("bakeriesManagement.reviews")}
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
                        ? t("bakeriesManagement.review")
                        : t("bakeriesManagement.reviewPlural")}
                    </span>
                  </p>
                </div>
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
          ) : isReviewsLoading && reviews.length === 0 ? (
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
