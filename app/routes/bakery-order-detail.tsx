import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  User,
  ImageIcon,
  StickyNote,
  Gift,
} from "lucide-react";
import {
  orderApi,
  type OrderResponse,
} from "@/lib/services/order.service";
import { GreetingCardPreview } from "@/components/greeting-card-preview";
import {
  OrderItemsList,
  type CartItem,
} from "@/components/OrderItemsList";

const BakeryOrderDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bakeryId, orderId } = useParams<{
    bakeryId: string;
    orderId: string;
  }>();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  // Seeded from the route param: with an orderId the fetch below runs on
  // mount, so the first paint is already a loading state. Setting this inside
  // the effect would render an empty page for a frame and cascade a render.
  const [isLoading, setIsLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    orderApi
      .getOne(orderId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || "Failed to load order");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load order");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const getStatusInfo = (status: string | undefined) => {
    const map: Record<
      string,
      {
        label: string;
        variant?: VariantProps<typeof badgeVariants>["variant"];
      }
    > = {
      ready: { label: t("orderStatus.ready") || "Ready", variant: "default" },
      out_for_delivery: {
        label: t("orderStatus.outForDelivery") || "Out for Delivery",
        variant: "secondary",
      },
      delivered: {
        label: t("orderStatus.delivered") || "Delivered",
        variant: "outline",
      },
      cancelled: {
        label: t("orderStatus.cancelled") || "Cancelled",
        variant: "destructive",
      },
    };
    return (
      map[status || ""] || {
        label: status || "-",
        variant: "secondary" as const,
      }
    );
  };

  const handleBack = () => {
    navigate(`/orders/bakery/${bakeryId}/completed`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-e-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 me-1" />
          {t("bakeryOrders.backToCompleted") || "Back"}
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || t("common.notFound") || "Order not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.orderStatus);
  const customerName =
    `${order.userData?.firstName || ""} ${order.userData?.lastName || ""}`.trim() ||
    "-";
  const cardMessage = order.cardMessage
    ? typeof order.cardMessage === "string"
      ? (() => {
          try {
            return JSON.parse(order.cardMessage) as {
              from?: string;
              to?: string;
              message?: string;
            };
          } catch {
            return null;
          }
        })()
      : (order.cardMessage as unknown as {
          from?: string;
          to?: string;
          message?: string;
        })
    : null;

  const customCakeImageToPrint = order.customCakes?.find((c) => {
    const d = c.data as Record<string, unknown> | undefined;
    return d?.imageToPrint;
  });
  const imageToPrint = customCakeImageToPrint
    ? ((customCakeImageToPrint.data as Record<string, unknown>)
        ?.imageToPrint as string | undefined)
    : undefined;
  // Bakery sees the printing type (not the fee — that's admin-only).
  const printingType = customCakeImageToPrint
    ? ((customCakeImageToPrint.data as Record<string, unknown>)
        ?.printingType as "paper" | "suger" | undefined)
    : undefined;

  const finalImage =
    order.qa?.finalImages && order.qa.finalImages.length > 0
      ? order.qa.finalImages[0]
      : undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 me-1" />
        {t("bakeryOrders.backToCompleted") || "Back to completed orders"}
      </Button>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {order.referenceNumber || `#${order.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(order.createdAt), "EEEE, MMMM d, yyyy · h:mm a")}
          </p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              {t("orderDetail.customer") || "Customer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{customerName}</p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="w-4 h-4" />
              {t("orderDetail.notes") || "Notes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {order.deliveryNote ||
                t("orderDetail.noNotes") ||
                "No notes provided"}
            </p>
          </CardContent>
        </Card>

        {/* Order items — spans full width */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              {t("orderDetail.orderItems") || "Order Items"}
              <Badge variant="secondary" className="ms-auto">
                {(order.customCakes?.length || 0) +
                  (order.predesignedCakes?.length || 0) +
                  (order.featuredCakes?.length || 0) +
                  (order.addons?.length || 0) +
                  (order.sweets?.length || 0)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItemsList
              orderId={order.id}
              customCakes={order.customCakes as unknown as CartItem[]}
              predesignedCakes={order.predesignedCakes as unknown as CartItem[]}
              featuredCakes={order.featuredCakes as unknown as CartItem[]}
              addons={order.addons as unknown as CartItem[]}
              sweets={order.sweets as unknown as CartItem[]}
            />
            <Separator className="my-3" />
            <div className="flex justify-between text-sm font-semibold pt-1">
              <span>{t("orderDetail.totalCapacity") || "Total capacity"}</span>
              <span>{order.totalCapacity || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Image to print (custom cake design) */}
        {imageToPrint && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />
                {t("bakeryOrders.designImage") || "Design Image to Print"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageToPrint}
                  alt="Design"
                  className="w-full h-72 object-contain"
                />
              </div>
              {printingType && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("orderDetail.printingType")}:{" "}
                  <span className="font-medium text-foreground">
                    {printingType === "suger"
                      ? t("orderDetail.printingSugar")
                      : t("orderDetail.printingPaper")}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Final image uploaded by the bakery */}
        {finalImage && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />
                {t("bakeryOrders.finalImage") || "Final Image"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img
                  src={finalImage}
                  alt="Final"
                  className="w-full h-72 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Greeting card */}
        {cardMessage &&
          (cardMessage.from || cardMessage.to || cardMessage.message) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="w-4 h-4" />
                  {t("orderDetail.greetingCard") || "Greeting Card"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GreetingCardPreview
                  cardMessage={{
                    from: cardMessage.from || "",
                    to: cardMessage.to || "",
                    message: cardMessage.message || "",
                  }}
                />
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
};

export default BakeryOrderDetail;
