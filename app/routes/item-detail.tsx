import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Package, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageSlider } from "@/components/ImageSlider";
import { cn } from "@/lib/utils";
import type { OrderItem } from "@/data/orders";

function getItemCategory(item: OrderItem): string {
  if (item.addonId) return "Add-on";
  if (item.sweetId) return "Sweet";
  if (item.featuredCakeId) return "Featured Cake";
  if (item.predesignedCakeId) return "Predesigned Cake";
  if (item.customCake) return "Custom Cake";
  return "Item";
}

function getCakeSliderImages(item: OrderItem): {
  images: string[];
  labels: string[];
} {
  const itemData = item.data as Record<string, unknown>;

  // For predesigned cakes, compile all configuration images
  if (item.predesignedCakeId && Array.isArray(itemData.configs)) {
    const images: string[] = [];
    const labels: string[] = [];

    // Add thumbnail
    if (typeof itemData.thumbnailUrl === "string") {
      images.push(itemData.thumbnailUrl);
      labels.push("Thumbnail");
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
        labels.push(`Shape: ${config.shape.title || "Unknown"}`);
      }
      if (config.flavor?.flavorUrl) {
        images.push(config.flavor.flavorUrl);
        labels.push(`Flavor: ${config.flavor.title || "Unknown"}`);
      }
      if (config.decoration?.decorationUrl) {
        images.push(config.decoration.decorationUrl);
        labels.push(`Decoration: ${config.decoration.title || "Unknown"}`);
      }
    });

    return { images, labels };
  }

  // For items with multiple images in array
  if (Array.isArray(itemData.images)) {
    return {
      images: itemData.images as string[],
      labels: (itemData.images as string[]).map((_, idx) => `Image ${idx + 1}`),
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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const item = location.state?.item as OrderItem | undefined;
  const bakeryId = location.state?.bakeryId as string | undefined;
  const selectedOrderId = location.state?.selectedOrderId as string | undefined;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">Item Not Found</h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const itemData = item.data as Record<string, unknown>;
  const category = getItemCategory(item);

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
                "Item Details"}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="capitalize">{category}</Badge>
              {typeof itemData.tagName === "string" && (
                <Badge variant="outline" className="capitalize">
                  {itemData.tagName}
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
                Back
                <ArrowLeft className="w-4 h-4 transform scale-x-[-1]" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Back
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
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {itemData.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 bg-muted p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        Quantity
                      </p>
                      <p className="text-2xl font-bold">{item.quantity}</p>
                    </div>
                    {item.size && (
                      <div className="space-y-1 bg-muted p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Size
                        </p>
                        <p className="text-2xl font-bold">{item.size}</p>
                      </div>
                    )}
                    {item.flavor && (
                      <div className="space-y-1 bg-muted p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Flavor
                        </p>
                        <p className="text-2xl font-bold">{item.flavor}</p>
                      </div>
                    )}
                    <div className="space-y-1 bg-muted p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        Price
                      </p>
                      <p className="text-2xl font-bold">${item.price}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Cake Details - Flavors & Palette */}
              {item.featuredCakeId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Flavors & Palette
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(itemData.flavorList) &&
                      itemData.flavorList.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            Available Flavors
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
                            Piping Colors
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
                          Capacity
                        </p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {itemData.capacity} servings
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sweets Details - Available Sizes */}
              {item.sweetId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Available Sizes</CardTitle>
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
                        Standard size only
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Item Images or Custom Cake */}
            {item.customCake
              ? (() => {
                  const snapshotImages: string[] = [];
                  const snapshotLabels: string[] = [];

                  if (typeof itemData.snapshotTop === "string") {
                    snapshotImages.push(itemData.snapshotTop as string);
                    snapshotLabels.push("Top View");
                  }
                  if (typeof itemData.snapshotFront === "string") {
                    snapshotImages.push(itemData.snapshotFront as string);
                    snapshotLabels.push("Front View");
                  }
                  if (typeof itemData.snapshotSliced === "string") {
                    snapshotImages.push(itemData.snapshotSliced as string);
                    snapshotLabels.push("Sliced View");
                  }

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Custom Cake
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
                                      itemData.shape as Record<string, unknown>
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
                                        Shape
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
                                                unknown
                                              >
                                            ).title as string)
                                          : "Unknown"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                              {/* Flavor */}
                              {typeof itemData.flavor === "object" &&
                                itemData.flavor && (
                                  <div className="space-y-2">
                                    {typeof (
                                      itemData.flavor as Record<string, unknown>
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
                                        Flavor
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
                                                unknown
                                              >
                                            ).title as string)
                                          : "Unknown"}
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
                                        Decoration
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
                                                unknown
                                              >
                                            ).title as string)
                                          : "Unknown"}
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
                                      itemData.color as Record<string, unknown>
                                    ).hex as string,
                                  }}
                                  title={
                                    (itemData.color as Record<string, unknown>)
                                      .hex as string
                                  }
                                />
                                <div className="text-xs">
                                  <p className="text-muted-foreground uppercase font-medium">
                                    Color
                                  </p>
                                  <p className="font-semibold">
                                    {
                                      (
                                        itemData.color as Record<
                                          string,
                                          unknown
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
                                  Message
                                </p>
                                <p className="font-medium text-sm text-blue-900 dark:text-blue-100 italic">
                                  "{itemData.message}"
                                </p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()
              : (() => {
                  const sliderData = getCakeSliderImages(item);
                  if (sliderData.images.length > 0) {
                    const currentConfig =
                      item.predesignedCakeId &&
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
                            {item.predesignedCakeId ? "Cake" : "Image"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <ImageSlider
                            images={sliderData.images}
                            labels={sliderData.labels}
                            square={true}
                          />

                          {/* Cake Configuration Details */}
                          {currentConfig && (
                            <div className="border-t pt-4">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {currentConfig.flavor && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-xs">
                                      {currentConfig.flavor.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {currentConfig.flavor.description}
                                    </p>
                                  </div>
                                )}

                                {currentConfig.shape && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-xs">
                                      {currentConfig.shape.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {currentConfig.shape.description}
                                    </p>
                                  </div>
                                )}

                                {currentConfig.decoration && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-xs">
                                      {currentConfig.decoration.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {currentConfig.decoration.description}
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
                    );
                  }
                  return null;
                })()}
          </div>

          {/* Selected Options */}
          {item.selectedOptions && (
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
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
