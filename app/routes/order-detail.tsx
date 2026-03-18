import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useOrderStore } from "@/stores/orderStore";
import { env } from "@/config/env";
import { httpRequest } from "@/lib/http-handler";
import { LocationMap } from "@/components/location-map";
import { GreetingCardPreview } from "@/components/greeting-card-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Package,
  User,
  Phone,
  Mail,
  Clock,
  DollarSign,
  CheckCircle,
  Download,
  MessageSquare,
} from "lucide-react";

type OrderStatus = keyof typeof statusColors;

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

interface CartItem {
  id: string;
  data?: CustomCakeData;
  customCake?: CustomCakeData;
  addonId?: string | null;
  sweetId?: string | null;
  featuredCakeId?: string | null;
  predesignedCakeId?: string | null;
  price: number;
  quantity: number;
  name?: string;
}

interface OrderData {
  id: string;
  orderStatus: OrderStatus;
  customCakes?: CartItem[];
  predesignedCakes?: CartItem[];
  featuredCakes?: CartItem[];
  addons?: CartItem[];
  sweets?: CartItem[];
  addOns?: CartItem[];
  userData?: Record<string, unknown>;
  deliveryData?: Record<string, unknown>;
  qualityChecks?: Record<string, boolean>;
  finalPrice?: number;
  totalPrice?: number;
  imageToPrint?: string;
  cardMessage?:
    | { to: string; from: string; message: string; link?: string }
    | string;
  assignedBakeryName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  regionName?: string;
  region?: string;
  locationData?: Record<string, unknown>;
  deliveryLocation?: string;
  createdAt?: string;
  willDeliverAt?: string;
  deliverDay?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  orderedAt?: string;
  totalCapacity?: number;
  capacitySlots?: number;
  basePrice?: number;
  discountAmount?: number;
  referenceNumber?: string;
  keepAnonymous?: boolean;
  deliveryNote?: string;
  wantedDeliveryTimeSlot?: { from: string; to: string };
  finalImage?: string;
  finalImageUploadedAt?: string;
  recipientData?: Record<string, unknown>;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  out_for_delivery: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
} as const;

