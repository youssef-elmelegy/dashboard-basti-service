import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Calendar } from "./ui/calendar";

interface Order {
  id: number;
  customerName: string;
  orderDate: Date;
  status: "completed" | "pending" | "processing";
}

const allOrders: Order[] = [
  {
    id: 1,
    customerName: "Order #001 - Chocolate Cake",
    orderDate: new Date(),
    status: "completed",
  },
  {
    id: 2,
    customerName: "Order #002 - Strawberry Cheesecake",
    orderDate: new Date(),
    status: "completed",
  },
  {
    id: 3,
    customerName: "Order #003 - Vanilla Macarons",
    orderDate: new Date(),
    status: "pending",
  },
  {
    id: 4,
    customerName: "Order #004 - Red Velvet Cake",
    orderDate: new Date(),
    status: "processing",
  },
  {
    id: 5,
    customerName: "Order #005 - Chocolate Truffles",
    orderDate: new Date(),
    status: "completed",
  },
  {
    id: 6,
    customerName: "Order #006 - Lemon Cake",
    orderDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    status: "completed",
  },
  {
    id: 7,
    customerName: "Order #007 - Carrot Cake",
    orderDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    status: "completed",
  },
  {
    id: 8,
    customerName: "Order #008 - Tiramisu",
    orderDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    status: "pending",
  },
  {
    id: 9,
    customerName: "Order #009 - Cheesecake",
    orderDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    status: "completed",
  },
  {
    id: 10,
    customerName: "Order #010 - Mousse Cake",
    orderDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    status: "pending",
  },
];

const OrdersList = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!date) return allOrders;
    return allOrders.filter((order) => isSameDay(order.orderDate, date));
  }, [date]);

  const isCompleted = (status: string) => status === "completed";

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t("dashboard.completed");
      case "pending":
        return t("dashboard.pending");
      case "processing":
        return t("dashboard.processing");
      default:
        return status;
    }
  };

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{t("dashboard.ordersList")}</h1>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full">
            <CalendarIcon />
            {date ? (
              format(date, "PPP")
            ) : (
              <span>{t("dashboard.pickADate")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {/* ORDERS LIST */}
      <ScrollArea className="max-h-100 mt-4 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={`order-${order.id}`}
                    checked={isCompleted(order.status)}
                    disabled
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`order-${order.id}`}
                      className="text-sm font-medium"
                    >
                      {order.customerName}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getStatusText(order.status)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-muted-foreground opacity-50">
                  {t("dashboard.noOrdersForDate")}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OrdersList;
