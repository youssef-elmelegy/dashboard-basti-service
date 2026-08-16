import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Package, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageSlider } from "@/components/ImageSlider";
import { cn } from "@/lib/utils";
import type { OrderItem } from "@/data/orders";

interface ExtraLayer {
  layer: number;
  flavor?: { id?: string; title?: string; name?: string };
  flavorId?: string;
}

interface FeaturedCakeVariant {
  flavor?: string;
  pipingPalette?: string;
}

/**
 * The per-unit flavor/piping choices the customer made for a featured cake.
 * Stored on `order_items.featured_cake_variants` and echoed back by the API
 * inside the item `data` payload — one entry per cake unit ordered.
 */
function extractFeaturedCakeVariants(item: OrderItem): FeaturedCakeVariant[] {
  const itemData = item.data as Record<string, unknown> | undefined;
  const variants = itemData?.featuredCakeVarients;
  if (!Array.isArray(variants)) return [];

  return (variants as FeaturedCakeVariant[]).filter(
    (variant) =>
      variant && typeof variant === "object" && (variant.flavor || variant.pipingPalette),
  );
}

function extractExtraLayers(item: OrderItem): ExtraLayer[] {
  // Get data from the new nested structure
  const itemData = item.data as Record<string, unknown> | undefined;
  if (itemData && Array.isArray(itemData.extraLayers)) {
    return itemData.extraLayers as unknown as ExtraLayer[];
  }

  return [];
}

/**
 * The customer's per-unit flavor/piping picks. Rendered in the right-hand
 * column alongside the cake image — it's what the bakery has to act on.
 */
