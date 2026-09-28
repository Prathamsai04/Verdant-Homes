---
title: Verdant House
description: Local development and deployment guide for the Verdant House reservation platform
---

## Overview

An original, production-oriented paying-guest reservation enquiry platform. The public Vite SPA presents rooms, indicative availability, house content, meals, gallery, FAQs, contact options, and a three-step enquiry. The Express API and Prisma/PostgreSQL backend provide secure administrator sessions, content management, and transactional reservation inventory.

## Documentation

- [Complete application and architecture guide](docs/APPLICATION_GUIDE.md)
- [Beginner developer and language concepts guide](docs/BEGINNER_DEVELOPER_GUIDE.md)
- [Product principles](PRODUCT.md)
- [Design system](DESIGN.md)

## Stack

- **Web:** React 19, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS pipeline, Framer Motion, Lucide
- **API:** Express 5, Prisma, PostgreSQL, Zod, Pino, Helmet, CORS, rate limiting
- **Security:** bcrypt password hashes; opaque, hashed server-side sessions in PostgreSQL; HTTP-only `SameSite=Strict` cookies; CSRF token checks; login and enquiry throttles; body limits; request IDs
- **Quality:** ESLint, Prettier, Vitest, Testing Library, Supertest

## Local setup

Requirements: Node.js 22+, npm 10+, and Docker Desktop (or PostgreSQL 15+).

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:4000`; health endpoints are `/health` and `/ready`.

The seed requires `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 14 characters. It rejects missing and placeholder credentials. Re-running the seed updates the administrator, property, and demo content.

## Full Docker stack

Build and run PostgreSQL, the API, database setup, and the web application:

```powershell
Copy-Item .env.example .env
# Set ADMIN_PASSWORD in .env to a unique value with at least 14 characters.
docker compose up --build -d
```

Open `http://localhost:5173`. Nginx serves the React application and proxies
browser API requests to the API container. The API remains available directly
at `http://localhost:4000` for health checks and local integrations.

The one-shot `setup` service applies committed migrations and seeds only an
unconfigured database before the API starts. Existing administrator and
property data is preserved across routine restarts. Compose uses local
development defaults when `SESSION_SECRET`, `ADMIN_EMAIL`, or `ADMIN_PASSWORD`
are unset. Override all three before using this configuration outside a local
workstation. Run `npm run db:seed` only when you intend to restore demo content.

Stop the stack without deleting PostgreSQL data:

```powershell
docker compose down
```

Add `--volumes` only when you intend to delete the local database.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URI |
| `PORT` | API port, default `4000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `WEB_ORIGIN` | Comma-separated browser origins allowed by CORS |
| `SESSION_SECRET` | Minimum 32-character deployment secret |
| `TRUST_PROXY_HOPS` | Number of trusted reverse-proxy hops; keep `0` for direct local access |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial seed administrator |
| `VITE_API_URL` | Browser API root, e.g. `https://api.example.com/api/v1` |
| `VITE_USE_DEMO_DATA` | Explicitly opt into local public demo data when the API is unavailable |

Only `VITE_` values are exposed to the browser. Never commit `.env`.

## Commands

```text
npm run dev             shared build, API and web watchers
npm run build           production builds for all workspaces
npm run typecheck       strict TypeScript checks
npm test                all Vitest suites
npm run lint            all ESLint checks
npm run db:migrate      create/apply a development migration
npm run db:deploy -w @verdant/api   apply committed migrations in production
npm run db:seed          idempotent demo seed
```

## Architecture and behavior

`packages/shared` owns Zod inputs, lifecycle enums, and DTO types. `apps/api` never returns password or session models. `apps/web` uses an in-memory CSRF token restored by `/admin/auth/me`; the authentication cookie is inaccessible to JavaScript.

Public availability is informative. Submitting an enquiry creates a `NEW` reservation but does not consume a room. An administrator may progress it through `CONTACTED`, `CONFIRMED`, `WAITLISTED`, `CANCELLED`, or `CLOSED`. Confirmation runs in a serializable transaction and atomically decrements availability only when a unit remains. Moving a confirmed enquiry away from `CONFIRMED` returns the unit.

The public site surfaces API failures by default so it never presents stale demo inventory as live. Set `VITE_USE_DEMO_DATA=true` only for an intentional offline showcase; form submissions never fake success and still require the API.

### API routes

- `GET /api/v1/public/site`, `GET /api/v1/public/rooms`
- `POST /api/v1/public/reservations`, `POST /api/v1/public/contact`
- `POST /api/v1/admin/auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/reservations`, `PATCH /reservations/:id/status`
- `GET /api/v1/admin/messages`, `PATCH /messages/:id`
- Admin room, property, and content list/create/update/archive routes

## Deployment notes

Build shared, API, then web (`npm run build`). Serve `apps/web/dist` from a CDN/static host with SPA fallback to `index.html`; run `apps/api/dist/index.js` behind TLS and a trusted reverse proxy. Use managed PostgreSQL, a long random session secret, exact `WEB_ORIGIN` values, database backups, and `prisma migrate deploy` during release. Configure `TRUST_PROXY_HOPS` to match the actual reverse-proxy topology; do not enable it speculatively. The cookie is `Secure` in production. Multi-instance deployments should replace the in-process rate-limit store with a shared store such as Redis.

Remote gallery images are validated URL references. For a real property, move uploads to object storage/CDN and add an image processing/moderation adapter. Payment, resident accounts, outbound email/SMS, and real-time chat are deliberately outside this first release.

## Accessibility

The interface targets WCAG 2.2 AA with semantic landmarks, keyboard-complete native dialogs/details, visible focus, minimum 44px actions, descriptive image text, field-level errors, contrast-conscious OKLCH tokens, and reduced-motion overrides.
