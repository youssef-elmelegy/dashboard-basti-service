# Basti Admin Dashboard — Documentation

The internal admin dashboard for the Basti platform. A React 19 + Vite single-page app used by super admins, admins, managers, and bakery staff to run orders and dispatch, manage the bakery/chef/product catalogue and the custom-cake builder, handle coupons and offers, review finances, and monitor reviews and reports. Fully bilingual (English / Arabic) with right-to-left support.

- **Live:** `https://dashboard.basty.ly`
- **API:** `https://api.basty.ly/api` — see the [backend service documentation](../../backend-basti-service/docs/README.md)

---

## Table of contents

1. [Stack](#stack)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [Project layout](#project-layout)
5. [Architecture](#architecture)
6. [Routing & access control](#routing--access-control)
7. [State management](#state-management)
8. [API layer](#api-layer)
9. [Internationalisation & RTL](#internationalisation--rtl)
10. [Push notifications](#push-notifications)
11. [UI conventions](#ui-conventions)
12. [Build & performance](#build--performance)
13. [Deployment](#deployment)
14. [Error handling & monitoring](#error-handling--monitoring)
15. [Common tasks](#common-tasks)
16. [Troubleshooting](#troubleshooting)

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 7 |
| Language | TypeScript 5.9 |
| Package manager | pnpm |
| Routing | react-router 7 (`createBrowserRouter`, data-router API) |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Components | shadcn/ui (new-york) on Radix primitives, Lucide icons |
| Forms | react-hook-form + Zod via `@hookform/resolvers` |
| Tables | TanStack Table 8 |
| Charts | Recharts 2.15.4 |
| Drag & drop | dnd-kit |
| HTTP | axios (wrapped in a singleton client) |
| i18n | i18next + react-i18next, browser language detection |
| Push | Firebase Cloud Messaging |
| Toasts | sonner |
| Monitoring | `@sentry/react` → self-hosted GlitchTip |

---

## Getting started

### Prerequisites

- Node.js 22+
- pnpm
- A running backend — either local (`http://localhost:3000/api`) or the deployed API

### First run

```bash
pnpm install
# Create .env.local — there is no committed example file; see the table below
pnpm dev                            # http://localhost:5173
```

A minimal `.env.local` for local development against a local backend:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

The dev server uses port 5173 with `strictPort: false`, so it will pick the next free port if 5173 is taken.

> **CORS:** the browser sends cookies to the API, so the backend's `CORS_ORIGINS` must include the exact origin you're serving from. If Vite falls back to a different port, add that origin too — credentialed requests cannot use a wildcard origin.

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | `tsc -b` then `vite build` → `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | ESLint over the project |

There is no test suite in this repo.

---

## Environment variables

Vite only exposes variables prefixed `VITE_`. They are read through [app/config/env.ts](../app/config/env.ts) rather than scattered `import.meta.env` accesses — add new ones there.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | Backend base URL including `/api`. Defaults to `http://localhost:3000/api` |
| `VITE_SENTRY_DSN` | No | GlitchTip DSN. Error reporting is disabled when empty |
| `VITE_SENTRY_RELEASE` | No | Release tag; set to the git SHA in CI to correlate errors with deploys |

Local values go in `.env.local` (gitignored).

> **Everything here ships in the client bundle and is public.** Use a *separate* GlitchTip project from the backend — never reuse the backend's server-side DSN. A Sentry/GlitchTip DSN is a write-only ingest key, so publishing it is expected for browser SDKs; a backend DSN is not.

The Firebase web config and VAPID key in [app/config/firebase.ts](../app/config/firebase.ts) are committed rather than env-driven. That is intentional — Firebase web config values are public identifiers, not secrets — but they must stay in sync with the backend's `FIREBASE_PROJECT_ID` and with [public/firebase-messaging-sw.js](../public/firebase-messaging-sw.js).

---

## Project layout

```
app/
├── main.tsx            # Entry: providers, router, Sentry init
├── root.tsx            # App shell — sidebar + navbar + <Outlet />
├── routes.tsx          # Full route table (lazy-loaded pages)
├── index.css           # Tailwind entry + theme tokens
├── components/         # ~90 feature components
│   ├── ui/             # 32 shadcn/ui primitives
│   ├── auth/           # Auth-screen pieces
│   ├── custom-cakes/   # Cake-builder pieces
│   ├── kanban/         # Dispatch board
│   └── providers/      # Theme provider, etc.
├── config/             # env.ts, firebase.ts
├── hooks/              # useAuth, useCachedData, useNotifications, use-mobile
├── i18n/               # config.ts + locales/{en,ar}.json
├── lib/
│   ├── api-client.ts   # axios singleton: auth refresh, error normalisation
│   ├── api/            # Thin per-domain request wrappers
│   ├── services/       # 21 domain services (the layer routes call)
│   ├── instrument.ts   # Sentry/GlitchTip init
│   └── …               # image utils, language header, upload folders, etc.
├── routes/             # Page components, grouped by section
├── schemas/            # Zod form schemas
├── stores/             # 37 Zustand stores
└── styles/
public/
├── firebase-messaging-sw.js   # FCM background-message service worker
└── logo.svg
```

**Path alias:** `@/*` → `app/*` (declared in both `vite.config.ts` and `tsconfig`).

---

## Architecture

The data path is deliberately layered:

```
route/page component
      │  calls
      ▼
Zustand store  ──►  service (lib/services)  ──►  apiClient  ──►  backend
      │                                              │
      └──────── caches result (isCached) ◄───────────┘
```

- **Pages** never call axios directly. They read state and call actions from a store.
- **Stores** own loading/error/cache state and delegate to a service.
- **Services** map domain operations to endpoints and shape the response.
- **`apiClient`** handles cross-cutting HTTP concerns: language header, cookie credentials, token refresh, error normalisation.

Provider nesting in [app/main.tsx](../app/main.tsx), outermost first: `ErrorBoundary` → `ThemeProvider` → `DeleteDialogProvider` → `AuthInitializer` → `RouterProvider`. The outermost boundary matters — the router's own `errorElement` cannot catch a throw from the providers above it or from `RouterProvider` itself, and without it such a crash renders a blank page. `Toaster` is a sibling of the router, not a route child, so toasts survive navigation.

---

## Routing & access control

All routes are declared in [app/routes.tsx](../app/routes.tsx). Every page except the login screen is `React.lazy`-loaded.

### Route tree

| Path | Page |
| --- | --- |
| `/auth/login`, `/auth/forgot-password`, `/auth/otp-verify`, `/auth/reset-password` | Auth flow (wrapped in `PublicRoute`) |
| `/` | Manager dashboard |
| `/orders`, `/orders/:id`, `/completed-orders` | Orders |
| `/dispatch` | Dispatch / driver assignment board |
| `/orders/bakery/:id`, `/orders/bakery/:id/completed`, `/orders/bakery/:bakeryId/orders/:orderId` | Bakery-scoped orders |
| `/bakery-stock`, `/bakery-reviews` | Bakery operations |
| `/customers`, `/notifications`, `/support`, `/payments`, `/item-detail` | Misc |
| `/settings` | Settings — **`super_admin` / `admin` only** |
| `/management/regions`, `/management/regions/:id`, `/management/regions/:id/drivers`, `/management/regions/:id/drivers/:driverId` | Regions & drivers |
| `/management/bakeries`, `/management/bakeries/:id`, `/management/chefs`, `/management/admins` | Entities |
| `/management/slider-images`, `/management/tags`, `/management/app-config` | Configuration |
| `/products/featured-cakes`, `/products/add-ons`, `/sweets` | Catalogue |
| `/custom-cakes/flavors`, `/shapes`, `/decorations`, `/predesigned-cakes` | Cake builder |
| `/advertisement/coupons`, `/advertisement/offers` | Marketing |
| `/finance/orders`, `/finance/bakery` | Finance |
| `*` | Not found |

### Guards

- **`ProtectedRoute`** wraps the whole `/` subtree; it also accepts `requiredRole` for per-route restriction (as on `/settings`).
- **`PublicRoute`** redirects an already-authenticated user away from the auth screens.
- Role helpers live on the auth store: `isSuperAdmin()`, `isAdmin()`, `isManager()`, `canViewAllContent()`, `canViewBakeryOrders()`.

Client-side role checks are for **navigation and UI affordances only**. The backend enforces authorisation; never treat a hidden button as a security control.

### Error and suspense boundaries

`withErrorBoundary()` in `routes.tsx` attaches a `RouteErrorBoundary` to every route and wraps each element in `Suspense`. Boundaries sit on the **children** of `/`, not on `/` itself, so a crashing page is contained inside `<main>` and the user keeps the sidebar and navbar to navigate away with. `Suspense` sits inside the error boundary so a chunk that fails to download — a stale hash after a redeploy, typically — surfaces the same way a render crash does.

---

## State management

37 Zustand stores in [app/stores/](../app/stores/), roughly one per domain, plus a few UI stores (`deleteDialogStore`, `imageStore`).

### The caching convention

Most data stores expose an `isCached` flag. Pages fetch on mount through `useCachedData`:

```ts
const { items, isCached, fetchItems } = useItemStore();
useCachedData(isCached, fetchItems);
```

The fetch is skipped when data is already cached, so navigating back to a page is instant. To force a refetch, call the store's `invalidate()` action (which clears `isCached`) or pass each store's `forceRefresh` argument.

### Auth store

[app/stores/auth.store.ts](../app/stores/auth.store.ts) uses Zustand's `persist` middleware and owns `login`, `logout`, `checkAuth`, `forgotPassword`, `verifyOtp`, `resetPassword`, plus the role helpers. Note:

- Tokens are **httpOnly cookies** and never touch JavaScript. Persisted state holds only the admin profile and the `isAuthenticated` flag.
- `verifyOtp` / `resetPassword` rely on a `resetToken` cookie set by the backend, so neither takes nor returns a token.
- `fcm.service` is imported **dynamically**, not statically, because it pulls in the ~200 KB Firebase SDK — a static import would put Firebase on the critical path of the login screen, which has no use for push.
- On login the store fires two background calls: FCM token registration and a language sync, both deliberately non-blocking.

### Language invalidation

API-backed data is locale-dependent, so [app/stores/invalidateAllOnLanguageChange.ts](../app/stores/invalidateAllOnLanguageChange.ts) calls `invalidate()` on every API-backed store when the language changes. Pure-UI stores (dialog visibility and the like) are intentionally excluded. **A new data store must expose `invalidate()` and be registered there**, or it will keep serving stale-language data after a switch. `invalidateStoresForTagUsage.ts` does the same narrower job when tag usage changes.

---

## API layer

[app/lib/api-client.ts](../app/lib/api-client.ts) exports a singleton `apiClient` with `get` / `post` / `patch` / `delete`. Built on axios with `withCredentials: true`.

**Request interceptor** attaches `Accept-Language` from the active i18n language.

**Response interceptor** does three things:

1. **Unwraps** the response to `response.data`, so callers receive the `ApiResponse<T>` envelope (`code`, `success`, `message`, `data`, `timestamp`) directly.
2. **Refreshes tokens on 401.** A single refresh is issued against `/admin-auth/refresh` while concurrent 401s park in a queue and are replayed once it resolves — N concurrent failures produce exactly one refresh call. If the refresh fails the queue is rejected (rather than retried against credentials known to be dead) and the user is redirected to `/auth/login` — **except** when already on an `/auth` page, where a hard redirect would reload, re-trigger the mount-time `check-auth` probe, and loop forever. `/admin-auth/refresh` and `/admin-auth/login` are excluded from refresh-on-401; `check-auth` is deliberately *included*, since transparently refreshing is precisely its job.
3. **Normalises errors** into an `ApiError` (`code`, `message`, `details`, `error`, `data`), collapsing the backend's array of validation messages into a single string while preserving the list in `details`.

Because the interceptor rejects with a **plain object, not an `Error` instance**, `error instanceof Error` is false in catch blocks. Use the exported helper:

```ts
import { getApiErrorMessage } from "@/lib/api-client";

try {
  await someService.create(payload);
} catch (err) {
  toast.error(getApiErrorMessage(err, t("errors.generic")));
}
```

`lib/api/` holds thin per-domain request wrappers; `lib/services/` holds the 21 domain services that stores actually call.

---

## Internationalisation & RTL

Configured in [app/i18n/config.ts](../app/i18n/config.ts). Catalogues: [app/i18n/locales/en.json](../app/i18n/locales/en.json) and [ar.json](../app/i18n/locales/ar.json).

- Language is detected from `localStorage` first, then the browser, and cached back to `localStorage`.
- Region codes are normalised (`ar-EG` → `ar`) via `load: "languageOnly"` and `supportedLngs`.
- **`<html dir>` and `<html lang>` are owned centrally** by `config.ts` and applied on init and on every change — components must not set direction themselves. Because `dir` is the single source of truth, Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) flip automatically. Prefer them over `ml-*`/`mr-*` in any new UI.
- A `languageChanged` listener invalidates all API-backed stores, and another syncs the language to the backend (skipped when logged out) so push notifications arrive in the language the admin is actually reading.
- In [app/root.tsx](../app/root.tsx), `<main>` is keyed on `i18n.language`. That remounts the routed page on a language switch so its mount-effect refetches — without it, stores with stable action references would never re-run. The key is scoped to `<main>` so the sidebar and navbar shell are preserved.

Adding a string means adding the key to **both** locale files.

---

## Push notifications

FCM, wired through [app/config/firebase.ts](../app/config/firebase.ts), [app/lib/services/fcm.service.ts](../app/lib/services/fcm.service.ts), [app/hooks/useNotifications.ts](../app/hooks/useNotifications.ts), and the service worker at [public/firebase-messaging-sw.js](../public/firebase-messaging-sw.js).

Flow: login → request notification permission → register the service worker → mint a token with the VAPID key → register it with the backend. Logout deletes the registration **before** clearing auth, while the cookie is still valid, and unsubscribes the browser so the next login mints a fresh token.

Three constraints worth knowing before touching any of this:

1. **The service worker's Firebase SDK version must match the `firebase` npm version** (currently 12.12.1, loaded from `gstatic.com` in the SW). A mismatch makes the SW and the app open the same IndexedDB stores at different schema versions, throwing `VersionError` and blocking `getToken()`.
2. **The project must be `basty-notifications`** in all three places — `app/config/firebase.ts`, the service worker, and the backend's `FIREBASE_PROJECT_ID`. An earlier `baasti` project in the SW meant it was wired to a different sender than the token the app minted, so background pushes silently never matched.
3. Bump `SW_VERSION` in the service worker whenever you change it, so browsers and devtools pick up the new version.

`requestFcmToken()` already recovers from the two known failure modes — an IndexedDB `VersionError` (deletes the stale messaging database and retries) and push-service errors (clears the stale subscription and retries). Both paths log and return `null` rather than throwing, so a browser that blocks push never breaks login.

---

## UI conventions

- **shadcn/ui**, new-york style, `neutral` base, CSS variables — configured in [components.json](../components.json). Primitives live in `app/components/ui/`. Add more with `pnpm dlx shadcn@latest add <component>`.

  > `components.json` points `tailwind.css` at `src/index.css`, but the stylesheet actually lives at `app/index.css`. Verify what the CLI writes when adding components, and move files if needed.

- A `@kibo-ui` registry is configured as an additional component source.
- **Theme** — `ThemeProvider` defaults to dark, persisted under the `vite-ui-theme` localStorage key; `ThemeToggle` switches it.
- **Forms** — react-hook-form with Zod resolvers; shared schemas in [app/schemas/](../app/schemas/).
- **Tables** — TanStack Table, with per-feature column definitions (e.g. `PaymentsColumns.tsx`) and a shared `TablePagination`.
- **Deletes** — go through the app-wide `DeleteDialogProvider` / `useDeleteDialog` rather than a bespoke confirm dialog.
- **Toasts** — `sonner`, via the single `<Toaster />` in `main.tsx`.
- **Icons** — Lucide.

---

## Build & performance

`pnpm build` type-checks (`tsc -b`) before bundling, so type errors fail the build.

[vite.config.ts](../vite.config.ts) carries three deliberate decisions:

**Manual chunking.** Large, stable vendor libraries are split out to keep them off the login screen's critical path and to give them long-lived cache entries that survive app redeploys:

| Chunk | Contents | Why |
| --- | --- | --- |
| `firebase` | Firebase SDK | Loaded on demand by the auth store and `useNotifications` — needs its own chunk to actually stay off the login path |
| `sentry` | `@sentry/*` | Large; initialised before app code but no reason to inline into the entry |
| `date-fns` | date-fns | **Deliberately not grouped with the lazy vendors** — the navbar's notifications dropdown formats timestamps with it, making it a static dependency of the shell. Grouping it dragged the whole group into the entry preload: measured at **+196 KB on first paint** |
| `vendor-heavy` | TanStack table-core, react-day-picker, dnd-kit | Only reachable from lazily-loaded routes |
| `react-vendor` | react, react-dom, react-router | Core runtime |

Anything unmatched stays in the entry chunk on purpose — a long tail of tiny chunks costs more in requests than it saves in bytes.

**`sourcemap: "hidden"`** emits `.map` files without a `sourceMappingURL` comment, so sources aren't exposed to users but production stack traces stay readable once maps are uploaded to GlitchTip. Uploading requires a GlitchTip auth token and belongs in CI.

**`esbuild.drop`** strips all `console.*` and `debugger` statements from production builds, so the deployed app never dumps API errors or debug logs to the browser console. They are kept in dev.

---

## Deployment

Production is served by **Caddy as static files** from `/var/www/dashboard` on the same VPS as the API.

The dashboard has **no CI workflow of its own** — unlike the backend, which auto-deploys from `main`. Deploying is currently a manual build-and-upload:

```bash
# 1. Build with production env values
VITE_API_BASE_URL=https://api.basty.ly/api \
VITE_SENTRY_DSN=<dashboard-glitchtip-dsn> \
VITE_SENTRY_RELEASE=$(git rev-parse HEAD) \
pnpm build

# 2. Upload dist/ to the server
rsync -avz --delete dist/ elmelegy@<SERVER_HOST>:/var/www/dashboard/
```

`--delete` removes files no longer in the build; because hashed assets are cached for a year, leaving stale ones behind is mostly harmless but accumulates.

### Caddy configuration

Defined in the backend repo at `infra/caddy/sites/dashboard.caddy`:

```
dashboard.basty.ly {
	import security_headers
	import hide_dotfiles
	root * /var/www/dashboard
	encode zstd gzip
	try_files {path} /index.html    # SPA fallback for client-side routing
	file_server

	@assets path /assets/*
	header @assets Cache-Control "public, max-age=31536000, immutable"
	header /index.html Cache-Control "no-cache, no-store, must-revalidate"
}
```

The caching split is the important part: hashed assets under `/assets/*` are immutable for a year, while `index.html` is never cached — so a redeploy is picked up immediately and the fresh HTML references the new asset hashes.

### Backend requirements

- `CORS_ORIGINS` on the API must include `https://dashboard.basty.ly` (it does, hardcoded in the deploy workflow). Credentialed cookie requests cannot use a wildcard origin.
- Cookies are set by the API on `api.basty.ly` for use by `dashboard.basty.ly`.

### Alternative target

[vercel.json](../vercel.json) contains a catch-all rewrite to `/index.html` for SPA routing on Vercel, and a `heroku` git remote exists in the repo. Neither is the active path — Caddy is.

---

## Error handling & monitoring

Errors go to a self-hosted GlitchTip, in a **separate project from the backend**.

- [app/lib/instrument.ts](../app/lib/instrument.ts) is imported as the very first line of `main.tsx` so Sentry installs its global handlers before any app code runs. Keep it first.
- Reporting is disabled entirely when `VITE_SENTRY_DSN` is empty, so local dev is silent by default.
- `sendDefaultPii: false` — user and request details are not sent.
- **Default integrations are kept.** Passing `integrations: []` would *replace* the default list (GlobalHandlers, Breadcrumbs, Dedupe, LinkedErrors), silently narrowing reports to what the error boundaries catch and missing async and event-handler throws. Don't do that.
- `browserTracing` and `replay` are omitted — GlitchTip supports them only partially, and they're the expensive, high-volume parts of the SDK.
- `reportError(error, componentStack)` is the single choke point every error boundary calls, so swapping the backing service later is a one-file change. `componentStack` is attached as context because it's what makes a minified production trace legible.

Three boundaries, by scope: `ErrorBoundary` (outermost, catches provider and router crashes), `RouteErrorBoundary` on `/` (shell crashes), and `RouteErrorBoundary` per child route (page crashes, shell preserved).

---

## Common tasks

**Add a page**

1. Create the component under [app/routes/](../app/routes/).
2. Add a `lazy()` import and a route entry in [app/routes.tsx](../app/routes.tsx) — inside the `withErrorBoundary([...])` children so it gets a boundary and Suspense.
3. Add a sidebar link in [app/components/AppSidebar.tsx](../app/components/AppSidebar.tsx).
4. Add translation keys to both locale files.

**Add a data domain**

1. Add a service in `app/lib/services/`, calling `apiClient`.
2. Add a Zustand store in `app/stores/` with `isCached`, loading/error state, and an `invalidate()` action.
3. **Register the store in [app/stores/invalidateAllOnLanguageChange.ts](../app/stores/invalidateAllOnLanguageChange.ts)** — easy to forget, and its absence shows up as stale-language data.
4. Consume it in the page via `useCachedData`.

**Restrict a page by role** — wrap the element in `<ProtectedRoute requiredRole={["super_admin", "admin"]}>`, and confirm the backend enforces the same rule.

**Add a shadcn component** — `pnpm dlx shadcn@latest add <name>`, then check where the CLI wrote it (see the `components.json` path caveat above).

---

## Troubleshooting

**Blank white page in production** — usually a crash above the router. Check GlitchTip; the outer `ErrorBoundary` in `main.tsx` is what normally prevents this.

**Login succeeds then immediately bounces back** — cookies aren't sticking. Verify the API's `CORS_ORIGINS` contains this exact origin, that requests carry credentials, and that you're not mixing `http`/`https`.

**Infinite redirect loop on an auth page** — the api-client deliberately suppresses hard redirects on `/auth/*` paths for exactly this reason; if you add a redirect elsewhere, preserve that check.

**A page shows the previous language after switching** — the store isn't registered in `invalidateAllOnLanguageChange.ts`.

**Push notifications never arrive** — check, in order: the SW's Firebase SDK version matches the npm `firebase` version; all three places use the `basty-notifications` project; notification permission isn't `denied` at the browser level (the code cannot re-prompt once denied); the token registered with the backend after login.

**`VersionError` from `getToken()`** — a stale `firebase-messaging-database` from a previous SDK version. The code already deletes it and retries once; if it persists, clear site data and re-login.

**Stale chunk 404 after a redeploy** — a client holding old HTML requests asset hashes that no longer exist. The Caddy `no-cache` header on `index.html` prevents this; the route-level Suspense-inside-error-boundary arrangement means the user sees a recoverable error rather than a blank page. A refresh fixes it.

**Console is empty in a production build** — expected. `esbuild.drop` strips `console.*`; use GlitchTip, or run `pnpm dev`.
