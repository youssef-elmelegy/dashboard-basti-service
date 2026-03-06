import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useOrderStore } from "@/stores/orderStore";
import { LocationMap } from "@/components/location-map";
import type { OrderItem } from "@/data/orders";
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

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

/**
 * Get the category type of an order item
 */
function getItemCategory(item: OrderItem): string {
  if (item.addonId) return "Add-on";
  if (item.sweetId) return "Sweet";
  if (item.featuredCakeId) return "Featured Cake";
  if (item.predesignedCakeId) return "Predesigned Cake";
  if (item.customCake) return "Custom Cake";
  return "Item";
}

// Function to download greeting card as image
function downloadCardAsImage(cardMessage: {
  to: string;
  from: string;
  message: string;
}) {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fef3c7"); // amber-50
  gradient.addColorStop(1, "#fed7aa"); // orange-50
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw border
  ctx.strokeStyle = "#fbbf24"; // amber-200
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Set text properties
  ctx.fillStyle = "#78350f"; // amber-900
  ctx.textAlign = "center";

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
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const orders = useOrderStore((state) => state.orders);

  const order = orders.find((o) => o.id === id);

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
            <Badge
              variant="outline"
              className={`${statusColors[order.status]} capitalize`}
            >
              {order.status}
            </Badge>
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
              {order.orderItems && order.orderItems.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {order.orderItems.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.orderItems && order.orderItems.length > 0 ? (
              <div
                className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent"
                style={{ scrollbarWidth: "thin" }}
              >
                {order.orderItems.map((item, index) => {
                  // Get image from different sources based on item type
                  const itemData = item.data as Record<string, unknown>;
                  const imageUrl =
                    (Array.isArray(itemData?.images) &&
                      (itemData.images[0] as string)) ||
                    (typeof itemData?.thumbnailUrl === "string" &&
                      itemData.thumbnailUrl) ||
                    (typeof itemData?.decorationTopView === "string" &&
                      itemData.decorationTopView) ||
                    "";

                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        {imageUrl && (
                          <div className="shrink-0">
                            <img
                              src={imageUrl}
                              alt={item.data?.name}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold">
                                {item.data?.name || t("orderDetail.item")}
                              </h4>
                              <Badge
                                variant="outline"
                                className="mt-1 capitalize"
                              >
                                {getItemCategory(item)}
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

                          <div className="flex items-center gap-4 pt-2 text-sm">
                            <span className="font-medium">
                              {t("orderDetail.quantity")}:{" "}
                              <span className="font-bold text-primary">
                                {item.quantity}
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              {t("orderDetail.total")}:{" "}
                              {item.quantity * item.price}{" "}
                              {t("orderDetail.egp")}
                            </span>
                          </div>

                          {item.size && (
                            <div className="text-xs text-muted-foreground">
                              {t("orderDetail.size")}: {item.size}
                            </div>
                          )}

                          {item.flavor && (
                            <div className="text-xs text-muted-foreground">
                              {t("orderDetail.flavor")}: {item.flavor}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < order.orderItems!.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  );
                })}
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
              <span className="text-sm font-medium">{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.customerPhone}</span>
              </div>
            )}
            {order.customerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{order.customerEmail}</span>
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
              <p className="text-sm font-medium">{order.region}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.address")}
              </span>
              <p className="text-sm">{order.deliveryLocation}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("orderDetail.deliveryDate")}
                </span>
                <p className="text-sm font-medium">
                  {format(new Date(order.deliverDay), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Location Map */}
        {order.deliveryLatitude && order.deliveryLongitude && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("orderDetail.deliveryMap") || "Delivery Location Map"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap
                latitude={order.deliveryLatitude}
                longitude={order.deliveryLongitude}
                address={order.deliveryLocation}
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
                {format(new Date(order.orderedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.expectedDelivery")}
              </span>
              <p className="text-sm font-medium">
                {format(new Date(order.deliverDay), "MMM d, yyyy")}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                {t("orderDetail.capacitySlots")}
              </span>
              <p className="text-sm font-medium">{order.capacitySlots}</p>
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
                  {order.addOns.map((addon) => (
                    <div key={addon.id} className="flex justify-between pl-2">
                      <span className="text-sm text-muted-foreground">
                        {addon.name} x{addon.quantity}
                      </span>
                      <span className="text-sm">
                        {addon.price * addon.quantity} {t("orderDetail.egp")}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t("orderDetail.total")}</span>
              <span>
                {order.totalPrice} {t("orderDetail.egp")}
              </span>
            </div>
          </CardContent>
        </Card>

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
              {(() => {
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
                            {isChecked && (
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
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isChecked
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {checkLabels[checkId] || checkId}
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
                        new Date(order.finalImageUploadedAt),
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
                  onClick={() => downloadCardAsImage(order.cardMessage!)}
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
                  <div
                    className={`relative bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200 shadow-lg min-h-96 flex flex-col overflow-hidden ${i18n.language === "ar" ? "rtl" : "ltr"}`}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

                    {/* Top - To field */}
                    <div
                      className={`relative z-10 ${i18n.language === "ar" ? "text-right" : "text-left"}`}
                    >
                      <p className="text-sm text-amber-700/70 font-medium">
                        {i18n.language === "ar" ? (
                          <>
                            {t("orderDetail.cardTo")}
                            {": "}
                            <span className="font-semibold">
                              {order.cardMessage.to}
                            </span>
                          </>
                        ) : (
                          <>
                            {t("orderDetail.cardTo")}:
                            <span className="font-semibold">
                              {order.cardMessage.to}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Middle - Centered Message */}
                    <div className="relative z-10 flex-1 flex items-center justify-center">
                      <p className="text-2xl font-serif italic text-amber-900 leading-relaxed text-center">
                        {order.cardMessage.message}
                      </p>
                    </div>

                    {/* Bottom - Signature */}
                    <div
                      className={`relative z-10 ${i18n.language === "ar" ? "text-left" : "text-right"}`}
                    >
                      <p className="text-sm text-amber-700/70">
                        {t("orderDetail.cardWithWarmWishes")}
                      </p>
                      <p className="text-lg font-serif text-amber-900">
                        {order.cardMessage.from}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="lg:w-64 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("orderDetail.cardFrom")}
                    </label>
                    <p className="text-sm font-medium">
                      {order.cardMessage.from}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("orderDetail.cardTo")}
                    </label>
                    <p className="text-sm font-medium">
                      {order.cardMessage.to}
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
                          {order.recipientData.name}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          {t("orderDetail.email")}
                        </label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {order.recipientData.email}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          {t("orderDetail.phone")}
                        </label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {order.recipientData.phoneNumber}
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
