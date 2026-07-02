# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Madina Collar is a fabric sales/ordering system with **three interfaces in this repo**, each in its own top-level folder, plus one external one:

1. **Mobile app** (`mobile/`) — Expo-managed React Native app. The original/primary client.
2. **Web app** (`web/`) — Next.js 14 (Pages Router) app that **deliberately re-implements the same ordering flow** (auth → catalog → product/size-selection → checkout → orders) as the mobile app, hitting the same backend API. Treat it as a parallel client, not a shared codebase — it duplicates logic rather than importing from `mobile/src/` (different framework, different storage APIs).
3. **Backend** (`backend/`) — Express + Sequelize (PostgreSQL) API shared by both frontends.
4. **Admin panel — NOT in this repository.** It is a separate project that consumes the same `backend` (`/api/admin/*` routes, `role: 'admin' | 'superadmin'`). When working here, remember admin-facing features are driven by another codebase you can't see; the backend's admin routes are the contract between the two.

Each of `mobile/`, `web/`, and `backend/` has its own `package.json`/`node_modules` and is developed independently — there is no shared root-level `package.json` or workspace tooling tying them together.

Because the mobile and web apps are independently-maintained copies of the same flow, **a business-logic or bug fix (e.g. price lookup, cart key format, order payload shape) usually needs to be applied twice** — once in `mobile/src/` (JS) and once in `web/src` (TS) — unless it's purely a backend fix.

## Development Commands

### Mobile app (`mobile/`)
```bash
cd mobile
npm install
npx expo start        # or: npm run dev
npm run android        # open in Android emulator
npm run ios            # open in iOS simulator
npm run web             # run the Expo app in a browser (NOT the Next.js web/ app)
npm run lint            # expo lint
```

### Backend (`backend/`)
```bash
cd backend
npm install
npm run dev             # nodemon server.js, default port 5000
```
Requires a `backend/.env` (see Environment Variables below) and a reachable PostgreSQL instance. There is no test script (`npm test` is a stub) and no seed/migration tooling — schema is created/altered at boot via `sequelize.sync({ alter: true })`.

### Web app (`web/`)
```bash
cd web
npm install
npm run dev             # next dev
npm run build
npm run start
npm run lint             # next lint
```
Optional `NEXT_PUBLIC_API_URL` env var overrides the default backend URL (`http://192.168.18.18:5000/api`).

## Architecture

### Backend (`backend/`)

- ES modules, single entry point `backend/server.js`: wires Express, CORS (currently `origin: '*'`, wide open), JSON body parsing, `/uploads` static file serving, Sequelize model associations, and the three routers.
- Routers, mounted flat with no controller layer — logic lives directly in `backend/routes/*.js`:
  - `auth.js` → `/api/auth` — registration (3-step OTP flow), login, logout, **and also admin account bootstrap** (`POST /api/auth/admin/register`, `POST /api/auth/admin/forgot-password`), both gated by `ADMIN_SECRET_KEY` rather than a JWT. This is easy to miss since it lives in the auth router, not `admin.js`.
  - `order.js` → `/api/orders` — place order, list own orders.
  - `admin.js` → `/api/admin` — dashboard stats/analytics, order management, full quality/style/attribute/price-matrix CRUD (`GET /api/admin/qualities` is the one **unauthenticated** admin route — both frontends call it directly to render the public catalog), staff and user management.
