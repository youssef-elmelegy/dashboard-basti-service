import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { reportError } from "@/lib/instrument";

/**
 * Presentational error screen. Shared by the router's `errorElement` and the
 * top-level class boundary so a crash looks the same wherever it originates.
 *
 * Deliberately dependency-light: it must not throw while rendering an error,
 * so it avoids stores, data fetching, and anything that could fail a second time.
 */
export function ErrorFallbackView({
  error,
  onRetry,
  /**
   * Use a plain <a> instead of react-router's <Link>. Required when rendering
   * outside a router context (the top-level boundary), where <Link> would throw
   * while we're already handling an error.
   */
  usePlainLink = false,
}: {
  error: unknown;
  onRetry?: () => void;
  usePlainLink?: boolean;
}) {
  const { t } = useTranslation();

  // A thrown Response (e.g. a 404 from a loader) is an expected outcome rather
  // than a crash, so it gets the softer "not found" wording.
  const routeResponse = isRouteErrorResponse(error) ? error : null;
  const description = routeResponse
    ? routeResponse.status === 404
      ? t("common.errorNotFoundDescription")
      : routeResponse.statusText || t("common.errorDescription")
    : t("common.errorDescription");

  const title = routeResponse
    ? `${routeResponse.status}`
    : t("common.errorTitle");

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Empty className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onRetry && (
              <Button onClick={onRetry}>
                <RotateCw className="w-4 h-4" />
                {t("common.retry")}
              </Button>
            )}
            {usePlainLink ? (
              <Button
                variant={onRetry ? "outline" : "default"}
                onClick={() => window.location.assign("/")}
              >
                {t("common.goHome")}
              </Button>
            ) : (
              <Link to="/">
                <Button variant={onRetry ? "outline" : "default"}>
                  {t("common.goHome")}
                </Button>
              </Link>
            )}
          </div>

          {/*
            Stack traces are shown only in dev. In production the details go to
            GlitchTip instead — surfacing them here would leak internals to end
            users without helping them.
          */}
          {import.meta.env.DEV && (
            <details className="mt-4 w-full text-start">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                {t("common.errorDetails")}
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {error instanceof Error
                  ? (error.stack ?? error.message)
                  : String(error)}
              </pre>
            </details>
          )}
        </EmptyContent>
      </Empty>
    </div>
  );
}

/**
 * Router `errorElement`. Catches render-time throws (and loader/action errors)
 * for the route it is attached to, keeping the crash scoped to that subtree.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // 404s and other thrown Responses are routine routing outcomes, not bugs —
    // reporting them would bury real crashes in noise.
    if (!isRouteErrorResponse(error)) {
      reportError(error);
    }
  }, [error]);

  return (
    <ErrorFallbackView
      error={error}
      // Re-run the current route's render/loaders without a full page reload.
      onRetry={() => navigate(0)}
    />
  );
}
