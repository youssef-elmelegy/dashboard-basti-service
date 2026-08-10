/**
 * Recovery for the "stale bundle after redeploy" failure.
 *
 * Vite content-hashes every chunk, so a deploy renames them and removes the
 * old files. A tab that was opened before the deploy still holds the previous
 * entry chunk in memory, and its `import()` calls still reference the old
 * hashes. The first lazy route the user navigates to after that then fails —
 * the browser asks for a file that no longer exists.
 *
 * The fix is a hard reload: fetching a fresh index.html gets the current chunk
 * names. Neither of the app's existing retry paths achieves that on their own
 * (`navigate(0)` re-runs the route with the same in-memory module graph, and a
 * plain `location.assign` may be served the cached HTML), so this module
 * handles the reload itself.
 */

/**
 * Set while a stale-chunk reload is in flight, so a chunk that is genuinely
 * missing — a bad deploy, an asset 404 that survives a refresh — fails visibly
 * instead of reloading the page forever. sessionStorage rather than
 * localStorage: the guard should cover this navigation only, and must not
 * suppress a legitimate recovery in a tab opened days later.
 */
const RELOAD_GUARD_KEY = "stale-chunk-reload";

/**
 * Detect a failed dynamic import.
 *
 * There is no error code or subclass to test for, so message matching is the
 * only option. The wording is browser-specific, hence several patterns:
 *   - Chrome:  "Failed to fetch dynamically imported module: <url>"
 *   - Firefox: "error loading dynamically imported module"
 *   - Safari:  "Importing a module script failed."
 *
 * The MIME-type variant matters because of the SPA rewrite: a missing asset is
 * answered with index.html, so the browser rejects the HTML as a module rather
 * than reporting a 404.
 */
export function isStaleChunkError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message) return false;

  return (
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    // Emitted when the SPA rewrite returns index.html for a missing chunk.
    (/module script/i.test(message) && /mime type/i.test(message))
  );
}

/**
 * Reload once to pick up the current bundle, if `error` looks like a stale
 * chunk and we have not already tried.
 *
 * Returns true when a reload was triggered, so callers can skip rendering an
 * error screen the user would only see for a moment. Returns false when the
 * error is unrelated or the guard has already fired — in that case the error is
 * real and belongs on screen.
 */
export function recoverFromStaleChunk(error: unknown): boolean {
  if (!isStaleChunkError(error)) return false;

  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
  } catch {
    // Private browsing or a blocked storage partition. Without the guard a
    // reload loop is possible, so prefer showing the error screen: its retry
    // button still gives the user a way forward.
    return false;
  }

  // `location.reload()` is what actually revalidates index.html; assign("/")
  // can be answered from the back/forward cache with the same stale document.
  window.location.reload();
  return true;
}

/**
 * Clear the guard once the app has started successfully.
 *
 * Without this, the one allowed reload is spent for the rest of the session:
 * a tab that recovered in the morning would show the error screen instead of
 * reloading after the afternoon's deploy.
 */
export function clearStaleChunkGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
  } catch {
    // Storage unavailable — nothing was set, so nothing to clear.
  }
}