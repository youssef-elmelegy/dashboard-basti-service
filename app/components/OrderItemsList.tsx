import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { OrderItem as OrderItemModel } from "@/data/orders";

interface CustomCakeData {
  snapshotTop?: string;
  shape?: { title: string };
  flavor?: { title: string };
  decoration?: { title: string };
  color?: { name: string };
  description?: string;
  imageToPrint?: string;
  name?: string;
  [key: string]: unknown;
}

export interface CartItem {
  id: string;
  data?: CustomCakeData & Record<string, unknown>;
  customCake?: CustomCakeData;
  addonId?: string | null;
  sweetId?: string | null;
  featuredCakeId?: string | null;
  predesignedCakeId?: string | null;
  price: number;
  quantity: number;
  name?: string;
  selectedOptions?: Array<{
    type: string;
    label: string;
    value: string;
    imageUrl: string;
    optionId: string;
  }>;
}

interface ExtraLayer {
  layer: number;
  flavor?: { id?: string; title?: string; name?: string };
  flavorId?: string;
}

interface OrderItemsListProps {
  orderId: string;
  customCakes?: CartItem[];
  predesignedCakes?: CartItem[];
  featuredCakes?: CartItem[];
  addons?: CartItem[];
  sweets?: CartItem[];
  /**
   * Whether to render the "View Details" button on each item.
   * Defaults to true. Set false when item-detail route isn't relevant.
   */
  showViewDetails?: boolean;
}

function getFirstImage(
  data?: Record<string, unknown> | CustomCakeData,
): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const images = d.images;
  if (
    Array.isArray(images) &&
    images.length > 0 &&
    typeof images[0] === "string"
  ) {
    return images[0];
  }
  const image = d.image;
  if (typeof image === "string") return image;
  const thumbnail = d.thumbnailUrl || d.thumbnail;
  if (typeof thumbnail === "string") return thumbnail;
  const snapshot = d.snapshotTop || d.snapshotFront || d.snapshotSliced;
  if (typeof snapshot === "string") return snapshot;
  return undefined;
}

function extractExtraLayers(item: CartItem): ExtraLayer[] {
  const d = item.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.extraLayers)) {
    return d.extraLayers as unknown as ExtraLayer[];
  }
  const custom = item.customCake && (item.customCake as unknown);
  if (
    custom &&
    Array.isArray((custom as Record<string, unknown>).extraLayers)
  ) {
    return (custom as Record<string, unknown>)
      .extraLayers as unknown as ExtraLayer[];
  }
  return [];
}