// Function to download image properly
async function downloadImage(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading image:", error);
    // Fallback to simple download
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || "image.png";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Function to download greeting card as image with QR code
async function downloadCardAsImage(cardMessage: {
  to: string;
  from: string;
  message: string;
  link?: string;
}) {
  try {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    gradient.addColorStop(0, "#fef3c7"); // amber-50
    gradient.addColorStop(1, "#fed7aa"); // orange-50
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = "#fbbf24"; // amber-200
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Draw "To"
    ctx.font = "14px Arial";
    ctx.fillStyle = "#b45309"; // amber-700
    ctx.textAlign = "left";
    ctx.fillText(`To: ${cardMessage.to}`, 60, 100);

    // Draw message
    ctx.font = "italic 28px Georgia";
    ctx.fillStyle = "#78350f"; // amber-900
    ctx.textAlign = "center";
    const lines = cardMessage.message.split("\n");
    let yPos = 240;
    lines.forEach((line: string) => {
      ctx.fillText(line, canvas.width / 2, yPos);
      yPos += 40;
    });

    // Generate and draw QR code if link exists
    if (cardMessage.link) {
      try {
        // Use qr-server.com API to generate QR code
        const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(cardMessage.link)}`;

        // Create image and draw it on canvas
        const qrImage = new Image();
        qrImage.crossOrigin = "anonymous";

        await new Promise<void>((resolve) => {
          qrImage.onload = () => {
            // Draw white background for QR code
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(580, 220, 180, 180);
            // Draw QR code border
            ctx.strokeStyle = "#fbbf24"; // amber-200
            ctx.lineWidth = 2;
            ctx.strokeRect(580, 220, 180, 180);
            // Draw QR code
            ctx.drawImage(qrImage, 590, 230, 160, 160);
            resolve();
          };
          qrImage.onerror = () => {
            console.error("Failed to load QR code image");
            resolve(); // Continue even if QR fails
          };
          qrImage.src = qrDataUrl;
        });
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }

    // Draw signature
    ctx.font = "14px Arial";
    ctx.fillStyle = "#b45309"; // amber-700
    ctx.textAlign = "right";
    ctx.fillText("With warm wishes,", canvas.width - 60, canvas.height - 120);

    ctx.font = "24px Georgia";
    ctx.fillStyle = "#78350f"; // amber-900
    ctx.fillText(cardMessage.from, canvas.width - 60, canvas.height - 80);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `greeting-card-${cardMessage.from.replace(/\s/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error("Error downloading card:", error);
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const orders = useOrderStore((state) => state.orders);
  const getDetailedOrder = useOrderStore((state) => state.getDetailedOrder);
  const cacheDetailedOrder = useOrderStore((state) => state.cacheDetailedOrder);
  const [fetchedOrder, setFetchedOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order from admin endpoint with caching
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError("Order ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if we have cached detailed order
        const cachedOrder = getDetailedOrder(id);
        if (cachedOrder) {
          setFetchedOrder(cachedOrder);
          setIsLoading(false);
          return;
        }

        // Fetch from API if not cached
        const response = await httpRequest(`${env.API_BASE_URL}/orders/${id}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch order details");
        }

        const data = await response.json();
        if (data.data) {
          setFetchedOrder(data.data);
          // Cache the detailed order
          cacheDetailedOrder(id, data.data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch order";
        setError(errorMessage);
        console.error("Error fetching order:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, getDetailedOrder, cacheDetailedOrder]);

  // Use fetched order if available, fallback to store
  const order = (fetchedOrder || orders.find((o) => o.id === id)) as OrderData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="text-muted-foreground">
          {t("common.loading") || "Loading order..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/orders")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("orderDetail.backToOrders")}
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">{t("orderDetail.orderNotFound")}</h1>
        <p className="text-muted-foreground">
          {t("orderDetail.orderNotFoundDesc")}
        </p>
        <Button onClick={() => navigate("/orders")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("orderDetail.backToOrders")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header with Breadcrumb */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders" className="cursor-pointer">
                  {t("orders.title")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono text-sm">
                  #{order.id}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("orderDetail.orderDetails")}
            </h1>
            {order.orderStatus && order.orderStatus !== "pending" && (
              <Badge
                variant="outline"
                className={`${statusColors[order.orderStatus as OrderStatus]} capitalize`}
              >
                {order.orderStatus.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/orders")}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("orderDetail.back")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("orderDetail.orderItems") || "Order Items"}
              {order && (
                <Badge variant="secondary" className="ml-auto">
                  {(order.customCakes?.length || 0) +
                    (order.predesignedCakes?.length || 0) +
                    (order.featuredCakes?.length || 0) +
                    (order.addons?.length || 0) +
                    (order.sweets?.length || 0)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order &&
            (order.customCakes?.length ||
              order.predesignedCakes?.length ||
              order.featuredCakes?.length ||
              order.addons?.length ||
              order.sweets?.length) ? (
              <div
                className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent"
                style={{ scrollbarWidth: "thin" }}
              >
                {/* Custom Cakes */}
                {order.customCakes && order.customCakes.length > 0 && (
                  <>
                    {order.customCakes.map((item: CartItem, index: number) => {
                      const imageUrl = item.data?.snapshotTop || "";
                      const itemName =
                        (item.data?.shape as { title?: string } | undefined)
                          ?.title || "Custom Cake";

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex gap-4">
                            {/* Item Image */}
                            {imageUrl && (
                              <div className="shrink-0">
                                <img
                                  src={imageUrl}
                                  alt={itemName}
                                  className="w-24 h-24 object-cover rounded-lg border"
                                />
                              </div>
                            )}

                            {/* Item Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold">
                                    {itemName}
                                  </h4>
                                  <Badge variant="outline" className="mt-1">
                                    Custom Cake
                                  </Badge>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                  {item.price} {t("orderDetail.egp")}
                                </span>
                              </div>

                              {item.data?.flavor && (
                                <p className="text-xs text-muted-foreground">
                                  Flavor:{" "}
                                  {
                                    (item.data.flavor as { title?: string })
                                      ?.title
                                  }
                                </p>
                              )}

                              {item.data?.decoration && (
                                <p className="text-xs text-muted-foreground">
                                  Decoration:{" "}
                                  {
                                    (item.data.decoration as { title?: string })
                                      ?.title
                                  }
                                </p>
                              )}

                              <div className="flex items-center gap-4 pt-2 text-sm flex-nowrap overflow-x-hidden">
                                <span className="font-medium flex items-center gap-2 flex-nowrap">
                                  {t("orderDetail.quantity")}:{" "}
                                  <span className="font-bold text-primary">
                                    {item.quantity}
                                  </span>
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {t("orderDetail.total")}:{" "}
                                  {item.quantity * item.price}{" "}
                                  {t("orderDetail.egp")}
                                </span>
                              </div>

                              {item.data?.color && (
                                <div className="text-xs text-muted-foreground">
                                  Color:{" "}
                                  {(item.data.color as { name?: string })?.name}
                                </div>
                              )}
                            </div>
                          </div>
                          {index < (order.customCakes?.length || 0) - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Featured Cakes */}
                {order.featuredCakes && order.featuredCakes.length > 0 && (
                  <>
                    {order.customCakes && order.customCakes.length > 0 && (
                      <Separator className="my-2" />
                    )}
                    {order.featuredCakes.map(
                      (item: CartItem, index: number) => {
                        const itemName =
                          (item.data?.name as string | undefined) ||
                          "Featured Cake";

                        return (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex gap-4">
                              {/* Item Details */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      {itemName}
                                    </h4>
                                    <Badge variant="outline" className="mt-1">
                                      Featured Cake
                                    </Badge>
                                  </div>
                                  <span className="text-lg font-bold text-primary">
                                    {item.price} {t("orderDetail.egp")}
                                  </span>
                                </div>

                                {item.data?.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.data.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 pt-2 text-sm flex-nowrap overflow-x-hidden">
                                  <span className="font-medium flex items-center gap-2 flex-nowrap">
                                    {t("orderDetail.quantity")}:{" "}
                                    <span className="font-bold text-primary">
                                      {item.quantity}
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground shrink-0">
                                    {t("orderDetail.total")}:{" "}
                                    {item.quantity * item.price}{" "}
                                    {t("orderDetail.egp")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {index < (order.featuredCakes?.length || 0) - 1 && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        );
                      },
                    )}
                  </>
                )}

                {/* Add Ons */}
                {order.addons && order.addons.length > 0 && (
                  <>
                    {(order.customCakes?.length || 0) +
                      (order.featuredCakes?.length || 0) >
                      0 && <Separator className="my-2" />}
                    {order.addons.map((item: CartItem, index: number) => {
                      const itemName =
                        (item.data?.name as string | undefined) || "Add on";

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex gap-4">
                            {/* Item Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold">
                                    {itemName}
                                  </h4>
                                  <Badge variant="outline" className="mt-1">
                                    Add on
                                  </Badge>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                  {item.price} {t("orderDetail.egp")}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 pt-2 text-sm flex-nowrap overflow-x-hidden">
                                <span className="font-medium flex items-center gap-2 flex-nowrap">
                                  {t("orderDetail.quantity")}:{" "}
                                  <span className="font-bold text-primary">
                                    {item.quantity}
                                  </span>
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {t("orderDetail.total")}:{" "}
                                  {item.quantity * item.price}{" "}
                                  {t("orderDetail.egp")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {index < (order.addons?.length || 0) - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Sweets */}
                {order.sweets && order.sweets.length > 0 && (
                  <>
                    {(order.customCakes?.length || 0) +
                      (order.featuredCakes?.length || 0) +
                      (order.addons?.length || 0) >
                      0 && <Separator className="my-2" />}
                    {order.sweets.map((item: CartItem, index: number) => {
                      const itemName =
                        (item.data?.name as string | undefined) || "Sweet";

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex gap-4">
                            {/* Item Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold">
                                    {itemName}
                                  </h4>
                                  <Badge variant="outline" className="mt-1">
                                    Sweet
                                  </Badge>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                  {item.price} {t("orderDetail.egp")}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 pt-2 text-sm flex-nowrap overflow-x-hidden">
                                <span className="font-medium flex items-center gap-2 flex-nowrap">
                                  {t("orderDetail.quantity")}:{" "}
                                  <span className="font-bold text-primary">
                                    {item.quantity}
                                  </span>
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {t("orderDetail.total")}:{" "}
                                  {item.quantity * item.price}{" "}
                                  {t("orderDetail.egp")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {index < (order.sweets?.length || 0) - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("orderDetail.noItemsInOrder")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("orderDetail.customer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {order.userData
                  ? `${(order.userData as { firstName?: string; lastName?: string }).firstName} ${(order.userData as { firstName?: string; lastName?: string }).lastName}`
                  : order.customerName}
              </span>
            </div>
            {(order.userData?.phoneNumber || order.customerPhone) && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {
                    ((order.userData?.phoneNumber as string) ||
                      order.customerPhone) as string
                  }
                </span>
              </div>
            )}
            {(order.userData?.email || order.customerEmail) && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {
                    ((order.userData?.email as string) ||
                      order.customerEmail) as string
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Bakery */}
        {order.assignedBakeryName && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("orderDetail.assignedBakery")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {order.assignedBakeryName}
                </span>
                <Badge variant="secondary">{t("orderDetail.assigned")}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t("orderDetail.deliveryDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.region")}
              </span>
              <p className="text-sm font-medium">
                {order.regionName || order.region}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.address")}
              </span>
              <p className="text-sm">
                {order.locationData
                  ? `${(order.locationData as { street?: string; buildingNo?: string; label?: string }).street || ""} ${
                      (
                        order.locationData as {
                          street?: string;
                          buildingNo?: string;
                          label?: string;
                        }
                      ).buildingNo
                        ? `#${(order.locationData as { street?: string; buildingNo?: string; label?: string }).buildingNo}`
                        : ""
                    } - ${(order.locationData as { street?: string; buildingNo?: string; label?: string }).label || ""}`
                  : order.deliveryLocation}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("orderDetail.deliveryDate")}
                </span>
                <p className="text-sm font-medium">
                  {format(
                    new Date(
                      order.willDeliverAt || order.deliverDay || Date.now(),
                    ),
                    "EEEE, MMMM d, yyyy",
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Location Map */}
        {(order.locationData?.latitude || order.deliveryLatitude) &&
          (order.locationData?.longitude || order.deliveryLongitude) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t("orderDetail.deliveryMap") || "Delivery Location Map"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationMap
                  latitude={
                    ((order.locationData?.latitude as number) ||
                      order.deliveryLatitude) ??
                    0
                  }
                  longitude={
                    ((order.locationData?.longitude as number) ||
                      order.deliveryLongitude) ??
                    0
                  }
                  address={
                    ((order.locationData?.label as string) ||
                      order.deliveryLocation ||
                      "") as string
                  }
                  className="w-full h-64 rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("orderDetail.orderTimeline")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.orderedAt")}
              </span>
              <p className="text-sm font-medium">
                {format(
                  new Date(order.createdAt || order.orderedAt || Date.now()),
                  "MMM d, yyyy 'at' h:mm a",
                )}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.expectedDelivery")}
              </span>
              <p className="text-sm font-medium">
                {format(
                  new Date(
                    order.willDeliverAt || order.deliverDay || Date.now(),
                  ),
                  "MMM d, yyyy",
                )}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.capacitySlots")}
              </span>
              <p className="text-sm font-medium">
                {order.totalCapacity || order.capacitySlots}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t("orderDetail.pricing")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.basePrice ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("orderDetail.basePrice")}
                  </span>
                  <span className="text-sm font-medium">
                    {order.basePrice} {t("orderDetail.egp")}
                  </span>
                </div>
                {order.addOns && order.addOns.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        {t("orderDetail.addOns")}:
                      </span>
                      {order.addOns.map((addon: CartItem) => (
                        <div
                          key={addon.id}
                          className="flex justify-between pl-2"
                        >
                          <span className="text-sm text-muted-foreground">
                            {addon.name} x{addon.quantity}
                          </span>
                          <span className="text-sm">
                            {addon.price * addon.quantity}{" "}
                            {t("orderDetail.egp")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-sm font-medium">
                    {order.totalPrice} {t("orderDetail.egp")}
                  </span>
                </div>
                {(order.discountAmount ?? 0) > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Discount
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        -{order.discountAmount} {t("orderDetail.egp")}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t("orderDetail.total")}</span>
              <span>
                {order.finalPrice || order.totalPrice} {t("orderDetail.egp")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Design Image to Print */}
        {order.customCakes &&
          order.customCakes.length > 0 &&
          order.customCakes.some(
            (cake: CartItem) =>
              cake.data?.imageToPrint || cake.customCake?.imageToPrint,
          ) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="w-4 h-4" />
                    {t("orderDetail.designToPrint") || "Design"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.customCakes.map((cake: CartItem, index: number) => {
                  const imageToPrint =
                    cake.data?.imageToPrint || cake.customCake?.imageToPrint;
                  if (!imageToPrint) return null;

                  return (
                    <div key={index} className="flex flex-col gap-3">
                      <div className="rounded-lg overflow-hidden border bg-muted/50 p-2">
                        <img
                          src={imageToPrint}
                          alt="Design to Print"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          downloadImage(
                            imageToPrint,
                            `design-to-print-${order.referenceNumber || order.id}.png`,
                          )
                        }
                        className="w-full gap-2 h-8 text-xs"
                      >
                        <Download className="w-3 h-3" />
                        {t("orderDetail.download") || "Download"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

        {/* General Order Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("orderDetail.generalOrderDetails")}
              </CardTitle>
              <Badge variant={order.keepAnonymous ? "default" : "secondary"}>
                {order.keepAnonymous
                  ? t("orderDetail.anonymousOrder")
                  : t("orderDetail.notAnonymous")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.deliveryNote")}
              </span>
              <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                {order.deliveryNote || t("orderDetail.noDeliveryNote")}
              </p>
            </div>
            {order.wantedDeliveryTimeSlot && (
              <div className="border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  Preferred Delivery Time
                </span>
                <p className="text-sm font-medium">
                  {order.wantedDeliveryTimeSlot.from} -{" "}
                  {order.wantedDeliveryTimeSlot.to}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality Control Progress */}
        {order.qualityChecks && Object.keys(order.qualityChecks).length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {t("bakeryOrders.qualityControl")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {((): React.ReactNode => {
                const checks = order.qualityChecks;
                const totalChecks = Object.keys(checks).length;
                const completedChecks = Object.values(checks).filter(
                  (v) => v === true,
                ).length;
                const progress = (completedChecks / totalChecks) * 100;

                const checkLabels: Record<string, string> = {
                  addons: "Add-ons Implementation",
                  printing: "Print Verification",
                  packaging: "Safe Packaging",
                  decoration: "Decoration Quality",
                  freshness: "Freshness Check",
                };

                return (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {t("bakeryOrders.completionStatus")}
                        </span>
                        <span className="text-sm font-bold">
                          {completedChecks} / {totalChecks}
                        </span>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-green-500 to-emerald-500 transition-all rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress)}% {t("bakeryOrders.complete")}
                      </span>
                    </div>

                    <Separator />

                    {/* Quality Checks List */}
                    <div className="space-y-2">
                      {Object.entries(checks).map(([checkId, isChecked]) => (
                        <div
                          key={checkId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isChecked
                                ? "bg-green-500 border-green-500"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isChecked ? (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : null}
                          </div>
                          <span
                            className={`text-sm ${
                              isChecked
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {
                              (checkLabels[
                                checkId as keyof typeof checkLabels
                              ] || checkId) as string
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Final Image from Bakery */}
        {order.finalImage && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("bakeryOrders.finalProductImage")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={order.finalImage}
                    alt="Final Product"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("bakeryOrders.finalImageTaken")}{" "}
                  {order.finalImageUploadedAt
                    ? format(
                        new Date(order.finalImageUploadedAt || Date.now()),
                        "MMM d, yyyy 'at' h:mm a",
                      )
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Greeting Card Details */}
        {order.cardMessage && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {t("orderDetail.greetingCard")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const cardMsg =
                      typeof order.cardMessage === "string"
                        ? { to: "", from: "", message: order.cardMessage }
                        : (order.cardMessage as {
                            to: string;
                            from: string;
                            message: string;
                            link?: string;
                          });
                    downloadCardAsImage(cardMsg);
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("orderDetail.downloadCard")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Card Preview */}
                <div className="flex-1">
                  <GreetingCardPreview
                    cardMessage={
                      order.cardMessage as {
                        to: string;
                        from: string;
                        message: string;
                        link?: string;
                      }
                    }
                  />
                </div>

                {/* Card Details */}
                <div className="lg:w-64 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("orderDetail.cardFrom")}
                    </label>
                    <p className="text-sm font-medium">
                      {typeof order.cardMessage === "string"
                        ? order.cardMessage
                        : (
                            order.cardMessage as {
                              to: string;
                              from: string;
                              message: string;
                            }
                          ).from}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("orderDetail.cardTo")}
                    </label>
                    <p className="text-sm font-medium">
                      {typeof order.cardMessage === "string"
                        ? ""
                        : (
                            order.cardMessage as {
                              to: string;
                              from: string;
                              message: string;
                            }
                          ).to}
                    </p>
                  </div>

                  <Separator />

                  {order.recipientData && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          {t("orderDetail.recipientName")}
                        </label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {String(
                            (order.recipientData as Record<string, unknown>)
                              .name,
                          )}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          {t("orderDetail.email")}
                        </label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {String(
                            (order.recipientData as Record<string, unknown>)
                              .email,
                          )}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          {t("orderDetail.phone")}
                        </label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {String(
                            (order.recipientData as Record<string, unknown>)
                              .phoneNumber,
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