function CustomerSelection({
  variants,
  className,
  hideHeading = false,
}: {
  variants: FeaturedCakeVariant[];
  className?: string;
  hideHeading?: boolean;
}) {
  const { t } = useTranslation();

  if (variants.length === 0) return null;

  return (
    <div className={className}>
      {!hideHeading && (
        <h3 className="text-sm font-semibold mb-3">
          {t("itemDetail.selectedVariants")}
        </h3>
      )}
      <div className="space-y-2">
        {variants.map((variant, idx) => (
          <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
            {variants.length > 1 && (
              <p className="text-xs text-muted-foreground uppercase font-medium">
                {t("itemDetail.unit")} {idx + 1}
              </p>
            )}
            {variant.flavor && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  {t("itemDetail.flavor")}
                </p>
                <p className="text-sm font-semibold">{variant.flavor}</p>
              </div>
            )}
            {variant.pipingPalette && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  {t("itemDetail.pipingColor")}
                </p>
                <p className="text-sm font-semibold">{variant.pipingPalette}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getItemCategoryKey(item: OrderItem): string {
  switch (item.type) {
    case "addon":
      return "itemDetail.categories.addon";
    case "sweet":
      return "itemDetail.categories.sweet";
    case "featured_cake":
      return "itemDetail.categories.featured_cake";
    case "predesigned_cake":
      return "itemDetail.categories.predesigned_cake";
    case "custom_cake":
      return "itemDetail.categories.custom_cake";
    default:
      return "itemDetail.categories.item";
  }
}

function getCakeSliderImages(
  item: OrderItem,
  t: (key: string) => string,
): {
  images: string[];
  labels: string[];
} {
  const itemData = item.data as Record<string, unknown>;
  const itemType = item.type;
  const unknown = t("itemDetail.unknown");

  // For add-ons with selectedOptions, use the option images
  if (itemType === "addon") {
    const selectedOptions = Array.isArray(item.selectedOptions)
      ? item.selectedOptions
      : undefined;
    const images: string[] = [];
    const labels: string[] = [];

    selectedOptions?.forEach((option) => {
      if (option.imageUrl) {
        images.push(option.imageUrl);
        labels.push(`${option.type}: ${option.label}`);
      }
    });

    if (images.length > 0) {
      return { images, labels };
    }
  }

  // For predesigned cakes, compile all configuration images
  if (itemType === "predesigned_cake" && Array.isArray(itemData.configs)) {
    const images: string[] = [];
    const labels: string[] = [];

    // Add thumbnail
    if (typeof itemData.thumbnailUrl === "string") {
      images.push(itemData.thumbnailUrl);
      labels.push(t("itemDetail.thumbnail"));
    }

    // Add config images (shape, flavor, decoration)
    (
      itemData.configs as Array<{
        shape?: { shapeUrl?: string; title?: string };
        flavor?: { flavorUrl?: string; title?: string };
        decoration?: { decorationUrl?: string; title?: string };
      }>
    ).forEach((config) => {
      if (config.shape?.shapeUrl) {
        images.push(config.shape.shapeUrl);
        labels.push(`${t("itemDetail.shape")}: ${config.shape.title || unknown}`);
      }
      if (config.flavor?.flavorUrl) {
        images.push(config.flavor.flavorUrl);
        labels.push(
          `${t("itemDetail.flavor")}: ${config.flavor.title || unknown}`,
        );
      }
      if (config.decoration?.decorationUrl) {
        images.push(config.decoration.decorationUrl);
        labels.push(
          `${t("itemDetail.decoration")}: ${config.decoration.title || unknown}`,
        );
      }
    });

    return { images, labels };
  }

  // For items with multiple images in array
  if (Array.isArray(itemData.images)) {
    return {
      images: itemData.images as string[],
      labels: (itemData.images as string[]).map(
        (_, idx) => `${t("itemDetail.image")} ${idx + 1}`,
      ),
    };
  }

  // Fallback: just thumbnail
  if (typeof itemData.thumbnailUrl === "string") {
    return {
      images: [itemData.thumbnailUrl],
      labels: ["Thumbnail"],
    };
  }

  return { images: [], labels: [] };
}

export default function ItemDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const item = location.state?.item as OrderItem | undefined;
  const bakeryId = location.state?.bakeryId as string | undefined;
  const selectedOrderId = location.state?.selectedOrderId as string | undefined;
  // Bakery-facing callers pass false — the customer price is not theirs to see.
  const showPrices = (location.state?.showPrices as boolean | undefined) ?? true;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">{t("itemDetail.itemNotFound")}</h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t("itemDetail.goBack")}
        </Button>
      </div>
    );
  }

  const itemData = item.data as Record<string, unknown>;
  const category = t(getItemCategoryKey(item));
  const selectedOptions = Array.isArray(item.selectedOptions)
    ? item.selectedOptions
    : undefined;
  const featuredCakeVariants = extractFeaturedCakeVariants(item);

  const handleBackClick = () => {
    if (bakeryId && selectedOrderId) {
      navigate(`/orders/bakery/${bakeryId}`, {
        state: { selectedOrderId },
      });
    } else if (bakeryId) {
      navigate(`/orders/bakery/${bakeryId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {(typeof itemData.name === "string" ? itemData.name : null) ||
                t("itemDetail.itemDetails")}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="capitalize">{category}</Badge>
              {typeof itemData.tagName === "string" && (
                <Badge variant="outline" className="capitalize">
                  {itemData.tagName as string}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className={cn("gap-2 shrink-0", isRTL && "flex-row-reverse")}
          >
            {isRTL ? (
              <>
                {t("itemDetail.back")}
                <ArrowLeft className="w-4 h-4 transform scale-x-[-1]" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                {t("itemDetail.back")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Description and Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Description + Order Details Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              {typeof itemData.description === "string" &&
                itemData.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t("itemDetail.description")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {itemData.description as string}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {t("itemDetail.orderDetails")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 bg-muted p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        {t("itemDetail.quantity")}
                      </p>
                      <p className="text-2xl font-bold">{item.quantity}</p>
                    </div>
                    {item.size && (
                      <div className="space-y-1 bg-muted p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          {t("itemDetail.size")}
                        </p>
                        <p className="text-2xl font-bold capitalize">
                          {t(`common.sizes.${item.size}`, {
                            defaultValue: item.size,
                          })}
                        </p>
                      </div>
                    )}
                    {item.flavor && (
                      <div className="space-y-1 bg-muted p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          {t("itemDetail.flavor")}
                        </p>
                        <p className="text-2xl font-bold">{item.flavor}</p>
                      </div>
                    )}
                    {showPrices && (
                      <div className="space-y-1 bg-muted p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          {t("itemDetail.price")}
                        </p>
                        <p className="text-2xl font-bold">${item.price}</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Options in Order Details */}
                  {selectedOptions && selectedOptions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          {t("itemDetail.selectedOptions")}
                        </h4>
                        <div className="space-y-2">
                          {selectedOptions.map((option) => (
                            <div
                              key={option.optionId}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground uppercase font-medium">
                                  {option.type}
                                </p>
                                <p className="text-sm font-medium">
                                  {option.label}
                                </p>
                                {option.value && (
                                  <p className="text-xs text-muted-foreground">
                                    {t("itemDetail.value")}: {option.value}
                                  </p>
                                )}
                              </div>
                              {option.imageUrl && (
                                <img
                                  src={option.imageUrl}
                                  alt={option.label}
                                  className="w-12 h-12 rounded ms-3 object-cover border shrink-0"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Featured Cake Details - Flavors & Palette */}
              {item.type === "featured_cake" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      {t("itemDetail.flavorsAndPalette")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(itemData.flavorList) &&
                      itemData.flavorList.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            {t("itemDetail.availableFlavors")}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(itemData.flavorList as string[]).map(
                              (flavor, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {flavor}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {Array.isArray(itemData.pipingPaletteList) &&
                      itemData.pipingPaletteList.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            {t("itemDetail.pipingColors")}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(itemData.pipingPaletteList as string[]).map(
                              (color, idx) => (
                                <Badge key={idx} variant="outline">
                                  {color}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {typeof itemData.capacity === "number" && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          {t("itemDetail.capacity")}
                        </p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {itemData.capacity as number}{" "}
                          {t("itemDetail.servings")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sweets Details - Available Sizes */}
              {item.type === "sweet" && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("itemDetail.availableSizes")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(itemData.sizes) &&
                    itemData.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(itemData.sizes as string[]).map((size, idx) => (
                          <Badge key={idx} variant="outline">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("itemDetail.standardSizeOnly")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Add-On Selected Options */}
              {item.type === "addon" &&
                selectedOptions &&
                selectedOptions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {t("itemDetail.selectedOptions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedOptions.map((option, idx) => (
                        <div key={option.optionId}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground uppercase font-medium">
                              {option.type}
                            </span>
                            <Badge variant="secondary">{option.label}</Badge>
                          </div>
                          {option.value && (
                            <div className="text-xs text-muted-foreground mb-2">
                              {t("itemDetail.value")}: {option.value}
                            </div>
                          )}
                          {idx < selectedOptions.length - 1 && (
                            <Separator className="mt-3" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
            </div>

            {/* Right Column - Item Images or Custom Cake */}
            {
              (item.type === "custom_cake"
                ? (() => {
                    const snapshotImages: string[] = [];
                    const snapshotLabels: string[] = [];

                    if (typeof itemData.snapshotTop === "string") {
                      snapshotImages.push(itemData.snapshotTop as string);
                      snapshotLabels.push(t("itemDetail.topView"));
                    }
                    if (typeof itemData.snapshotFront === "string") {
                      snapshotImages.push(itemData.snapshotFront as string);
                      snapshotLabels.push(t("itemDetail.frontView"));
                    }
                    if (typeof itemData.snapshotSliced === "string") {
                      snapshotImages.push(itemData.snapshotSliced as string);
                      snapshotLabels.push(t("itemDetail.slicedView"));
                    }

                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {t("itemDetail.customCake")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                          {/* Cake Snapshots Slider */}
                          {snapshotImages.length > 0 && (
                            <div className="space-y-4">
                              <div className="border-t pt-4">
                                <ImageSlider
                                  images={snapshotImages}
                                  labels={snapshotLabels}
                                  square={true}
                                />
                              </div>

                              {/* Selected Components Grid */}
                              <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                                {/* Shape */}
                                {typeof itemData.shape === "object" &&
                                  itemData.shape && (
                                    <div className="space-y-2">
                                      {typeof (
                                        itemData.shape as Record<
                                          string,
                                          unknown
                                        >
                                      ).shapeUrl === "string" && (
                                        <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                                          <img
                                            src={
                                              (
                                                itemData.shape as Record<
                                                  string,
                                                  unknown
                                                >
                                              ).shapeUrl as string
                                            }
                                            alt="Shape"
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-muted-foreground uppercase font-medium">
                                          {t("itemDetail.shape")}
                                        </p>
                                        <p className="font-semibold text-sm">
                                          {typeof (
                                            itemData.shape as Record<
                                              string,
                                              unknown
                                            >
                                          ).title === "string"
                                            ? ((
                                                itemData.shape as Record<
                                                  string,
                                                  string | unknown
                                                >
                                              ).title as string)
                                            : t("itemDetail.unknown")}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                {/* Flavor */}
                                {typeof itemData.flavor === "object" &&
                                  itemData.flavor && (
                                    <div className="space-y-2">
                                      {typeof (
                                        itemData.flavor as Record<
                                          string,
                                          unknown
                                        >
                                      ).flavorUrl === "string" && (
                                        <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                                          <img
                                            src={
                                              (
                                                itemData.flavor as Record<
                                                  string,
                                                  unknown
                                                >
                                              ).flavorUrl as string
                                            }
                                            alt="Flavor"
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-muted-foreground uppercase font-medium">
                                          {t("itemDetail.flavor")}
                                        </p>
                                        <p className="font-semibold text-sm">
                                          {typeof (
                                            itemData.flavor as Record<
                                              string,
                                              unknown
                                            >
                                          ).title === "string"
                                            ? ((
                                                itemData.flavor as Record<
                                                  string,
                                                  string | unknown
                                                >
                                              ).title as string)
                                            : t("itemDetail.unknown")}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                {/* Decoration */}
                                {typeof itemData.decoration === "object" &&
                                  itemData.decoration && (
                                    <div className="space-y-2">
                                      {typeof (
                                        itemData.decoration as Record<
                                          string,
                                          unknown
                                        >
                                      ).decorationUrl === "string" && (
                                        <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                                          <img
                                            src={
                                              (
                                                itemData.decoration as Record<
                                                  string,
                                                  unknown
                                                >
                                              ).decorationUrl as string
                                            }
                                            alt="Decoration"
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-muted-foreground uppercase font-medium">
                                          {t("itemDetail.decoration")}
                                        </p>
                                        <p className="font-semibold text-sm">
                                          {typeof (
                                            itemData.decoration as Record<
                                              string,
                                              unknown
                                            >
                                          ).title === "string"
                                            ? ((
                                                itemData.decoration as Record<
                                                  string,
                                                  string | unknown
                                                >
                                              ).title as string)
                                            : t("itemDetail.unknown")}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}

                          {/* Color & Message Section */}
                          <div className="space-y-4 border-t pt-4">
                            {/* Color Swatch */}
                            {typeof itemData.color === "object" &&
                              itemData.color && (
                                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                  <div
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 shrink-0"
                                    style={{
                                      backgroundColor: (
                                        itemData.color as Record<
                                          string,
                                          string | unknown
                                        >
                                      ).hex as string,
                                    }}
                                    title={
                                      (
                                        itemData.color as Record<
                                          string,
                                          string | unknown
                                        >
                                      ).hex as string
                                    }
                                  />
                                  <div className="text-xs">
                                    <p className="text-muted-foreground uppercase font-medium">
                                      {t("itemDetail.color")}
                                    </p>
                                    <p className="font-semibold">
                                      {
                                        (
                                          itemData.color as Record<
                                            string,
                                            string | unknown
                                          >
                                        ).name as string
                                      }
                                    </p>
                                  </div>
                                </div>
                              )}

                            {/* Message */}
                            {typeof itemData.message === "string" &&
                              itemData.message && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                                    {t("itemDetail.message")}
                                  </p>
                                  <p className="font-medium text-sm text-blue-900 dark:text-blue-100 italic">
                                    "{itemData.message as string}"
                                  </p>
                                </div>
                              )}

                            {/* Extra Layers */}
                            {extractExtraLayers(item).length > 0 && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-muted-foreground uppercase font-medium mb-2">
                                  {t("orderDetail.extraLayers") ||
                                    "Extra Layers"}
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {extractExtraLayers(item).map(
                                    (layer: ExtraLayer, li: number) => {
                                      const flavorTitle =
                                        layer?.flavor?.title ||
                                        layer?.flavor?.name ||
                                        "";

                                      return (
                                        <li
                                          key={li}
                                          className="text-sm text-purple-900 dark:text-purple-100"
                                        >
                                          <strong>
                                            {t("itemDetail.layer")} {layer.layer}
                                          </strong>
                                          :{" "}
                                          {flavorTitle ||
                                            t("itemDetail.flavorNotFound")}
                                        </li>
                                      );
                                    },
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) as React.ReactNode;
                  })()
                : (() => {
                    const sliderData = getCakeSliderImages(item, t);
                    if (sliderData.images.length > 0) {
                      const currentConfig =
                        item.type === "predesigned_cake" &&
                        Array.isArray(itemData.configs) &&
                        itemData.configs.length > 0
                          ? (
                              itemData.configs as Array<{
                                flavor?: {
                                  title?: string;
                                  description?: string;
                                };
                                decoration?: {
                                  title?: string;
                                  description?: string;
                                };
                                shape?: {
                                  title?: string;
                                  description?: string;
                                };
                                frostColorValue?: string;
                              }>
                            )[0]
                          : null;

                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4" />
                              {item.type === "predesigned_cake"
                                ? t("itemDetail.cake")
                                : t("itemDetail.image")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <ImageSlider
                              images={sliderData.images}
                              labels={sliderData.labels}
                              square={true}
                            />

                            <CustomerSelection
                              variants={featuredCakeVariants}
                              className="border-t pt-4"
                            />

                            {/* Cake Configuration Details */}
                            {currentConfig && (
                              <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {currentConfig.flavor && (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs">
                                        {currentConfig.flavor.title ||
                                          t("itemDetail.flavor")}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {currentConfig.flavor.description || ""}
                                      </p>
                                    </div>
                                  )}

                                  {currentConfig.shape && (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs">
                                        {currentConfig.shape.title ||
                                          t("itemDetail.shape")}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {currentConfig.shape.description || ""}
                                      </p>
                                    </div>
                                  )}

                                  {currentConfig.decoration && (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs">
                                        {currentConfig.decoration.title ||
                                          t("itemDetail.decoration")}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {currentConfig.decoration.description ||
                                          ""}
                                      </p>
                                    </div>
                                  )}

                                  {currentConfig.frostColorValue && (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-5 h-5 rounded border shrink-0"
                                        style={{
                                          backgroundColor:
                                            currentConfig.frostColorValue,
                                        }}
                                      />
                                      <span className="text-xs font-mono truncate">
                                        {currentConfig.frostColorValue}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) as React.ReactNode;
                    }

                    // No images to show, but the customer's picks still belong
                    // in this column rather than disappearing entirely.
                    if (featuredCakeVariants.length > 0) {
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <Palette className="w-4 h-4" />
                              {t("itemDetail.selectedVariants")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <CustomerSelection
                              variants={featuredCakeVariants}
                              hideHeading
                            />
                          </CardContent>
                        </Card>
                      ) as React.ReactNode;
                    }

                    return null as unknown as React.ReactNode;
                  })()) as React.ReactNode
            }
          </div>

          {/* Selected Options */}
          {/* {item.selectedOptions && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Selected Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(item.selectedOptions, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )} */}
        </div>
      </ScrollArea>
    </div>
  );
}