function cartItemToOrderItem(
  cartItem: CartItem,
  itemType:
    | "addon"
    | "sweet"
    | "featured_cake"
    | "predesigned_cake"
    | "custom_cake",
  orderId: string,
): OrderItemModel {
  return {
    id: cartItem.id,
    orderId,
    quantity: cartItem.quantity,
    price: cartItem.price,
    size:
      typeof cartItem.data?.size === "string" ? cartItem.data.size : undefined,
    flavor:
      typeof cartItem.data?.flavor === "string"
        ? cartItem.data.flavor
        : typeof cartItem.data?.flavor === "object" &&
            cartItem.data.flavor &&
            "title" in cartItem.data.flavor
          ? (cartItem.data.flavor as { title?: string }).title
          : undefined,
    type: itemType,
    data: (cartItem.data || {}) as Record<string, unknown>,
    selectedOptions: cartItem.selectedOptions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function OrderItemsList({
  orderId,
  customCakes,
  predesignedCakes,
  featuredCakes,
  addons,
  sweets,
  showViewDetails = true,
}: OrderItemsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const totalCount =
    (customCakes?.length || 0) +
    (predesignedCakes?.length || 0) +
    (featuredCakes?.length || 0) +
    (addons?.length || 0) +
    (sweets?.length || 0);

  if (totalCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("orderDetail.noItemsInOrder") || "No items in this order"}
      </p>
    );
  }

  const handleViewDetails = (
    item: CartItem,
    type:
      | "addon"
      | "sweet"
      | "featured_cake"
      | "predesigned_cake"
      | "custom_cake",
  ) => {
    const orderItem = cartItemToOrderItem(item, type, orderId);
    navigate("/item-detail", { state: { item: orderItem, orderId } });
  };

  const renderItem = (
    item: CartItem,
    typeLabel: string,
    type:
      | "addon"
      | "sweet"
      | "featured_cake"
      | "predesigned_cake"
      | "custom_cake",
    options: {
      itemName: string;
      imageUrl?: string;
      extraDetails?: React.ReactNode;
    },
  ) => (
    <div key={item.id} className="border rounded-lg p-4">
      <div className="flex gap-4">
        {options.imageUrl && (
          <div className="shrink-0">
            <img
              src={options.imageUrl}
              alt={options.itemName}
              className="w-24 h-24 object-cover rounded-lg border"
            />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">{options.itemName}</h4>
              <Badge variant="outline" className="mt-1">
                {typeLabel}
              </Badge>
            </div>
            <span className="text-lg font-bold text-primary">
              {item.price} {t("orderDetail.lyd")}
            </span>
          </div>

          {options.extraDetails}

          <div className="flex items-center gap-4 pt-2 text-sm flex-nowrap overflow-x-hidden">
            <span className="font-medium flex items-center gap-2 flex-nowrap">
              {t("orderDetail.quantity")}:{" "}
              <span className="font-bold text-primary">{item.quantity}</span>
            </span>
            <span className="text-muted-foreground shrink-0">
              {t("orderDetail.total")}: {item.quantity * item.price}{" "}
              {t("orderDetail.lyd")}
            </span>
          </div>

          {showViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => handleViewDetails(item, type)}
            >
              {t("common.viewDetails") || "View Details"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  let sectionIndex = 0;
  const sectionSeparator = () =>
    sectionIndex++ > 0 ? <Separator className="my-2" /> : null;

  return (
    <div
      className="space-y-4 max-h-[40rem] overflow-y-auto pe-2"
      style={{ scrollbarWidth: "thin" }}
    >
      {customCakes && customCakes.length > 0 && (
        <>
          {sectionSeparator()}
          {customCakes.map((item) => {
            const data = item.data;
            const itemName =
              (data?.shape as { title?: string } | undefined)?.title ||
              "Custom Cake";
            const imageUrl = (data?.snapshotTop as string | undefined) || "";
            const extras = extractExtraLayers(item);
            return renderItem(item, "Custom Cake", "custom_cake", {
              itemName,
              imageUrl,
              extraDetails: (
                <>
                  {data?.flavor && (
                    <p className="text-xs text-muted-foreground">
                      Flavor:{" "}
                      {(data.flavor as { title?: string })?.title || "-"}
                    </p>
                  )}
                  {data?.decoration && (
                    <p className="text-xs text-muted-foreground">
                      Decoration:{" "}
                      {(data.decoration as { title?: string })?.title || "-"}
                    </p>
                  )}
                  {data?.color && (
                    <div className="text-xs text-muted-foreground">
                      Color:{" "}
                      {(data.color as { name?: string })?.name || "-"}
                    </div>
                  )}
                  {extras.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <div className="font-medium text-sm">Extra Layers</div>
                      <ul className="list-disc list-inside mt-1">
                        {extras.map((layer, li) => {
                          const flavorTitle =
                            layer?.flavor?.title || layer?.flavor?.name || "";
                          return (
                            <li key={li}>
                              <strong>Layer {layer.layer}</strong>:{" "}
                              {flavorTitle || "Flavor not found"}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ),
            });
          })}
        </>
      )}

      {featuredCakes && featuredCakes.length > 0 && (
        <>
          {sectionSeparator()}
          {featuredCakes.map((item) => {
            const itemName =
              (item.data?.name as string | undefined) || "Featured Cake";
            const imageUrl = getFirstImage(item.data) ?? "";
            return renderItem(item, "Featured Cake", "featured_cake", {
              itemName,
              imageUrl,
              extraDetails: item.data?.description ? (
                <p className="text-xs text-muted-foreground">
                  {item.data.description as string}
                </p>
              ) : undefined,
            });
          })}
        </>
      )}

      {predesignedCakes && predesignedCakes.length > 0 && (
        <>
          {sectionSeparator()}
          {predesignedCakes.map((item) => {
            const itemName =
              (item.data?.name as string | undefined) || "Predesigned Cake";
            const imageUrl = getFirstImage(item.data) ?? "";
            return renderItem(item, "Predesigned Cake", "predesigned_cake", {
              itemName,
              imageUrl,
              extraDetails: item.data?.description ? (
                <p className="text-xs text-muted-foreground">
                  {item.data.description as string}
                </p>
              ) : undefined,
            });
          })}
        </>
      )}

      {addons && addons.length > 0 && (
        <>
          {sectionSeparator()}
          {addons.map((item) => {
            const itemName =
              (item.data?.name as string | undefined) || "Add on";
            const imageUrl =
              item.selectedOptions && item.selectedOptions.length > 0
                ? item.selectedOptions[0].imageUrl
                : (getFirstImage(item.data) ?? "");
            return renderItem(item, "Add on", "addon", { itemName, imageUrl });
          })}
        </>
      )}

      {sweets && sweets.length > 0 && (
        <>
          {sectionSeparator()}
          {sweets.map((item) => {
            const itemName =
              (item.data?.name as string | undefined) || "Sweet";
            const imageUrl = getFirstImage(item.data) ?? "";
            return renderItem(item, "Sweet", "sweet", { itemName, imageUrl });
          })}
        </>
      )}
    </div>
  );
}
