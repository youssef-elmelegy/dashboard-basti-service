import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small copy-to-clipboard button used on order cards to grab the order's
 * reference number (or id as a fallback). The reference is what the paste-to-
 * assign input in each bakery column resolves against, so this is the source
 * end of that flow.
 *
 * Stops mousedown/click propagation so it never starts a card drag (dnd-kit
 * activates on mousedown) or triggers the card's navigate-on-click.
 */
export function CopyReferenceButton({
  value,
  title,
  className,
}: {
  value: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — silently ignore.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseDown={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer",
        className,
      )}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}
