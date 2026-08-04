import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/instrument";
import { ErrorFallbackView } from "@/components/ErrorFallback";

interface Props {
  children: ReactNode;
  /** Rendered instead of the default screen — used where router hooks are unavailable. */
  fallback?: ReactNode;
}

interface State {
  error: unknown;
  hasError: boolean;
}

/**
 * Last-resort boundary for the provider tree.
 *
 * The router's `errorElement` cannot catch throws that happen *above*
 * `RouterProvider` (ThemeProvider, DeleteDialogProvider, AuthInitializer) or
 * inside RouterProvider itself. Without this, those still produce a blank page.
 *
 * A class component is required: `getDerivedStateFromError` / `componentDidCatch`
 * have no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    reportError(error, info.componentStack);
  }

  private handleRetry = () => {
    // No router access at this level, so recover with a full reload rather than
    // a route re-navigation.
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <ErrorFallbackView
        error={this.state.error}
        onRetry={this.handleRetry}
        // No router above this boundary — <Link> would throw here.
        usePlainLink
      />
    );
  }
}

export default ErrorBoundary;