- `backend/middleware/auth.js` verifies the JWT and rejects blacklisted tokens (`BlacklistedToken` table, populated on logout — there's no scheduled cleanup, so it grows unbounded).
- `backend/middleware/adminAuth.js` only checks `role === 'admin' || 'superadmin'`. Several routes in `admin.js` *additionally* call a local `isMaster(req)` helper that checks the exact same condition — redundant but harmless.
- Data model (Sequelize, see `backend/models/`): `Quality → hasMany Style → hasMany ProductAttribute` and `→ hasMany PriceMatrix`; `User → hasMany Order → hasMany OrderItem`. `ProductAttribute.type` is an enum (`category|color|width|size`) — a single table drives all four selectable option groups per style. `PriceMatrix` rows key on `(styleId, categoryId, colorId, widthId, sizeId)` with `widthId` nullable (some styles have no width dimension).
- Image uploads (`multer`, `backend/uploads/`) are served back with a **hardcoded LAN URL** (`http://192.168.18.18:5000/uploads/...`) baked into the response in `admin.js` — this must match wherever the backend actually runs, and both frontends' image-URL builders assume this convention.
- No request validation library — most routes trust the request body shape (`req.body`) as-is.

### Mobile app (`mobile/`, Expo)

- `mobile/App.js`/`mobile/index.js` bootstrap → `AppNavigator.js` (React Navigation stack). It swaps the entire navigator stack based on `useAuthStore.isAuthenticated`: unauthenticated → `Splash`, `Auth`; authenticated → `Quality`, `SizeSelection`, `ConfirmOrder`. There's no shared shell/tab bar between the two states.
- State: Zustand stores in `mobile/src/store/`, no persistence middleware — `useAuthStore` manually reads/writes Expo `SecureStore` (`userToken`, `userData`) inside `setAuth`/`checkAuth`/`logout`; `useCartStore` is in-memory only (cart is lost on app restart).
- Cart model: `cart` is `{ [configKey]: { [sizeValue]: qty } }` where `configKey = "${qualityName}|${styleName}|${categoryValue}|${colorValue}[|${widthValue}]"` — width segment is only appended when the style has widths. `ConfirmOrderScreen.js` re-parses this key by splitting on `|` and re-matching against the fetched catalog to resolve price, so the key's field order and separator are load-bearing — do not change casually without checking web too.
- `mobile/src/utils/api.js` hardcodes the backend base URL (`http://192.168.18.18:5000/api`) — no env var indirection on mobile (unlike the web app's `NEXT_PUBLIC_API_URL`).
- `mobile/src/components`, `mobile/src/hooks`, `mobile/src/constants/theme.ts` are leftover Expo-router starter-template scaffolding (themed-text/view, parallax scroll, `use-color-scheme`) and are **not used** by the actual screens in `mobile/src/screens/` — the real app is built with React Navigation + inline `StyleSheet`, not Expo Router / file-based routing despite `expo-router` being a dependency and `app.json` enabling `typedRoutes`.

### Web app (`web/`, Next.js Pages Router)

- Pages under `web/src/pages/`: `index` (marketing/landing, redirects to `/catalog` if authenticated), `auth` (mirrors the mobile 3-step registration + login UI/logic), `catalog`, `product` (style/category/color/width/size picker — equivalent to mobile's `SizeSelectionScreen`), `checkout` (equivalent to `ConfirmOrderScreen`), `orders`.
- State: same Zustand pattern as mobile but adapted to the browser — `authStore.ts` reads/writes `window.localStorage` directly (not cookies, not SSR-safe by design — every store method guards on `typeof window !== "undefined"`); `cartStore.ts` additionally uses `zustand/persist` against `localStorage` under key `madina-collar-cart`, so **unlike the mobile app, the web cart survives a page reload**.
- `web/src/utils/api.ts` adds a response interceptor that force-logs-out and redirects to `/auth` on any `401`, plus a `getImageUrl()` helper that rewrites whatever host is embedded in a stored `image_url` to match the configured `API_URL`'s host — needed because the backend bakes in its own LAN IP (see above) which may differ from the web app's configured API host.
- Route guarding is a hook, `useRequireAuth()` (`web/src/hooks/useRequireAuth.ts`), called at the top of every protected page; it calls `checkAuth()` then client-side-redirects to `/auth` if unauthenticated. There is no middleware-based route protection (Next.js `middleware.ts` is not used).
- The exact same cart-key convention and price-matrix lookup logic (category+color+optional width+size → price) as mobile is reimplemented independently in `product.tsx`/`checkout.tsx` (see `getMatrixPrice`/`cartItemsList` in `checkout.tsx`) — when changing pricing or attribute logic, check both.
- `web/.next/` is a build artifact directory and should not be edited or treated as source.

## Environment Variables

`backend/.env` (present locally; note plain `.env` is *not* gitignored in this repo — only `.env*.local` is — so be careful not to commit it):
- `PORT` — backend port (default 5000).
- `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` — PostgreSQL connection.
- `JWT_SECRET` — JWT signing secret.
- `ADMIN_SECRET_KEY` — required by `/api/auth/admin/register` and `/api/auth/admin/forgot-password`.
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASS` — present in `.env` but not referenced anywhere in this repo's backend code; likely consumed by the separate admin-panel project or an out-of-repo seed step.

`web/.env*` (optional): `NEXT_PUBLIC_API_URL` overrides the default backend base URL.

Mobile app has no `.env` support — its API URL is hardcoded in `mobile/src/utils/api.js`.

## Cross-Cutting Gotchas

- **The LAN IP `192.168.18.18:5000` is hardcoded in three separate places**: mobile `mobile/src/utils/api.js`, backend `backend/routes/admin.js` (upload URL construction), and as the default fallback in `web/src/utils/api.ts`. Changing the backend's host requires updating all three (or setting `NEXT_PUBLIC_API_URL` for web only).
- The public catalog endpoint (`GET /api/admin/qualities`) is unauthenticated by design even though it lives under `/api/admin` — both consumer frontends rely on this to render the catalog before/without a role check.
- OTP codes expire after 60 seconds server-side (`Otp.expires_at`) with no resend endpoint — both frontends just reset a local countdown timer and let the user re-submit step 1.
- There are no automated tests in any of the three subprojects.
