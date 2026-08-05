# Basty — Admin Dashboard

The web control panel for Basty, a cake and sweets ordering platform. Admins, managers, and bakery staff use it to work orders, manage the catalog and the cake customizer, run regions and drivers, and handle finance and promotions.

Built with **React 19**, **Vite 7**, **TypeScript**, **Tailwind CSS 4**, and **shadcn/ui**, against the [Basty backend service](../backend-basti-service/README.md).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Routing](#routing)
- [State management](#state-management)
- [API layer](#api-layer)
- [Internationalization](#internationalization)
- [Notifications](#notifications)
- [Build & performance](#build--performance)
- [Error handling & monitoring](#error-handling--monitoring)
- [Deployment](#deployment)

---

## Features

| Area | What it covers |
| --- | --- |
| Orders | Live order board, order detail, completed orders, dispatch, per-bakery queues |
| Dispatch | Assigning orders to drivers, tracking assigned vs. unassigned work |
| Bakeries | Bakery directory and detail, stock, per-bakery reviews and orders |
| Management | Regions, region drivers, driver detail, chefs, admins, tags, slider images, app config |
| Products | Featured cakes, add-ons, sweets |
| Cake customizer | Shapes, flavors, decorations, predesigned cakes |
| Advertisement | Coupons and offers |
| Finance | Order-level finance and bakery payouts |
| Platform | Customers, payments, notifications, support, settings |

## Tech stack

- **Framework** — React 19 with React Router 7 (`createBrowserRouter`)
- **Build** — Vite 7, TypeScript 5.9
- **Styling** — Tailwind CSS 4 via `@tailwindcss/vite`, shadcn/ui on Radix primitives, `lucide-react` icons
- **State** — Zustand (one store per domain, `persist` for auth)
- **Forms** — React Hook Form + Zod via `@hookform/resolvers`
- **Data display** — TanStack Table, Recharts, `@dnd-kit` for the kanban board
- **HTTP** — Axios, wrapped in a typed client with token-refresh handling
- **i18n** — i18next / react-i18next with browser language detection (English + Arabic)
- **Push** — Firebase Cloud Messaging
- **Feedback** — Sonner toasts
- **Monitoring** — Sentry / GlitchTip

## Getting started

**Prerequisites:** Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.local.example .env.local   # or create .env.local by hand
pnpm dev
```

The dev server runs on `http://localhost:5173`. Point `VITE_API_BASE_URL` at a running backend — locally that's `http://localhost:3000/api`.

## Environment variables

Vite only exposes variables prefixed with `VITE_`. Defaults live in `app/config/env.ts`.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Backend API base URL. Defaults to `http://localhost:3000/api`. |
| `VITE_SENTRY_DSN` | No | GlitchTip/Sentry DSN. Error reporting is disabled when empty. |
| `VITE_SENTRY_RELEASE` | No | Release tag — set to the git SHA in CI to correlate errors with deploys. |

> **Note:** `VITE_SENTRY_DSN` ships in the client bundle and is public. Use a **separate** GlitchTip project from the backend, and set it only in the production environment.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server on port 5173 |
| `pnpm build` | Type-check (`tsc -b`) then build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Run ESLint |

## Project structure

```
app/
├── assets/         # Static assets
├── components/
│   ├── ui/         # shadcn/ui primitives
│   ├── auth/       # Auth-specific components
│   ├── custom-cakes/
│   ├── kanban/     # Drag-and-drop board
│   └── providers/  # Context providers
├── config/         # env.ts, firebase.ts
├── data/           # Static/reference data
├── hooks/          # Shared React hooks
├── i18n/           # config + locales/{en,ar}.json
├── layouts/        # Shell layouts (sidebar, navbar)
├── lib/
│   ├── api/        # Endpoint modules (auth, cake, chef, addOn, notification)
│   ├── services/   # Domain services layered over the API
│   ├── api-client.ts
│   └── instrument.ts
├── routes/         # Page components, grouped by area
├── schemas/        # Zod validation schemas
├── stores/         # Zustand stores
├── styles/
├── routes.tsx      # Route table
├── root.tsx        # App shell
└── main.tsx        # Entry point
```

`@` is aliased to `app/`, so imports look like `@/components/ui/button`.

## Routing

Routes are declared centrally in [app/routes.tsx](app/routes.tsx) and split into two trees:

- **`/auth/*`** — login, forgot password, OTP verify, reset password. Wrapped in `PublicRoute`, which redirects authenticated users away.
- **`/*`** — the app shell, wrapped in `ProtectedRoute`. Individual routes can require specific roles, e.g. settings is limited to `super_admin` and `admin`.

Every page is lazily loaded and gets its own error boundary. The boundary is attached to the **children** of `/` rather than to `/` itself, so a page crash is contained inside `<main>` and the user keeps the sidebar and navbar to navigate away with. `Suspense` sits inside the boundary, so a chunk that fails to download — a stale hash after a redeploy, say — surfaces the same way a render crash does, with the shell still usable.

## State management

Each domain gets its own Zustand store in `app/stores` — orders, bakeries, regions, drivers, coupons, offers, tags, and so on. Two cross-cutting helpers live alongside them:

- `invalidateAllOnLanguageChange` — refetches localized data when the UI language changes
- `invalidateStoresForTagUsage` — refreshes stores whose data depends on tags

`auth.store.ts` uses Zustand's `persist` middleware to survive reloads.

## API layer

[app/lib/api-client.ts](app/lib/api-client.ts) wraps Axios and handles the parts every request needs:

- Attaches auth credentials and the current language header
- Normalizes responses into `ApiResponse<T>` and errors into `ApiError`
- Refreshes expired tokens on a 401 and **queues** concurrent requests during the refresh, so a burst of parallel calls triggers one refresh instead of many. If the refresh fails, queued waiters are rejected rather than retried with credentials already known to be dead.
- `getApiErrorMessage(error, fallback)` extracts a human-readable message, preferring granular validation `details` over the generic `message`

Endpoint modules live in `app/lib/api/`, and `app/lib/services/` layers domain logic on top.

## Internationalization

English and Arabic, with catalogs in `app/i18n/locales/`. The selected language is sent to the backend on every request via the language header, so server-rendered messages come back in the right language too. Language preference is synced to the backend account by `language.service.ts`.

## Notifications

Firebase Cloud Messaging delivers push notifications for order events. `fcm.service.ts` handles token registration and is **dynamically imported** — Firebase is roughly 200 KB and the login screen has no use for it, so a static import would put it on the critical path of the one screen that doesn't need it.

The FCM project is **basty-notifications**. The service worker's Firebase SDK version must match the `firebase` npm package version, or registration fails silently.

## Build & performance

The Vite config makes several deliberate choices:

**Manual chunks.** Large, stable vendor libraries are split out of the entry chunk to keep them off the login path and give them long-lived cache entries: `firebase`, `sentry`, `date-fns`, `react-vendor`, and `vendor-heavy` (TanStack Table, react-day-picker, dnd-kit). Anything unmatched stays in the entry chunk on purpose — a long tail of tiny chunks costs more in requests than it saves in bytes.

`date-fns` is intentionally *not* grouped with the lazy vendors: the navbar's notifications dropdown formats timestamps with it, making it a static dependency of the app shell. Grouping it would drag the whole vendor group into the entry preload (measured at +196 KB on first paint).

**Console stripping.** Production builds drop all `console.*` and `debugger` statements, so the deployed app never dumps API errors or debug logs to the browser console. They're kept in dev.

**Hidden source maps.** `sourcemap: "hidden"` emits `.map` files for upload to GlitchTip without adding a `sourceMappingURL` comment to the shipped JS — production stack traces stay readable once maps are uploaded, but sources aren't exposed to users. Uploading requires a GlitchTip auth token and belongs in CI.

## Error handling & monitoring

- `RouteErrorBoundary` (`app/components/ErrorFallback`) catches render errors per route
- Sentry/GlitchTip is initialized in `app/lib/instrument.ts` before app code runs, and stays inert when `VITE_SENTRY_DSN` is unset
- User-facing failures surface as Sonner toasts with messages extracted by `getApiErrorMessage`

## Deployment

Deployed as a static SPA. `vercel.json` rewrites all paths to `/index.html` so client-side routing works on direct navigation and refresh.

```bash
pnpm build     # outputs to dist/
```

Set `VITE_API_BASE_URL`, and optionally `VITE_SENTRY_DSN` and `VITE_SENTRY_RELEASE`, in the hosting environment. Any host that serves a static directory with an SPA fallback will work.
