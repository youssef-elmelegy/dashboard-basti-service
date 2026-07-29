import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useBakeryItemStore } from "@/stores/bakeryItemStore";
import { useReviewStore } from "@/stores/reviewStore";
import type { Review } from "@/data/reviews";
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
import { ChevronLeft, MapPin, Package, Plus, Star, User } from "lucide-react";
import { buildRegionAddProductPath } from "./utils/regionAddProductLink";
import { cn } from "@/lib/utils";
import { BakeryItemsDisplay } from "@/components/BakeryItemsDisplay";
import { bakeryCarriesStock } from "@/lib/bakeryStock";
import {
  BAKERY_TYPE_COLORS,
  type BakeryItemStore,
} from "@/lib/services/bakery.service";
import { Skeleton } from "@/components/ui/skeleton";

// Stable reference so the selector doesn't return a fresh array each render
const EMPTY_ITEMS: BakeryItemStore[] = [];

function ReviewCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5 mt-2" />
        <Skeleton className="h-3 w-20 mt-3" />
      </CardContent>
    </Card>
  );
}

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

  // Bakery store. `bakeries` is only populated by navigating in from the list,
  // so on a hard refresh we fall back to `currentBakery`, which the fetch below
  // fills in. Without that, a reload renders the "no bakeries" fallback.
  const bakeries = useBakeryStore((state) => state.bakeries);
  const currentBakery = useBakeryStore((state) => state.currentBakery);
  const bakery =
    bakeries.find((b) => b.id === id) ||
    (currentBakery?.id === id ? currentBakery : null);

  // Distinguishes "not loaded yet" from "does not exist" — the store's shared
  // isLoading flag is set by every action, so it can't answer that per-request.
  // Holds the id whose fetch has settled, so switching bakeries re-arms the
  // skeleton without an extra state write during the effect.
  const [fetchedId, setFetchedId] = useState<string | null>(null);
  const hasAttemptedFetch = fetchedId === id;

  // Bakery items store with subscription to updates. Reading this bakery's
  // slice directly means another bakery's rows can never appear here.
  const bakeryItems = useBakeryItemStore(
    (state) => (id ? state.itemsByBakery[id] : undefined) ?? EMPTY_ITEMS,
  );
  const isItemsLoading = useBakeryItemStore((state) => state.isLoading);

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

  const reviewsContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Infinite scroll via a sentinel rather than a scroll listener on the column:
  // below `lg` the column no longer scrolls (the page does), and an
  // IntersectionObserver with a null root follows whichever ancestor scrolls.
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !bakery || isReviewsLoading || isLoadingMore) return;

    const bakeryId = bakery.id;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setIsLoadingMore(true);
        fetchMoreReviews(bakeryId)
          .then(() => setIsLoadingMore(false))
          .catch(() => setIsLoadingMore(false));
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [bakery, isReviewsLoading, isLoadingMore, fetchMoreReviews]);

  // Load the bakery itself. On a client-side navigation it is already in
  // `bakeries`; on a direct load or refresh nothing has fetched it yet.
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    useBakeryStore
      .getState()
      .getBakeryById(id)
      .catch((error) => {
        console.error("Failed to fetch bakery:", error);
        return null;
      })
      .finally(() => {
        if (!cancelled) setFetchedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  // Still resolving — show a skeleton rather than claiming the bakery is missing
  if (!bakery && !hasAttemptedFetch) {
    return (
      <div className="lg:h-full flex flex-col gap-6" aria-busy="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-9 w-56" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <ReviewCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Fetch finished and the bakery genuinely isn't there
  if (!bakery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">
          {t("bakeriesManagement.bakeryNotFound", {
            defaultValue: "Bakery not found",
          })}
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
    // The two-pane split with independently scrolling columns only applies from
    // `lg` up; below that the columns stack and the page itself scrolls, so
    // `h-full`/`overflow-hidden` are gated to avoid nested scroll traps.
    <div className="lg:h-full flex flex-col gap-6">
      {/* Header with Breadcrumb */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:overflow-hidden">
        {/* Left Column - Bakery Details */}
        <div className="lg:col-span-2 space-y-6 lg:overflow-y-auto lg:pe-4">
          {/* Header Card */}
          <Card>
            <CardHeader>
              {/* Doubles as the page heading — the standalone <h1> above was a
                  duplicate of this title. */}
              <h1 className="text-2xl font-semibold leading-none break-words">
                {bakery.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {bakery.types.map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={cn(
                      BAKERY_TYPE_COLORS[type as keyof typeof BAKERY_TYPE_COLORS] ||
                        BAKERY_TYPE_COLORS.big_cakes
                    )}
                  >
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

          {/* Stock Section (from API) */}
          <BakeryItemsDisplay
            items={bakeryItems}
            bakeryId={id || ""}
            isLoading={isItemsLoading}
            bakeryTypes={bakery.types}
            headerAction={
              // Bakeries that hold no stock by type have nothing to add to
              !bakeryCarriesStock(bakery.types) ? null : (
              <Button
                size="sm"
                className="gap-2"
                disabled={!bakery.regionId}
                onClick={() =>
                  navigate(buildRegionAddProductPath(bakery.regionId, "addon"))
                }
              >
                <Plus className="w-4 h-4" />
                {t("bakeriesManagement.addStock")}
              </Button>
              )
            }
          />
        </div>

        {/* Right Column - Reviews Sidebar */}
        <div
          ref={reviewsContainerRef}
          className="space-y-4 lg:overflow-y-auto lg:pe-4"
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
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {isLoadingMore && <ReviewCardSkeleton />}
              <div ref={loadMoreSentinelRef} aria-hidden="true" />
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

    </div>
  );
}
