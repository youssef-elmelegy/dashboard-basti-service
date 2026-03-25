import React from "react";
import { X, Package, Palette, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrderItem } from "@/data/orders";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderItem | null;
}

function getItemCategory(item: OrderItem): string {
  if (item.addonId) return "Add-on";
  if (item.sweetId) return "Sweet";
  if (item.featuredCakeId) return "Featured Cake";
  if (item.predesignedCakeId) return "Predesigned Cake";
  if (item.customCake) return "Custom Cake";
  return "Item";
}

function getItemImage(item: OrderItem): string {
  const itemData = item.data as Record<string, unknown>;
  return (
    (Array.isArray(itemData?.images) && (itemData.images[0] as string)) ||
    (typeof itemData?.thumbnailUrl === "string" && itemData.thumbnailUrl) ||
    (typeof itemData?.decorationTopView === "string" &&
      itemData.decorationTopView) ||
    ""
  );
}

function FeaturedCakeDetails({
  itemData,
}: {
  itemData: Record<string, unknown>;
}): React.JSX.Element {
  return (
    <>
      <Separator />
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Flavors & Palette
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Array.isArray(itemData.flavorList) &&
            itemData.flavorList.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-2">
                  Available Flavors
                </p>
                <div className="flex flex-wrap gap-2">
                  {(itemData.flavorList as string[]).map((flavor, idx) => (
                    <Badge key={idx} variant="secondary">
                      {flavor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          {Array.isArray(itemData.pipingPaletteList) &&
            itemData.pipingPaletteList.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-2">
                  Piping Colors
                </p>
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
        </div>
        {typeof itemData.capacity === "number" && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Capacity
            </p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {itemData.capacity} servings
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export function ItemDetailModal({
  isOpen,
  onClose,
  item,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const itemData = item.data as Record<string, unknown>;
  const category = getItemCategory(item);
  const image = getItemImage(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{
        backgroundColor: isOpen ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
      }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl mx-4 shadow-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {typeof itemData.name === "string"
                ? itemData.name
                : "Item Details"}
            </CardTitle>
            <Badge className="mt-2 capitalize">{category}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Image */}
            {image && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Item Image
                </h3>
                <img
                  src={image}
                  alt={itemData.name as string}
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
            )}

            {/* Description */}
            {typeof itemData.description === "string" && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {itemData.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Order Item Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    Quantity
                  </p>
                  <p className="text-lg font-bold">{item.quantity}</p>
                </div>
                {item.size && (
                  <div className="space-y-1 bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      Size
                    </p>
                    <p className="text-lg font-bold">{item.size}</p>
                  </div>
                )}
                {item.flavor && (
                  <div className="space-y-1 bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      Flavor
                    </p>
                    <p className="text-lg font-bold">{item.flavor}</p>
                  </div>
                )}
                <div className="space-y-1 bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    Price
                  </p>
                  <p className="text-lg font-bold">${item.price}</p>
                </div>
              </div>
            </div>

            {typeof item.featuredCakeId === "string" ? (
              <FeaturedCakeDetails itemData={itemData} />
            ) : null}

            {/* Predesigned Cake Specific Details */}
            {item.predesignedCakeId ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Cake Configuration
                  </h3>

                  {Array.isArray(itemData.configs) &&
                    itemData.configs.length > 0 && (
                      <div className="space-y-4">
                        {(
                          itemData.configs as Array<{
                            flavor?: { title?: string };
                            decoration?: { title?: string };
                            shape?: { title?: string };
                            frostColorValue?: string;
                          }>
                        ).map((config, idx) => (
                          <div
                            key={idx}
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              {config.flavor && (
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-medium">
                                    Flavor
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {config.flavor.title}
                                  </p>
                                </div>
                              )}
                              {config.shape && (
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-medium">
                                    Shape
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {config.shape.title}
                                  </p>
                                </div>
                              )}
                              {config.decoration && (
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-medium">
                                    Decoration
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {config.decoration.title}
                                  </p>
                                </div>
                              )}
                              {config.frostColorValue && (
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-medium">
                                    Frost Color
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded border"
                                      style={{
                                        backgroundColor: config.frostColorValue,
                                      }}
                                    />
                                    <span className="text-sm font-mono">
                                      {config.frostColorValue}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </>
            ) : null}

            {/* Sweets Specific Details */}
            {item.sweetId ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Available Sizes</h3>
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
                </div>
              </>
            ) : null}

            {/* Tag Information */}
            {typeof itemData.tagName === "string" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    Category Tag
                  </p>
                  <Badge className="capitalize">{itemData.tagName}</Badge>
                </div>
              </>
            )}

            {/* Selected Options */}
            {item.selectedOptions ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Selected Options</h3>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(item.selectedOptions, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
