import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** First letters of up to two name words, e.g. "Sara Omar" -> "SO". */
function initials(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Driver avatar with graceful fallbacks: shows the profile image when present
 * and it loads, otherwise the driver's initials, otherwise a user icon.
 * (Radix Avatar automatically swaps to the fallback if the image fails to load.)
 */
export default function DriverAvatar({
  name,
  image,
  className,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  const text = initials(name);
  return (
    <Avatar className={cn("size-8", className)}>
      {image ? <AvatarImage src={image} alt={name ?? "driver"} /> : null}
      <AvatarFallback className="text-xs">
        {text || <User className="w-1/2 h-1/2 text-muted-foreground" />}
      </AvatarFallback>
    </Avatar>
  );
}
