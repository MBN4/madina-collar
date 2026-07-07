# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Madina Collar is a fabric sales/ordering system with **four interfaces in this repo**, each in its own top-level folder:

1. **Mobile app** (`mobile/`) — Expo-managed React Native app. The original/primary client.
2. **Web app** (`web/`) — Next.js 14 (Pages Router) app that **deliberately re-implements the same ordering flow** (auth → catalog → product/size-selection → checkout → orders) as the mobile app, hitting the same backend API. Treat it as a parallel client, not a shared codebase — it duplicates logic rather than importing from `mobile/src/` (different framework, different storage APIs).
3. **Admin panel** (`mc-admin-panel/`) — React 19 + Vite + Tailwind v4 SPA for staff/admins (`role: 'admin' | 'superadmin'`): dashboard analytics, order management, fabric quality/style/attribute/price-matrix CRUD, customer list, staff management. Hits the same backend's `/api/admin/*` and `/api/auth/*` routes. Independently maintained from `mobile/`/`web/` — its own React/Vite tooling, its own re-implementation of admin-facing screens.
4. **Backend** (`backend/`) — Express + Sequelize (PostgreSQL) API shared by all three frontends.

Each of `mobile/`, `web/`, `mc-admin-panel/`, and `backend/` has its own `package.json`/`node_modules` and is developed independently — there is no shared root-level `package.json` or workspace tooling tying them together.

Because the mobile and web apps are independently-maintained copies of the same flow, **a business-logic or bug fix (e.g. price lookup, cart key format, order payload shape) usually needs to be applied twice** — once in `mobile/src/` (JS) and once in `web/src` (TS) — unless it's purely a backend fix. `mc-admin-panel/` is a separate flow (admin/staff-facing, not the customer ordering flow) and does not duplicate mobile/web logic, but it does share the backend's `/api/admin/*` contract — a backend admin-route change (path, payload shape, response shape) must be checked against `mc-admin-panel/src/pages/*.jsx` too.

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

### Admin panel (`mc-admin-panel/`)
```bash
cd mc-admin-panel
npm install
npm run dev             # vite dev server, default port 5173
npm run build
npm run preview
npm run lint             # eslint .
```
No env vars — the backend base URL is hardcoded to `http://localhost:5000` throughout (see Cross-Cutting Gotchas). No proxy config in `vite.config.js`; relies on the backend's open CORS (`origin: '*'`). As a result this panel only works when pointed at a backend reachable at `localhost:5000` — i.e. typically run on the same machine as the backend, unlike mobile/web which target the LAN IP.

## Architecture

### Backend (`backend/`)

- ES modules, single entry point `backend/server.js`: wires Express, CORS (currently `origin: '*'`, wide open), JSON body parsing, `/uploads` static file serving, Sequelize model associations, and the three routers.
- Routers, mounted flat with no controller layer — logic lives directly in `backend/routes/*.js`:
  - `auth.js` → `/api/auth` — registration (3-step OTP flow), login, logout, **and also admin account bootstrap** (`POST /api/auth/admin/register`, `POST /api/auth/admin/forgot-password`), both gated by `ADMIN_SECRET_KEY` rather than a JWT. This is easy to miss since it lives in the auth router, not `admin.js`.
  - `order.js` → `/api/orders` — place order, list own orders.
  - `admin.js` → `/api/admin` — dashboard stats/analytics, order management, full quality/style/attribute/price-matrix CRUD (`GET /api/admin/qualities` is the one **unauthenticated** admin route — both frontends call it directly to render the public catalog), staff and user management (`GET`/`PUT`/`DELETE /users/:id`, `role: 'user'` only). Deleting a customer via `DELETE /users/:id` doesn't cascade-delete their orders — the `Orders.userId` FK is `ON DELETE SET NULL`, so their past orders survive as "orphaned" (no attached customer); the admin panel's `Orders.jsx` already renders that case as `Guest`, so this is safe, just worth knowing before assuming a delete removed all trace of a customer.
