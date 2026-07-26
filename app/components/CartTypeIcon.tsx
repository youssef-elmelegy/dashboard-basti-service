import { useTranslation } from "react-i18next";
import { Cake, CakeSlice, Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CartType } from "@/lib/services/order.service";

// Colors follow the order-board convention (orders-sidebar-right.tsx):
// big = rose, small = amber, others = teal.
// `print:` variants keep the dot visible in the printed/PDF report.
const CART_TYPE_STYLES: Record<
  CartType,
  { icon: typeof Cake; className: string }
> = {
  big_cakes: {
    icon: Cake,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 print:!bg-rose-200 print:!text-rose-900",
  },
  small_cakes: {
    icon: CakeSlice,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 print:!bg-amber-200 print:!text-amber-900",
  },
  others: {
    icon: Package,
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 print:!bg-teal-200 print:!text-teal-900",
  },
};

/**
 * Small colored badge marking which cart an order was created from.
 * Unknown/missing values fall back to `others` so a row never renders blank.
 */
export function CartTypeIcon({
  cartType,
  className = "",
}: {
  cartType: CartType | string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();

  const key: CartType =
    cartType && cartType in CART_TYPE_STYLES
      ? (cartType as CartType)
      : "others";
  const { icon: Icon, className: colorClass } = CART_TYPE_STYLES[key];
  const label = t(`orders.type.${key}`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${colorClass} ${className}`}
        >
          <Icon className="size-3" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
