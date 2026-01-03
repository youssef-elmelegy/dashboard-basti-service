import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useOrderStore } from "@/stores/orderStore";
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
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        {/* Product Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("orderDetail.productInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="shrink-0">
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-48 h-48 object-cover rounded-lg border"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">
                    {order.productName}
                  </h3>
                  <Badge variant="secondary" className="capitalize">
                    {order.type}
                  </Badge>
                </div>

                {order.size && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-20">
                      {t("orderDetail.size")}:
                    </span>
                    <span className="text-sm">{order.size}</span>
                  </div>
                )}

                {order.flavor && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-20">
                      {t("orderDetail.flavor")}:
                    </span>
                    <span className="text-sm">{order.flavor}</span>
                  </div>
                )}

                {order.textOnCake && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-20">
                      {t("orderDetail.textOnCake")}:
                    </span>
                    <span className="text-sm font-medium bg-muted px-3 py-1 rounded">
                      "{order.textOnCake}"
                    </span>
                  </div>
                )}
              </div>
            </div>
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

        {/* Special Requests */}
        {order.specialRequests && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t("orderDetail.specialRequests")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted p-4 rounded-lg">
                {order.specialRequests}
              </p>
            </CardContent>
          </Card>
        )}

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
                  (v) => v === true
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
                        "MMM d, yyyy 'at' h:mm a"
                      )
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
