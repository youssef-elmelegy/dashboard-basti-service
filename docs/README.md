# Documentation — Basty Admin Dashboard

This folder holds the long-form documentation for the admin dashboard. The [root README](../README.md) is the short version: what the dashboard is, how to run it, and where things live. Come here when you need the detail behind that.

## What's in here

| File | What it covers | Read it when |
| --- | --- | --- |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | The complete guide — setup, environment variables, architecture, the full route table and access control, state and caching, the API client, i18n and RTL, push notifications, UI conventions, build and chunking, deployment, monitoring, troubleshooting | You're setting the project up, adding a page or data domain, deploying, or something is broken |

## Where to start

**New to the project?** Read the [root README](../README.md) first, then the guide's [Architecture](DEVELOPER_GUIDE.md#architecture) section — the page → store → service → `apiClient` layering is the single most useful thing to internalise, since it's the shape every feature follows.

**Setting up locally?** [Getting started](DEVELOPER_GUIDE.md#getting-started) and [Environment variables](DEVELOPER_GUIDE.md#environment-variables). There's no committed `.env.local` example; the guide shows the minimal file. Remember the backend's `CORS_ORIGINS` must list your dev origin, since requests carry cookies.

**Adding a page or a data domain?** [Common tasks](DEVELOPER_GUIDE.md#common-tasks) has both checklists. The easily-missed step is registering a new store in `invalidateAllOnLanguageChange.ts` — skip it and the page silently serves stale-language data after a language switch.

**Deploying?** [Deployment](DEVELOPER_GUIDE.md#deployment). Unlike the backend, this repo has **no CI workflow** — deploys are a manual build and upload to the server, and the guide documents the exact commands and the Caddy config that serves the result.

**Touching notifications or the build config?** [Push notifications](DEVELOPER_GUIDE.md#push-notifications) and [Build & performance](DEVELOPER_GUIDE.md#build--performance). Both encode decisions that are easy to undo by accident — the service worker's Firebase SDK version must match the npm package, and `date-fns` is deliberately excluded from the lazy vendor chunk (regrouping it measured +196 KB on first paint).

**Something's broken?** [Troubleshooting](DEVELOPER_GUIDE.md#troubleshooting) covers blank pages, auth redirect loops, stale-language data, push failures, and stale chunks after a redeploy.

## Related documentation

- **Backend** — [documentation](../../backend-basti-service/docs/) for the API this dashboard consumes.
- **API reference** — `https://api.basty.ly/api/docs` (Scalar, behind HTTP Basic Auth), or `http://localhost:3000/api/docs` when running the backend locally.

## Keeping these current

Update the guide in the same change that alters the behavior it describes:

- Adding a route → update the route table and, if it's role-restricted, the access-control notes.
- Adding a store or service → update [State management](DEVELOPER_GUIDE.md#state-management), and confirm the language-invalidation registration is mentioned.
- Changing `vite.config.ts` chunking → update the chunk table in [Build & performance](DEVELOPER_GUIDE.md#build--performance), including the reasoning, not just the names.
- Changing the deploy process, or adding CI → replace the manual procedure in [Deployment](DEVELOPER_GUIDE.md#deployment).
- Adding a `VITE_` variable → add it to `app/config/env.ts` and the env table. Everything prefixed `VITE_` ships in the client bundle and is public — never put a secret there.
