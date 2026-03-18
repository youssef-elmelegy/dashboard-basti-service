import { useState, useEffect, memo, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useOrderStore } from "@/stores/orderStore";
import { LocationMap } from "@/components/location-map";
import { GreetingCardPreview } from "@/components/greeting-card-preview";
import type { Order, OrderItem } from "@/data/orders";
import { orderApi, type OrderResponse } from "@/lib/services/order.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MapPin,
  Package,
  User,
  Phone,
  Mail,
  Clock,
  Check,
  X,
  ChevronLeft,
  RotateCw,
  Download,
  FileText,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  out_for_delivery: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const orderTypeColors: Record<string, string> = {
  big_cakes: "bg-rose-500/10",
  small_cakes: "bg-amber-500/10",
  others: "bg-teal-500/10",
};

function getOrderTypeStyle(orderType?: string): string {
  if (!orderType) return "bg-background";
  return orderTypeColors[orderType] || "bg-teal-500/10";
}

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

// Standalone Image Upload Component (without form context)
// function ImageUpload({
//   onImageChange,
//   initialImage = "",
// }: {
//   onImageChange: (base64: string) => void;
//   initialImage?: string;
// }) {
//   const [imagePreview, setImagePreview] = useState<string>(initialImage);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64String = reader.result as string;
//         setImagePreview(base64String);
//         onImageChange(base64String);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-3">
//       {!imagePreview ? (
//         <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
//           <div className="flex flex-col items-center justify-center pt-5 pb-6">
//             <Upload className="w-8 h-8 text-muted-foreground mb-2" />
//             <p className="text-sm font-medium">
//               Click to upload or drag and drop
//             </p>
//             <p className="text-xs text-muted-foreground">
//               PNG, JPG, GIF up to 10MB
//             </p>
//           </div>
//           <input
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={handleImageUpload}
//           />
//         </label>
//       ) : (
//         <label className="relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-pointer group">
//           <img
//             src={imagePreview}
//             alt="Preview"
//             className="w-full h-full object-cover"
//           />
//           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
//             <RotateCw className="w-4 h-4 text-white" />
//             <span className="text-white font-medium text-sm">
//               Replace Image
//             </span>
//           </div>
//           <input
//             type="file"
//             className="hidden"
//             accept="image/*"
//             onChange={handleImageUpload}
//           />
//         </label>
//       )}
//     </div>
//   );
// }

// Timer Component - Isolated with memo to prevent unnecessary re-renders
const OrderTimer = memo(function OrderTimer({
  assigningDate,
  onExpire,
}: {
  assigningDate?: string;
  onExpire: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (!assigningDate) return;

    const assignTime = new Date(assigningDate).getTime();
    const expiryTime = assignTime + 60 * 60 * 1000; // 60 minutes from assignment

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      setTimeLeft(remaining);

      if (remaining === 0 && !hasExpired) {
        setHasExpired(true);
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assigningDate, onExpire, hasExpired]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isExpiring = minutes < 10;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
        isExpiring
          ? "bg-red-500/10 text-red-500"
          : "bg-muted text-muted-foreground",
      )}
    >
      <Clock className="w-3 h-3" />
      <span>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
});