- `backend/middleware/auth.js` verifies the JWT and rejects blacklisted tokens (`BlacklistedToken` table, populated on logout — there's no scheduled cleanup, so it grows unbounded).
- `backend/middleware/adminAuth.js` only checks `role === 'admin' || 'superadmin'`. Several routes in `admin.js` *additionally* call a local `isMaster(req)` helper that checks the exact same condition — redundant but harmless.
- All `User`-returning admin responses (`login`, `POST /staff`, `PUT /users/:id`) explicitly allowlist fields rather than returning the raw Sequelize instance — `POST /staff` used to `res.json(staff)` the whole row, which leaked the bcrypt password hash over the wire; it's now field-limited like the rest. If you add a new endpoint that creates/updates a `User`, allowlist the response fields rather than returning the model instance directly — there's no serializer/`toJSON` override on the `User` model doing this for you.
- Data model (Sequelize, see `backend/models/`): `Quality → hasMany Style → hasMany ProductAttribute` and `→ hasMany PriceMatrix`; `User → hasMany Order → hasMany OrderItem`. `ProductAttribute.type` is an enum (`category|color|width|size`) — a single table drives all four selectable option groups per style. `PriceMatrix` rows key on `(styleId, categoryId, colorId, widthId, sizeId)` with `widthId` nullable (some styles have no width dimension).
- Image uploads (`multer`, `backend/uploads/`) are served back with a **hardcoded LAN URL** (`http://192.168.18.18:5000/uploads/...`) baked into the response in `admin.js` — this must match wherever the backend actually runs. Mobile and web's image-URL builders assume this convention (web rewrites the host to match its configured API URL; mobile doesn't); `mc-admin-panel/` doesn't rewrite it at all, so uploaded-image previews in the admin panel only render correctly when the panel is used from a machine that can resolve `192.168.18.18`.
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

### Admin panel (`mc-admin-panel/`, React 19 + Vite + Tailwind v4)

- Routing via `react-router-dom` v7 in `src/App.jsx`: public `/login`, `/register`, `/forgot-password`; everything else (`/dashboard`, `/orders`, `/qualities`, `/qualities/:id`, `/customers`, `/staff`) is wrapped in a local `ProtectedRoute` that just checks a truthy `token` in the Zustand store (no expiry/validity check) and renders inside `AdminLayout` (sidebar shell + `<Outlet/>`). Unknown paths (`*`) redirect to `/dashboard`, which itself bounces unauthenticated users to `/login`.
- State: single Zustand store `src/store/useAdminStore.js` holding `admin`, `token`, `theme`, persisted manually to three separate `localStorage` keys (`adminUser`, `adminToken`, `theme`) — no `zustand/persist` middleware, no cookies. `logout()` calls `POST /api/auth/logout` to blacklist the token, then clears storage/state regardless of the call's outcome.
- No shared axios instance/interceptor — every page imports `axios` directly and hardcodes `http://localhost:5000` per call-site (dozens of occurrences across `src/store/useAdminStore.js` and every file in `src/pages/`). 401 handling is inconsistent: only `QualityDetails.jsx` explicitly logs out + redirects on a 401; other pages don't.
- Auth pages (`AdminLogin.jsx`, `AdminRegister.jsx`, `AdminForgotPassword.jsx`) map 1:1 onto the admin-bootstrap routes already documented under `backend/routes/auth.js` (`POST /api/auth/login`, `POST /api/auth/admin/register`, `POST /api/auth/admin/forgot-password`, all `ADMIN_SECRET_KEY`-gated on the backend except plain login). `AdminLogin.jsx` additionally does a **client-side-only** role check (rejects non-`admin`/`superadmin` roles after the token is already returned by the server) — this is a UI gate, not a security boundary.
- Authorization is unified and role-based across the panel: `AdminLayout`, `Staff.jsx`, and `QualityDetails.jsx` all gate "master"-level UI (Staff nav item, Staff page access, full quality/pricing edit powers) on `admin?.role === 'admin' || admin?.role === 'superadmin'` — which matches the backend's own `isMaster(req)` check in `admin.js`. There used to be a second, inconsistent gate (`admin?.email === 'master@madina.com'`) on `AdminLayout`/`Staff.jsx`/`Dashboard.jsx` that made the UI hide "master" features from every admin except one hardcoded email, even though the backend has always granted every `role: admin` account full access — that's been removed so the UI now honestly reflects what any admin can already do via the API. This is still UI-only convenience gating, not a security boundary — the backend's `isMaster`/`adminAuth` middleware is the real enforcement point, and it's the same role-based check everywhere.
- Main pages and the backend routes they drive: `Dashboard.jsx` (`GET /dashboard-stats`, `GET /analytics`, Recharts visualizations), `Orders.jsx` (`GET /orders`, `PUT /orders/:id/status`, plus `react-to-print`-driven invoice printing via `InvoicePrint.jsx`), `Qualities.jsx` (list/create/update/delete fabric qualities, multipart image upload), `QualityDetails.jsx` (style/attribute CRUD and price-matrix editing — `POST /pricing/update` destroys+recreates `PriceMatrix` rows rather than upserting; `POST /pricing/seed-dummy` zero-fills missing combinations), `Customers.jsx` (list/edit/delete customers via `GET`/`PUT`/`DELETE /users/:id`), `Staff.jsx` (list/create/delete `role: 'admin'` accounts).
- Dashboard no longer has a "Nuke System" button — it called a `DELETE /api/admin/system/nuke` endpoint that never existed on the backend (dead/broken feature) and has been removed rather than implemented, since a real full-system-wipe endpoint is a high-blast-radius feature that shouldn't exist without a deliberate spec (backups, confirmation flow, audit log). If a "reset demo data" feature is wanted later, scope and name it deliberately rather than reviving this.
- `InvoicePrint.jsx` is a pure presentational `forwardRef` component (props only, no API calls) rendering an A4 invoice with hardcoded shop letterhead/address/return-policy text and a synthesized invoice number (`SL_${10000 + order.id}`), not a real invoice-numbering system.

