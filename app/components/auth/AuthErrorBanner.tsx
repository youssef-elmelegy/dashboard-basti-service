import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AuthErrorBannerProps {
  /** The message to show. Rendered verbatim — the backend owns the wording. */
  message: string;
  onDismiss: () => void;
}

/**
 * Error banner shared by the auth screens.
 *
 * Callers must clear every source they render from — the local error *and* the
 * store's — or dismissing appears to do nothing: the store error survives and
 * the banner re-renders on the next tick.
 */
export function AuthErrorBanner({ message, onDismiss }: AuthErrorBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
    >
      <span className="min-w-0 wrap-break-word">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("common.dismiss")}
        className="-me-1 -mt-1 shrink-0 rounded p-1 text-red-700/70 transition-colors hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:text-red-300/70 dark:hover:text-red-300"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
