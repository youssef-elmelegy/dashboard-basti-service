import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BestSellerBadgeProps {
  className?: string;
}

export function BestSellerBadge({ className }: BestSellerBadgeProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "absolute top-2 start-2 z-10 flex items-center justify-center rounded-full bg-background/85 p-1.5 shadow-sm",
        className,
      )}
      title={t("common.bestSeller")}
      aria-label={t("common.bestSeller")}
    >
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    </div>
  );
}
