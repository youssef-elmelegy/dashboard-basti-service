import { differenceInCalendarDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DaysLeftBadge({
  date,
  className,
}: {
  date?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();

  if (!date) return null;

  const deliverDate = new Date(date);
  if (Number.isNaN(deliverDate.getTime())) return null;

  const daysLeft = differenceInCalendarDays(deliverDate, new Date());

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap max-w-full",
        daysLeft < 0
          ? "border-red-500/50 text-red-500"
          : daysLeft === 0
            ? "border-orange-500/50 text-orange-500"
            : "border-primary/50 text-primary",
        className,
      )}
    >
      {daysLeft < 0
        ? t("orderDetail.daysOverdue", { count: Math.abs(daysLeft) })
        : daysLeft === 0
          ? t("orderDetail.expectedToday")
          : t("orderDetail.daysLeft", { count: daysLeft })}
    </Badge>
  );
}