## Environment Variables

`backend/.env` (present locally; note plain `.env` is *not* gitignored in this repo — only `.env*.local` is — so be careful not to commit it):
- `PORT` — backend port (default 5000).
- `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` — PostgreSQL connection.
- `JWT_SECRET` — JWT signing secret.
- `ADMIN_SECRET_KEY` — required by `/api/auth/admin/register` and `/api/auth/admin/forgot-password`.
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASS` — present in `.env` but not referenced anywhere in this repo's backend code; likely consumed by the separate admin-panel project or an out-of-repo seed step.

`web/.env*` (optional): `NEXT_PUBLIC_API_URL` overrides the default backend base URL.

Mobile app has no `.env` support — its API URL is hardcoded in `mobile/src/utils/api.js`.

`mc-admin-panel/` has no `.env` support either, and no `import.meta.env` usage anywhere — its API base URL (`http://localhost:5000`) is hardcoded per call-site across every page and the store (see Architecture above). If you add configurability here, introduce a `VITE_API_URL` + a shared axios instance rather than editing each hardcoded literal individually.

## Cross-Cutting Gotchas

- **Three frontends, three different hardcoded backend hosts**: mobile (`mobile/src/utils/api.js`) and the backend's own upload-URL construction (`backend/routes/admin.js`) both hardcode the LAN IP `http://192.168.18.18:5000`; web (`web/src/utils/api.ts`) defaults to that same LAN IP but can be overridden via `NEXT_PUBLIC_API_URL`; `mc-admin-panel/` instead hardcodes `http://localhost:5000` everywhere, with no override mechanism at all. This means the admin panel and the mobile/web apps generally can't be pointed at the backend the same way — the admin panel assumes same-machine/localhost, the others assume the LAN IP. Changing where the backend runs requires touching all of: mobile, backend's admin.js, web's fallback (or its env var), and every hardcoded call site in `mc-admin-panel/`.
- The public catalog endpoint (`GET /api/admin/qualities`) is unauthenticated by design even though it lives under `/api/admin` — both consumer frontends (mobile/web) rely on this to render the catalog before/without a role check; `mc-admin-panel/`'s `Qualities.jsx` also calls it without an auth header for its list view, while `QualityDetails.jsx` calls the same endpoint *with* an auth header purely to get 401 handling on token expiry (there's no `GET /qualities/:id`, so it re-fetches the full list and filters client-side by id).
- OTP codes expire after 60 seconds server-side (`Otp.expires_at`) with no resend endpoint — both frontends just reset a local countdown timer and let the user re-submit step 1. Not applicable to `mc-admin-panel/`, which has no OTP flow (admin registration is a single `adminSecret`-gated form).
- There are no automated tests in any of the four subprojects. This repo has been manually end-to-end tested at least once (auth flows for all three frontends' backend contracts, full admin CRUD, order placement → admin view → status update → customer re-fetch, image upload) via direct API calls against a real local Postgres instance — see git history around the `fix/admin-panel-bugs` branch for what was verified and what was found broken at that point in time. Re-verify manually before trusting this note long-term; it decays as the code changes.