// Isolated Pending Order Status Card Component - Only re-renders when order changes, not on timer tick
const PendingOrderStatusCard = memo(function PendingOrderStatusCard({
  assigningDate,
  onConfirm,
  onDecline,
}: {
  orderId: string;
  assigningDate?: string;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              Pending Confirmation
            </p>
            <p className="text-xs text-yellow-700/70 dark:text-yellow-300/70">
              Auto-confirms in 1 hour from assignment
            </p>
          </div>
        </div>
        <OrderTimer assigningDate={assigningDate} onExpire={onConfirm} />
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={onConfirm}
        >
          <Check className="w-4 h-4 mr-2" />
          Accept Order
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onDecline}>
          <X className="w-4 h-4 mr-2" />
          Decline Order
        </Button>
      </div>
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
          : "bg-black/0 opacity-0 invisible",
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

// Order Card in Sidebar - Memoized to prevent re-renders from parent
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
          "cursor-pointer transition-all hover:shadow-md border",
          getOrderTypeStyle(order.type),
          isSelected && "ring-2 ring-primary",
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
              title={`Order ${order.referenceNumber}`}
            >
              #{order.referenceNumber}
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
                  statusColors[order.status],
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
                      assigningDate={order.assigningDate}
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

const MemoizedOrderSidebarCard = memo(OrderSidebarCard);

export default function BakeryOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const currentBakery = useBakeryStore((state) => state.currentBakery);
  const getBakeryById = useBakeryStore((state) => state.getBakeryById);
  const setBakeryOrders = useBakeryStore((state) => state.setBakeryOrders);
  const getCachedBakeryOrders = useBakeryStore(
    (state) => state.getBakeryOrders,
  );
  const updateOrder = useOrderStore((state) => state.updateOrder);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    location.state?.selectedOrderId || null,
  );
  // const [qualityChecks, setQualityChecks] = useState<Record<string, boolean>>(
  //   {},
  // );
  // const [uploadedImage, setUploadedImage] = useState<string>("");
  const [bakeryOrders, setBakeryOrdersLocal] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const autoConfirmedOrders = useRef(new Set<string>());

  // Fetch bakery details on mount or when id changes
  useEffect(() => {
    if (id) {
      getBakeryById(id).catch((error) => {
        console.error("Failed to fetch bakery:", error);
      });
    }
  }, [id, getBakeryById]);

  // Fetch bakery-specific orders
  useEffect(() => {
    if (!id) return;

    const fetchBakeryOrders = async () => {
      try {
        // Check if orders are cached
        const cachedOrders = getCachedBakeryOrders(id);
        if (cachedOrders && cachedOrders.length > 0) {
          console.log("Using cached bakery orders");
          setBakeryOrdersLocal(cachedOrders);
          setIsLoadingOrders(false);
          return;
        }

        setIsLoadingOrders(true);
        // Updated statuses to exclude 'cancelled' and 'delivered'
        const statuses = [
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "out_for_delivery",
        ];

        // Fetch orders for this specific bakery with status filter
        const response = await orderApi.getBakeryOrders(id, {
          status: statuses,
        });

        if (response.success && response.data) {
          // Convert API responses to internal Order format
          const bakeryOrdersList = response.data.map(
            (apiOrder: OrderResponse) => {
              const orderItems = [
                ...(apiOrder.addons || []),
                ...(apiOrder.sweets || []),
                ...(apiOrder.featuredCakes || []),
                ...(apiOrder.predesignedCakes || []),
                ...(apiOrder.customCakes || []),
              ];

              const featuredCakesArray = Array.isArray(apiOrder.featuredCakes)
                ? apiOrder.featuredCakes
                : [];
              const firstFeaturedImage =
                featuredCakesArray.length > 0 &&
                featuredCakesArray[0]?.data?.images
                  ? (featuredCakesArray[0].data.images as string[])[0]
                  : "";

              return {
                id: apiOrder.id,
                referenceNumber: apiOrder.referenceNumber,
                customerName:
                  apiOrder.userData?.firstName +
                  " " +
                  apiOrder.userData?.lastName,
                customerPhone: apiOrder.userData?.phoneNumber,
                customerEmail: apiOrder.userData?.email,
                type:
                  (apiOrder.cartType as
                    | "basket_cakes"
                    | "midume"
                    | "small_cakes"
                    | "large_cakes"
                    | "custom") || "basket_cakes",
                productName: apiOrder.cartType || "Custom Order",
                productImage: firstFeaturedImage || "",
                basePrice: apiOrder.totalPrice,
                totalPrice: apiOrder.finalPrice,
                deliveryLocation: apiOrder.locationData?.description || "",
                region: apiOrder.regionName,
                deliverDay: apiOrder.willDeliverAt,
                orderedAt: apiOrder.createdAt,
                status: apiOrder.orderStatus as
                  | "pending"
                  | "confirmed"
                  | "preparing"
                  | "ready"
                  | "delivered"
                  | "cancelled",
                capacitySlots: apiOrder.totalCapacity,
                assignedBakeryId: apiOrder.bakeryId || undefined,
                specialRequests: apiOrder.deliveryNote || undefined,
                deliveryNote: apiOrder.deliveryNote || undefined,
                keepAnonymous: apiOrder.keepAnonymous,
                deliveryLatitude: apiOrder.locationData?.latitude,
                deliveryLongitude: apiOrder.locationData?.longitude,
                assigningDate: apiOrder.assigningDate,
                orderItems,
                addons: apiOrder.addons,
                sweets: apiOrder.sweets,
                featuredCakes: apiOrder.featuredCakes,
                predesignedCakes: apiOrder.predesignedCakes,
                customCakes: apiOrder.customCakes,
                cardMessage: apiOrder.cardMessage
                  ? (() => {
                      try {
                        const parsed =
                          typeof apiOrder.cardMessage === "string"
                            ? JSON.parse(apiOrder.cardMessage)
                            : apiOrder.cardMessage;
                        return {
                          to: parsed.to,
                          from: parsed.from,
                          message: parsed.message,
                          link: parsed.link,
                        };
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined,
                recipientData: apiOrder.recipientData
                  ? (() => {
                      try {
                        const parsed =
                          typeof apiOrder.recipientData === "string"
                            ? JSON.parse(apiOrder.recipientData)
                            : apiOrder.recipientData;
                        return {
                          name: parsed.name,
                          email: parsed.email,
                          phoneNumber: parsed.phoneNumber,
                        };
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined,
              } as Order;
            },
          );

          // Server already filters by bakery, just set the orders
          setBakeryOrdersLocal(bakeryOrdersList);
          // Store in cache
          setBakeryOrders(id, bakeryOrdersList);
        }
      } catch (error) {
        console.error("Failed to fetch bakery orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchBakeryOrders();
  }, [id, getCachedBakeryOrders, setBakeryOrders]);

  const bakery = currentBakery;
  const selectedOrder = bakeryOrders.find((o) => o.id === selectedOrderId);

  // Calculate capacity
  const usedCapacity = bakeryOrders.reduce(
    (sum, order) => sum + order.capacitySlots,
    0,
  );
  const capacityPercentage = bakery
    ? (usedCapacity / bakery.capacity) * 100
    : 0;

  const handleConfirm = useCallback(
    async (orderId: string) => {
      try {
        console.log(`[Auto-Confirm] Confirming order: ${orderId}`);
        // Call the status change endpoint to set status to confirmed
        const response = await orderApi.changeOrderStatus(orderId, "confirmed");

        if (response.success) {
          console.log(
            `[Auto-Confirm] Order confirmed successfully: ${orderId}`,
          );
          // Update the local bakery orders list with the new status
          const updatedOrders = bakeryOrders.map((order) =>
            order.id === orderId
              ? { ...order, status: "confirmed" as const }
              : order,
          ) as Order[];

          // Update both local state and store
          setBakeryOrdersLocal(updatedOrders);
          if (id) setBakeryOrders(id, updatedOrders);

          // Also update the global order store
          updateOrder(orderId, { status: "confirmed" });
        }
      } catch (error) {
        console.error(
          `[Auto-Confirm] Failed to confirm order ${orderId}:`,
          error,
        );
      }
    },
    [bakeryOrders, id, setBakeryOrders, updateOrder],
  );

  const handleDecline = async (orderId: string, reason: string) => {
    try {
      // Call the unassign-bakery endpoint with the reason
      const response = await orderApi.unassignFromBakery(orderId, reason);

      if (response.success) {
        // Remove the order from the bakery orders list
        const updatedOrders = bakeryOrders.filter(
          (order) => order.id !== orderId,
        ) as Order[];

        // Update both local state and store
        setBakeryOrdersLocal(updatedOrders);
        if (id) setBakeryOrders(id, updatedOrders);

        // Reset selected order if it's the one being removed
        if (selectedOrderId === orderId) {
          setSelectedOrderId(null);
        }
      }
    } catch (error) {
      console.error("Failed to unassign order from bakery:", error);
    }
  };

  // const handleQualityCheck = (checkId: string, checked: boolean) => {
  //   setQualityChecks((prev) => ({ ...prev, [checkId]: checked }));
  // };

  // Memoized callback for confirming pending order
  const handleConfirmPending = useCallback(() => {
    if (selectedOrder?.id) {
      handleConfirm(selectedOrder.id);
    }
  }, [selectedOrder?.id, handleConfirm]);

  // Memoized callback for declining pending order
  const handleDeclinePending = useCallback(() => {
    if (selectedOrder?.id) {
      handleDecline(selectedOrder.id, "Declined by bakery");
    }
  }, [selectedOrder?.id, handleDecline]);

  const handleStatusChange = async (
    newStatus: "preparing" | "ready" | "out_for_delivery" | "delivered",
  ) => {
    if (!selectedOrderId) return;

    try {
      setIsChangingStatus(true);

      // Call the API to update the order status
      const response = await orderApi.changeOrderStatus(
        selectedOrderId,
        newStatus,
      );

      if (response.success) {
        // Update the local bakery orders list with the new status
        const updatedOrders = bakeryOrders.map((order) =>
          order.id === selectedOrderId
            ? { ...order, status: newStatus }
            : order,
        ) as Order[];

        // Update both local state and store
        setBakeryOrdersLocal(updatedOrders);
        if (id) setBakeryOrders(id, updatedOrders);

        // Also update the global order store
        updateOrder(selectedOrderId, { status: newStatus });
      }
    } catch (error) {
      console.error("Failed to change order status:", error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Auto-confirm order when timer expires if status is still pending
  useEffect(() => {
    if (
      !selectedOrder ||
      selectedOrder.status !== "pending" ||
      !selectedOrder.assigningDate
    ) {
      return;
    }

    // Skip if already auto-confirmed
    if (autoConfirmedOrders.current.has(selectedOrder.id)) {
      console.log(
        `[Auto-Confirm] Order already auto-confirmed: ${selectedOrder.id}`,
      );
      return;
    }

    const assignTime = new Date(selectedOrder.assigningDate).getTime();
    const expiryTime = assignTime + 60 * 60 * 1000; // 60 minutes from assignment
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    console.log(
      `[Auto-Confirm] Order: ${selectedOrder.id}, Time until expiry: ${timeUntilExpiry}ms, Assigning Date: ${selectedOrder.assigningDate}`,
    );

    // If already expired, confirm immediately
    if (timeUntilExpiry <= 0) {
      console.log(
        `[Auto-Confirm] Order expired, confirming immediately: ${selectedOrder.id}`,
      );
      autoConfirmedOrders.current.add(selectedOrder.id);
      handleConfirm(selectedOrder.id);
      return;
    }

    // Set a timeout to confirm when the timer expires
    console.log(
      `[Auto-Confirm] Setting timeout for ${timeUntilExpiry}ms for order: ${selectedOrder.id}`,
    );
    const timeoutId = setTimeout(() => {
      console.log(
        `[Auto-Confirm] Timer expired, confirming order: ${selectedOrder.id}`,
      );
      autoConfirmedOrders.current.add(selectedOrder.id);
      handleConfirm(selectedOrder.id);
    }, timeUntilExpiry);

    return () => {
      clearTimeout(timeoutId);
      console.log(
        `[Auto-Confirm] Cleanup timeout for order: ${selectedOrder.id}`,
      );
    };
  }, [
    selectedOrder?.id,
    selectedOrder?.status,
    selectedOrder?.assigningDate,
    handleConfirm,
  ]);

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
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile FAB Toggle Button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isRTL ? "lg:pl-88 order-last" : "lg:pr-88 order-first",
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {bakery.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {bakery.locationDescription}
              </p>
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
                      capacityPercentage < 60 && "text-green-500",
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
                {/* Order Items */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order Items
                      {selectedOrder.orderItems &&
                        selectedOrder.orderItems.length > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {selectedOrder.orderItems.length}
                          </Badge>
                        )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.orderItems &&
                    selectedOrder.orderItems.length > 0 ? (
                      <div
                        className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent"
                        style={{ scrollbarWidth: "thin" }}
                      >
                        {selectedOrder.orderItems.map((item, index) => {
                          // Check if this is a custom cake
                          const isCustomCake = Boolean(item.customCake);
                          const itemData = item.data as Record<string, unknown>;

                          // Get image from different sources based on item type
                          const imageUrl = isCustomCake
                            ? ((
                                item.customCake as unknown as Record<
                                  string,
                                  unknown
                                >
                              )?.snapshotFront as string) ||
                              ((
                                item.customCake as unknown as Record<
                                  string,
                                  unknown
                                >
                              )?.snapshotTop as string) ||
                              ""
                            : (Array.isArray(itemData?.images) &&
                                (itemData.images[0] as string)) ||
                              (typeof itemData?.thumbnailUrl === "string" &&
                                itemData.thumbnailUrl) ||
                              (typeof itemData?.decorationTopView ===
                                "string" &&
                                itemData.decorationTopView) ||
                              "";

                          return (
                            <div
                              key={item.id}
                              className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                navigate("/item-detail", {
                                  state: {
                                    item,
                                    bakeryId: id,
                                    selectedOrderId,
                                  },
                                });
                              }}
                            >
                              <div className="flex gap-4">
                                {/* Item Image */}
                                {imageUrl && (
                                  <div className="shrink-0">
                                    <img
                                      src={imageUrl}
                                      alt={
                                        isCustomCake
                                          ? "Custom Cake"
                                          : item.data?.name
                                      }
                                      className="w-24 h-24 object-cover rounded-lg border"
                                    />
                                  </div>
                                )}

                                {/* Item Details */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="text-sm font-semibold">
                                        {isCustomCake
                                          ? "Custom Cake"
                                          : item.data?.name || "Item"}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="mt-1 capitalize"
                                      >
                                        {getItemCategory(item)}
                                      </Badge>
                                    </div>
                                  </div>

                                  {!isCustomCake && item.data?.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.data.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 pt-2 text-sm">
                                    <span className="font-medium">
                                      Quantity:{" "}
                                      <span className="font-bold text-primary">
                                        {item.quantity}
                                      </span>
                                    </span>
                                  </div>

                                  {item.size && (
                                    <div className="text-xs text-muted-foreground">
                                      Size: {item.size}
                                    </div>
                                  )}

                                  {item.flavor && (
                                    <div className="text-xs text-muted-foreground">
                                      Flavor: {item.flavor}
                                    </div>
                                  )}

                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                                    Click to view details
                                  </div>
                                </div>
                              </div>
                              {index < selectedOrder.orderItems!.length - 1 && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No items in this order
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Order Design */}
                {selectedOrder.designFile && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Order Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <img
                          src={selectedOrder.designFile}
                          alt="Order Design"
                          className="w-full h-auto max-h-96 object-cover rounded-lg border"
                        />
                        <a
                          href={selectedOrder.designFile}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full justify-center"
                        >
                          <Download className="w-4 h-4" />
                          Download Design
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                            "EEEE, MMMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Location Map */}
                {selectedOrder.deliveryLatitude &&
                  selectedOrder.deliveryLongitude && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Delivery Location Map
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LocationMap
                          latitude={selectedOrder.deliveryLatitude}
                          longitude={selectedOrder.deliveryLongitude}
                          address={selectedOrder.deliveryLocation}
                          className="w-full h-64 rounded-lg border"
                        />
                      </CardContent>
                    </Card>
                  )}

                {/* Design Image to Print */}
                {selectedOrder.customCakes &&
                  selectedOrder.customCakes.length > 0 &&
                  selectedOrder.customCakes.some(
                    (cake: Record<string, unknown>) =>
                      (cake.data as unknown as Record<string, unknown>)
                        ?.imageToPrint ||
                      (cake.customCake as unknown as Record<string, unknown>)
                        ?.imageToPrint,
                  ) &&
                  (() => {
                    const firstCake = selectedOrder.customCakes?.[0];
                    const imageUrl =
                      ((firstCake?.data as unknown as Record<string, unknown>)
                        ?.imageToPrint as string | undefined) ||
                      ((
                        firstCake?.customCake as unknown as Record<
                          string,
                          unknown
                        >
                      )?.imageToPrint as string | undefined);
                    const cakeName =
                      ((firstCake?.data as unknown as Record<string, unknown>)
                        ?.name as string | undefined) ||
                      ((
                        firstCake?.customCake as unknown as Record<
                          string,
                          unknown
                        >
                      )?.name as string | undefined) ||
                      "cake-1";

                    return imageUrl ? (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Download className="w-4 h-4" />
                              Design to Print
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-4 h-64">
                          <div className="w-full h-full">
                            <div className="rounded-lg overflow-hidden border bg-muted h-48">
                              <img
                                src={imageUrl}
                                alt="Design to Print"
                                className="w-full h-full object-contain bg-white"
                              />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                className="flex-1 gap-2 text-xs h-8"
                                onClick={() =>
                                  downloadImage(
                                    imageUrl,
                                    `${cakeName}-design.png`,
                                  )
                                }
                              >
                                <Download className="w-3 h-3" />
                                Download Design
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()}

                {/* Status Buttons */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {selectedOrder.status === "pending" &&
                        selectedOrder.assigningDate && (
                          <PendingOrderStatusCard
                            orderId={selectedOrder.id}
                            assigningDate={selectedOrder.assigningDate}
                            onConfirm={handleConfirmPending}
                            onDecline={handleDeclinePending}
                          />
                        )}
                      {selectedOrder.status === "confirmed" && (
                        <Button
                          className="flex-1"
                          disabled={isChangingStatus}
                          onClick={() => handleStatusChange("preparing")}
                        >
                          {isChangingStatus ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Start Preparing"
                          )}
                        </Button>
                      )}
                      {selectedOrder.status === "preparing" && (
                        <Button
                          className="flex-1"
                          disabled={isChangingStatus}
                          onClick={() => handleStatusChange("ready")}
                        >
                          {isChangingStatus ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Mark as Ready"
                          )}
                        </Button>
                      )}
                      {selectedOrder.status === "ready" && (
                        <Button
                          className="flex-1"
                          disabled={isChangingStatus}
                          onClick={() => handleStatusChange("out_for_delivery")}
                        >
                          {isChangingStatus ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Out for Delivery"
                          )}
                        </Button>
                      )}
                      {selectedOrder.status === "out_for_delivery" && (
                        <Button
                          className="flex-1"
                          disabled={isChangingStatus}
                          onClick={() => handleStatusChange("delivered")}
                        >
                          {isChangingStatus ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Mark as Delivered"
                          )}
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

                {/* General Order Details */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        General Order Details
                      </CardTitle>
                      <Badge
                        variant={
                          selectedOrder.keepAnonymous ? "default" : "secondary"
                        }
                      >
                        {selectedOrder.keepAnonymous
                          ? "Anonymous Order"
                          : "Not Anonymous"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Delivery Note
                      </span>
                      <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                        {selectedOrder.deliveryNote ||
                          "No delivery note provided"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Greeting Card Details */}
                {selectedOrder.cardMessage && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Greeting Card
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            downloadCardAsImage(selectedOrder.cardMessage!);
                          }}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Card
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Card Preview */}
                        <div className="flex-1">
                          <GreetingCardPreview
                            cardMessage={
                              selectedOrder.cardMessage as {
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
                              From
                            </label>
                            <p className="text-sm font-medium">
                              {selectedOrder.cardMessage.from}
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                              To
                            </label>
                            <p className="text-sm font-medium">
                              {selectedOrder.cardMessage.to}
                            </p>
                          </div>

                          <Separator />

                          {selectedOrder.recipientData && (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                  Recipient Name
                                </label>
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  {selectedOrder.recipientData.name}
                                </p>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                  Email
                                </label>
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  {selectedOrder.recipientData.email}
                                </p>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                  Phone
                                </label>
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  {selectedOrder.recipientData.phoneNumber}
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
          "h-[calc(100vh-4rem)] w-88 bg-sidebar z-30 flex flex-col overflow-hidden transition-transform duration-300",
          "lg:fixed lg:top-16 lg:translate-x-0",
          isRTL
            ? "lg:left-0 lg:border-r order-first"
            : "lg:right-0 lg:border-l order-last",
          isSidebarOpen
            ? "fixed top-16 right-0 border-l shadow-lg translate-x-0"
            : "fixed top-16 right-0 translate-x-full",
        )}
      >
        <div className="shrink-0 border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {t("bakeryOrders.orders")} ({bakeryOrders.length})
          </h2>
          <button
            className="lg:hidden p-1 hover:bg-muted rounded transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 p-4">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <RotateCw className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t("common.loading")}
                  </p>
                </div>
              </div>
            ) : bakeryOrders.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t("bakeryOrders.noOrdersAssigned")}
              </div>
            ) : (
              bakeryOrders.map((order) => (
                <MemoizedOrderSidebarCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderId === order.id}
                  onSelect={() => {
                    setSelectedOrderId(order.id);
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  onConfirm={() => handleConfirm(order.id)}
                  onDecline={(reason) => handleDecline(order.id, reason)}
                />
              ))
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Item Detail Modal */}
      {/* Modal removed - now using full page navigation */}
    </div>
  );
}
