import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
  const orders = useOrderStore((state) => state.orders);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground">
          The order you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/orders")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Orders
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
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
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
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Product Information */}
        <Card className="lg:col-span-2">
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
                      Size:
                    </span>
                    <span className="text-sm">{order.size}</span>
                  </div>
                )}

                {order.flavor && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-20">
                      Flavor:
                    </span>
                    <span className="text-sm">{order.flavor}</span>
                  </div>
                )}

                {order.textOnCake && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-20">
                      Text on Cake:
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
              Customer
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
                Assigned Bakery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {order.assignedBakeryName}
                </span>
                <Badge variant="secondary">Assigned</Badge>
              </div>
            </CardContent>
          </Card>
        )}

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
              <span className="text-xs text-muted-foreground">Region</span>
              <p className="text-sm font-medium">{order.region}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Address</span>
              <p className="text-sm">{order.deliveryLocation}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground">
                  Delivery Date
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
              Order Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Ordered At</span>
              <p className="text-sm font-medium">
                {format(new Date(order.orderedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                Expected Delivery
              </span>
              <p className="text-sm font-medium">
                {format(new Date(order.deliverDay), "MMM d, yyyy")}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">
                Capacity Slots
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
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Base Price</span>
              <span className="text-sm font-medium">{order.basePrice} EGP</span>
            </div>
            {order.addOns && order.addOns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Add-ons:</span>
                  {order.addOns.map((addon) => (
                    <div key={addon.id} className="flex justify-between pl-2">
                      <span className="text-sm text-muted-foreground">
                        {addon.name} x{addon.quantity}
                      </span>
                      <span className="text-sm">
                        {addon.price * addon.quantity} EGP
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{order.totalPrice} EGP</span>
            </div>
          </CardContent>
        </Card>

        {/* Special Requests */}
        {order.specialRequests && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Special Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted p-4 rounded-lg">
                {order.specialRequests}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
