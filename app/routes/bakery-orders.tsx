import { useState, useEffect, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useOrderStore } from "@/stores/orderStore";
import type { Order } from "@/data/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MapPin,
  Package,
  User,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Check,
  X,
  ChevronLeft,
  Upload,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const qualityCheckItems = [
  { id: "addons", label: "Add-ons Implementation" },
  { id: "printing", label: "Print Verification" },
  { id: "packaging", label: "Safe Packaging" },
  { id: "decoration", label: "Decoration Quality" },
  { id: "freshness", label: "Freshness Check" },
];

// Standalone Image Upload Component (without form context)
function ImageUpload({
  onImageChange,
  initialImage = "",
}: {
  onImageChange: (base64: string) => void;
  initialImage?: string;
}) {
  const [imagePreview, setImagePreview] = useState<string>(initialImage);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onImageChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {!imagePreview ? (
        <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>
      ) : (
        <label className="relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-pointer group">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm">
              Replace Image
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>
      )}
    </div>
  );
}

// Timer Component - Isolated with memo to prevent unnecessary re-renders
const OrderTimer = memo(function OrderTimer({
  assignedAt,
  onExpire,
}: {
  assignedAt?: string;
  onExpire: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!assignedAt) return;

    const assignTime = new Date(assignedAt).getTime();
    const expiryTime = assignTime + 60 * 60 * 1000; // 60 minutes from assignment

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignedAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isExpiring = minutes < 10;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
        isExpiring
          ? "bg-red-500/10 text-red-500"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Clock className="w-3 h-3" />
      <span>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
});

// Cancellation Dialog Component
function CancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderId: string;
}) {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState("");
  const isArabic = i18n.language === "ar";

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason("");
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200",
        isOpen
          ? "bg-black/50 opacity-100 visible"
          : "bg-black/0 opacity-0 invisible"
      )}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md mx-4 shadow-lg"
        dir={isArabic ? "ltr" : "auto"}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <X className="w-5 h-5 text-red-500" />
            {t("bakeryOrders.cancelTitle")} #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("bakeryOrders.cancelDescription")}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("bakeryOrders.enterReason")}
            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
          />
        </CardContent>
        <Separator />
        <div className="flex gap-2 p-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t("bakeryOrders.keepOrder")}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            {t("bakeryOrders.confirm")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Order Card in Sidebar
function OrderSidebarCard({
  order,
  isSelected,
  onSelect,
  onConfirm,
  onDecline,
}: {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onDecline: (reason: string) => void;
}) {
  const isPending = order.status === "pending";
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = (reason: string) => {
    onDecline(reason);
    setShowCancelDialog(false);
  };

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onSelect}
      >
        <CardHeader className="py-0 px-3">
          <div className="space-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-fit cursor-pointer"
              title={`Order ${order.id}`}
            >
              #{order.id}
            </button>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {order.productName}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {order.customerName}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-xs shrink-0",
                  statusColors[order.status]
                )}
              >
                {order.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(order.deliverDay), "MMM d")}
              </span>
              <span>{order.capacitySlots} slots</span>
            </div>

            {isPending && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1">
                    <OrderTimer
                      assignedAt={order.assignedAt}
                      onExpire={onConfirm}
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 rounded-full opacity-40 hover:opacity-100 transition-opacity border border-dashed border-foreground flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirm();
                      }}
                      title="Approve Order"
                    >
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 rounded-full opacity-40 hover:opacity-100 transition-opacity border border-dashed border-foreground flex items-center justify-center"
                      onClick={handleCancelClick}
                      title="Cancel Order"
                    >
                      <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardHeader>
      </Card>
      <CancellationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
        orderId={order.id}
      />
    </>
  );
}

export default function BakeryOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const bakeries = useBakeryStore((state) => state.bakeries);
  const orders = useOrderStore((state) => state.orders);
  const updateOrder = useOrderStore((state) => state.updateOrder);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [qualityChecks, setQualityChecks] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadedImage, setUploadedImage] = useState<string>("");

  const bakery = bakeries.find((b) => b.id === id);
  const bakeryOrders = useMemo(
    () => orders.filter((order) => order.assignedBakeryId === id),
    [orders, id]
  );

  const selectedOrder = bakeryOrders.find((o) => o.id === selectedOrderId);

  // Calculate capacity
  const usedCapacity = bakeryOrders.reduce(
    (sum, order) => sum + order.capacitySlots,
    0
  );
  const capacityPercentage = bakery
    ? (usedCapacity / bakery.capacity) * 100
    : 0;

  const handleConfirm = (orderId: string) => {
    updateOrder(orderId, { status: "confirmed" });
  };

  const handleDecline = (orderId: string, reason: string) => {
    updateOrder(orderId, {
      status: "cancelled",
      cancellationReason: reason,
    });
    // Remove from bakery orders by unassigning
    updateOrder(orderId, {
      assignedBakeryId: undefined,
      assignedBakeryName: undefined,
    });
  };

  const handleQualityCheck = (checkId: string, checked: boolean) => {
    setQualityChecks((prev) => ({ ...prev, [checkId]: checked }));
  };

  const handleStatusChange = (
    newStatus: "preparing" | "ready" | "delivered"
  ) => {
    if (selectedOrderId) {
      updateOrder(selectedOrderId, { status: newStatus });
    }
  };

  if (!bakery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">{t("bakeries.bakeryNotFound")}</h1>
        <Button onClick={() => navigate("/management/bakeries")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("bakeries.backToBakeries")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isRTL ? "pl-88 order-last" : "pr-88 order-first"
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {bakery.name}
              </h1>
              <p className="text-muted-foreground mt-1">{bakery.location}</p>
            </div>

            {/* Capacity Circle */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 40 * (1 - capacityPercentage / 100)
                    }`}
                    className={cn(
                      "transition-all",
                      capacityPercentage >= 85 && "text-red-500",
                      capacityPercentage >= 60 &&
                        capacityPercentage < 85 &&
                        "text-orange-500",
                      capacityPercentage < 60 && "text-green-500"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold">{usedCapacity}</div>
                    <div className="text-xs text-muted-foreground">
                      /{bakery.capacity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="flex-1 overflow-hidden px-6 py-6">
          {selectedOrder ? (
            <ScrollArea className="h-full w-full">
              <div className="grid gap-6 md:grid-cols-2 pb-4 pr-4">
                {/* Product Information */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Product Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      <div className="shrink-0">
                        <img
                          src={selectedOrder.productImage}
                          alt={selectedOrder.productName}
                          className="w-48 h-48 object-cover rounded-lg border"
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-2xl font-semibold mb-1">
                            {selectedOrder.productName}
                          </h3>
                          <Badge variant="secondary" className="capitalize">
                            {selectedOrder.type}
                          </Badge>
                        </div>

                        {selectedOrder.size && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-20">
                              Size:
                            </span>
                            <span className="text-sm">
                              {selectedOrder.size}
                            </span>
                          </div>
                        )}

                        {selectedOrder.flavor && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-20">
                              Flavor:
                            </span>
                            <span className="text-sm">
                              {selectedOrder.flavor}
                            </span>
                          </div>
                        )}

                        {selectedOrder.textOnCake && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-20">
                              Text on Cake:
                            </span>
                            <span className="text-sm font-medium bg-muted px-3 py-1 rounded">
                              "{selectedOrder.textOnCake}"
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
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedOrder.customerPhone}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Region
                      </span>
                      <p className="text-sm font-medium">
                        {selectedOrder.region}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Address
                      </span>
                      <p className="text-sm">
                        {selectedOrder.deliveryLocation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Delivery Date
                        </span>
                        <p className="text-sm font-medium">
                          {format(
                            new Date(selectedOrder.deliverDay),
                            "EEEE, MMMM d, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Control */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Quality Control & Final Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Checklist */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Checklist</h4>
                        {qualityCheckItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={item.id}
                              checked={qualityChecks[item.id] || false}
                              onCheckedChange={(checked) =>
                                handleQualityCheck(item.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={item.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">
                          Final Result Image
                        </h4>
                        <ImageUpload
                          onImageChange={setUploadedImage}
                          initialImage={uploadedImage}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Status Buttons */}
                    <div className="flex gap-2">
                      {selectedOrder.status === "confirmed" && (
                        <Button
                          className="flex-1"
                          onClick={() => handleStatusChange("preparing")}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {selectedOrder.status === "preparing" && (
                        <Button
                          className="flex-1"
                          onClick={() => handleStatusChange("ready")}
                        >
                          Mark as Ready
                        </Button>
                      )}
                      {selectedOrder.status === "ready" && (
                        <Button
                          className="flex-1"
                          onClick={() => handleStatusChange("delivered")}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                      {selectedOrder.status === "delivered" && (
                        <Button className="flex-1" disabled variant="secondary">
                          <Check className="w-4 h-4 mr-2" />
                          Delivered
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requests */}
                {selectedOrder.specialRequests && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Special Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted p-4 rounded-lg">
                        {selectedOrder.specialRequests}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t("bakeryOrders.selectOrderDetails")}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Orders List */}
      <div
        className={cn(
          "fixed top-16 h-[calc(100vh-4rem)] w-88 bg-sidebar z-30 flex flex-col overflow-hidden",
          isRTL ? "left-0 border-r order-first" : "right-0 border-l order-last"
        )}
      >
        <div className="shrink-0 border-b px-4 py-3">
          <h2 className="font-semibold text-lg">
            {t("bakeryOrders.orders")} ({bakeryOrders.length})
          </h2>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 p-4">
            {bakeryOrders.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t("bakeryOrders.noOrdersAssigned")}
              </div>
            ) : (
              bakeryOrders.map((order) => (
                <OrderSidebarCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderId === order.id}
                  onSelect={() => setSelectedOrderId(order.id)}
                  onConfirm={() => handleConfirm(order.id)}
                  onDecline={(reason) => handleDecline(order.id, reason)}
                />
              ))
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}
