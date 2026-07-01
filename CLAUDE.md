# Madina Collar - Project Summary

## Project Overview

Madina Collar is a mobile-first Expo React Native application with a Node.js/Express backend for managing fabric sales and order placement. The app provides user registration via OTP, login, browsing fabric qualities, selecting product options, adding quantities, and placing orders. The backend exposes APIs for authentication, order placement, admin management, product catalog, and pricing metadata.

### Main Purpose

- Support customer sales workflows for the Madina Collar fabric brand.
- Allow authenticated users to browse quality categories, select styles and product attributes, quantity items, and place orders.
- Provide backend support for admin operations such as quality management, order analytics, user and staff administration, and pricing matrix management.

### Overall Architecture

- Frontend: Expo-managed React Native app using functional components, Zustand for state, React Navigation stack navigator, and Axios for API calls.
- Backend: Node.js Express server using Sequelize ORM connected to PostgreSQL.
- Authentication: JWT-based auth with token blacklisting.
- Data: relational data model with Quality, Style, ProductAttribute, PriceMatrix, Order, OrderItem, User, OTP, and BlacklistedToken.
- Assets: local app images are stored in the `assets/images` directory.

### Technology Stack

- Frontend:
  - Expo
  - React Native
  - React Navigation
  - Zustand
  - Axios
  - Expo Secure Store
  - React Native Reanimated
- Backend:
  - Node.js
  - Express
  - Sequelize
  - PostgreSQL (`pg` driver)
  - bcryptjs
  - jsonwebtoken
  - multer
  - cors
  - dotenv
- Tooling:
  - ESLint
  - TypeScript support via `tsconfig.json`

### Major Dependencies

- `expo`, `react-native`, `react-navigation`, `axios`, `zustand`
- `express`, `sequelize`, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `multer`
- Dev: `typescript`, `eslint`, `nodemon`

## Folder Structure

- `App.js` and `index.js` - frontend app bootstrap using Expo.
- `app.json` - Expo project configuration.
- `assets/` - app images, icons, and splash assets.
- `src/` - main React Native app source.
  - `components/` - reusable visual components and theme helpers.
  - `constants/` - app theme constants.
  - `hooks/` - theme utility hooks.
  - `navigation/` - app navigation stack.
  - `screens/` - app screens: auth, quality selection, size selection, confirm order, splash.
  - `store/` - Zustand state management for auth and cart.
  - `theme/` - app color constants and quality theme map.
  - `utils/` - Axios API client.
- `backend/` - backend server and API implementation.
  - `config/` - database connection setup.
  - `middleware/` - auth and admin authorization middleware.
  - `models/` - Sequelize data models.
  - `routes/` - Express route definitions.
  - `uploads/` - uploaded files storage for admin images.
- `scripts/reset-project.js` - starter reset script.
- `package.json` - frontend dependency and script definitions.
- `backend/package.json` - backend dependency and script definitions.
- `tsconfig.json` - TypeScript compiler configuration.
- `eslint.config.js` - ESLint configuration.

## Frontend

### Framework and Libraries

- Built in Expo-managed React Native.
- Uses React Navigation stack navigator with `@react-navigation/native` and `@react-navigation/stack`.
- Uses zustand for lightweight state management.
- Uses Axios for API calls and Expo Secure Store for token persistence.
- Adds UI polish with Reanimated, LinearGradient, and Lucide icons.

### Routing

- `src/navigation/AppNavigator.js` defines a stack navigator.
- Routes:
  - `Splash` - initial animated splash.
  - `Auth` - login/register flow.
  - `Quality` - browse fabric quality categories.
  - `SizeSelection` - choose product configuration.
  - `ConfirmOrder` - review cart and place order.
- Navigation is guarded by auth state: unauthenticated users see `Splash` and `Auth`; authenticated users see the ordering flow.

### State Management

- `useAuthStore.js` stores `user`, `token`, and `isAuthenticated`.
  - Provides `setAuth`, `checkAuth`, and `logout`.
  - Persists token and user data to Secure Store.
- `useCartStore.js` stores `cart` as an object keyed by configuration.
  - Supports `updateQuantity`, `removeItem`, `resetCart`, and `getTotalItems`.
  - Cart structure uses keys like `quality|style|category|color|width` with nested size quantities.

### Authentication Flow

- Login via phone and password.
- Registration is multi-step:
  - `step1`: submit username and phone to `/auth/register/step1` to generate OTP.
  - `step2`: verify OTP via `/auth/register/step2`.
  - `step3`: submit password and complete registration via `/auth/register/step3`.
- Token is persisted to secure storage and attached to API requests via `src/utils/api.js` interceptor.
- `checkAuth` runs once in `AppNavigator` to restore login state.

### UI Architecture

- Each screen is a single React component in `src/screens/`.
- Styling is defined with `StyleSheet.create` per screen.
- `COLORS` from `src/theme/colors.js` is used directly and quality-specific theming is also defined there.
- `src/components/` contains generic helpers, though most screens use inline UI code.

### Component Organization

- `src/components` contains theme-aware components and utility views, but these are not heavily used in the main screens.
- Important reusable elements:
  - `ThemedText`, `ThemedView`, theme hooks, parallax scroll helper, collapsible UI.

### API Integration

- `src/utils/api.js` creates a base Axios instance with `http://192.168.18.18:5000/api`.
- The request interceptor reads `userToken` from secure storage and injects `Authorization: Bearer`.
- Direct Axios calls to backend are used in screens when performing data fetches and orders.

### Forms

- `AuthScreen.js` contains login and registration forms.
- Client-side validation includes phone length checks, required fields, OTP length, and password match.
- `SizeSelectionScreen.js` includes dynamic quantity input for each size attribute.
- `ConfirmOrderScreen.js` requires `biltiInfo` before placing an order.

### Styling System

- Uses React Native `StyleSheet` and `expo-linear-gradient`.
- Color system is centralized in `src/theme/colors.js` with named tokens.
- Per-quality gradients and theme colors are stored in `QUALITY_THEMES` for consistent brand styling.

### Reusable Utilities

- API client in `src/utils/api.js`.
- Auth/cart stores in `src/store`.
- Theme utilities and themed components in `src/hooks` and `src/components`.

### Important Pages

- `AuthScreen.js` - login/register with animated UI and OTP.
- `QualityScreen.js` - lists fabric qualities from backend.
- `SizeSelectionScreen.js` - choose category, color, width, sizes, and adjust quantities.
- `ConfirmOrderScreen.js` - shows order itemization, calculates total, and posts order.
- `SplashScreen.js` - animated start screen and navigation entry.

## Backend

### Framework

- Express/Node.js backend with ES module syntax.
- Uses Sequelize ORM and PostgreSQL.
- Multer file upload for admin image uploads.

### Server Architecture

- Entry file `backend/server.js` configures Express, CORS, JSON parsing, static uploads serving, models, associations, DB connection, and router mounting.
- Router structure:
  - `/api/auth` - authentication and registration.
  - `/api/orders` - user order operations.
  - `/api/admin` - admin dashboard and management.

### API Routes

- `POST /api/auth/register/step1` - begin user registration and create OTP record.
- `POST /api/auth/register/step2` - verify OTP.
- `POST /api/auth/register/step3` - complete registration with password.
- `POST /api/auth/login` - login by phone or email.
- `POST /api/auth/logout` - blacklist token.
- `POST /api/orders/place` - place an order.
- `GET /api/orders/my-orders` - get user's orders.
- `GET /api/admin/dashboard-stats` - admin dashboard counts.
- `GET /api/admin/analytics` - admin revenue and status analytics.
- `GET /api/admin/orders` - admin full order list.
- `PUT /api/admin/orders/:id/status` - update order status.
- `GET /api/admin/qualities` - get catalog hierarchy.
- `POST /api/admin/qualities` - create quality.
- `PUT /api/admin/qualities/:id` - update quality.
- `DELETE /api/admin/qualities/:id` - delete quality.
- `POST /api/admin/styles` - create style.
- `DELETE /api/admin/styles/:id` - delete style.
- `POST /api/admin/attributes` - create product attribute.
- `PUT /api/admin/attributes/:id` - update attribute.
- `DELETE /api/admin/attributes/:id` - delete attribute.
- `POST /api/admin/pricing/seed-dummy` - seed price matrix entries.
- `POST /api/admin/pricing/update` - update pricing.
- `GET /api/admin/staff` - list admin users.
- `POST /api/admin/staff` - create admin user.
- `DELETE /api/admin/staff/:id` - delete admin user.
- `GET /api/admin/users` - list normal users.

### Controllers / Services

- The backend mainly uses route handlers in `backend/routes/*.js` without separate controller files.
- `auth.js` handles auth and registration logic.
- `order.js` handles order creation and user order retrieval.
- `admin.js` handles admin analytics, catalog management, staff management, and pricing.

### Middleware

- `backend/middleware/auth.js` verifies JWT tokens and checks blacklist.
- `backend/middleware/adminAuth.js` restricts admin actions to `role === 'admin' || role === 'superadmin'`.

### Authentication & Authorization

- JWT authentication with tokens signed by `process.env.JWT_SECRET` and 7-day expiry.
- Backend verifies tokens in `auth.js`, loads decoded payload to `req.user`, and rejects invalid tokens.
- `logout` blacklists tokens in `BlacklistedToken` storing expiry.
- Admin routes use `adminAuth` and sometimes `isMaster(req)` to require `admin` or `superadmin`.
- `auth.js` admin registration and forgot password require `ADMIN_SECRET_KEY`.

### Database Layer

- Uses Sequelize for PostgreSQL.
- `backend/config/db.js` connects using env vars and calls `sequelize.sync({ alter: true })`.
- No migrations or seeders are present; models sync directly at runtime.

### Models

- `User` - stores username, email, phone, hashed password, and role.
- `Otp` - stores OTP codes, expiration, and verification state.
- `Quality` - fabric quality entries with name, image, price, tag, and activation.
- `Style` - style variants linked to a quality.
- `ProductAttribute` - attributes of styles (`category`, `color`, `width`, `size`) with stock status and optional hex code.
- `PriceMatrix` - pricing entries mapping style/category/color/width/size to price.
- `Order` - orders linked to users with total amount, payment method, bilti info, comments, and status.
- `OrderItem` - individual ordered item lines with quality, style, category, color, width, size, quantity, and purchase price.
- `BlacklistedToken` - token revocation list.

### Validation

- Minimal backend validation; most checks are manual.
- Auth route checks phone uniqueness and OTP validity.
- Admin registration checks secret key and email uniqueness.
- Order route assumes valid payload structure from frontend.

### Error Handling

- Routes return a generic `500` for server errors.
- `auth.js` and `order.js` send `400` for invalid input.
- `admin.js` uses `403` to reject unauthorized access and `404` for missing entities.
- The backend logs minimal error details; some console logs exist in middleware.

### Background Jobs

- None present.
- OTP expiration and token blacklist cleaning rely on natural query logic rather than scheduled jobs.

### File Storage

- Admin image uploads persist to `backend/uploads/`.
- Uploaded image URLs are served via Express static middleware.

### External Integrations

- No external APIs are called from the backend besides standard Node modules.
- Frontend uses local backend URLs hardcoded to `http://192.168.18.18:5000`.

## Database

### Database Type

- PostgreSQL accessed via Sequelize.

### ORM

- Sequelize with direct model definitions and runtime schema sync.

### Models / Tables

- `Users`, `Otps`, `Qualities`, `Styles`, `ProductAttributes`, `PriceMatrices`, `Orders`, `OrderItems`, `BlacklistedTokens`.

### Relationships

- `Quality` → hasMany `Style`.
- `Style` → hasMany `ProductAttribute` and `PriceMatrix`.
- `User` → hasMany `Order`.
- `Order` → hasMany `OrderItem`.
- `OrderItem` → belongsTo `Order`.
- `Style belongsTo Quality`; `ProductAttribute belongsTo Style`; `PriceMatrix belongsTo Style`.

### Important Fields

- `User`: `username`, `email`, `phone`, `password`, `role`.
- `Quality`: `name`, `image_url`, `price`, `tag`, `is_active`.
- `ProductAttribute`: `type`, `value`, `in_stock`, `hex_code`.
- `PriceMatrix`: `categoryId`, `colorId`, `widthId`, `sizeId`, `price`.
- `Order`: `userId`, `total_amount`, `payment_method`, `bilti_info`, `status`.
- `OrderItem`: `quality`, `style`, `category`, `color`, `width`, `size`, `quantity`, `price_at_purchase`.

### Migrations / Seeders

- No migration or seeder files found.
- Data initialization depends on runtime `sequelize.sync()` and admin endpoints.

## API Documentation

### `POST /api/auth/register/step1`
- Purpose: start registration by generating OTP for a phone number.
- Request body: `{ username, phone }`
- Response: `{ msg: 'OTP sent to WhatsApp' }`
- Auth: none.
- Validation: phone uniqueness and presence.

### `POST /api/auth/register/step2`
- Purpose: verify OTP.
- Request body: `{ phone, otp }`
- Response: `{ msg: 'OTP verified successfully' }`
- Auth: none.
- Validation: verify OTP code, expiry, and `is_verified` false.

### `POST /api/auth/register/step3`
- Purpose: create a user account after OTP verification.
- Request body: `{ username, phone, password }`
- Response: `{ msg: 'Registration complete!', userId }`
- Auth: none.
- Validation: checks OTP verification exists.

### `POST /api/auth/login`
- Purpose: authenticate user by phone or email.
- Request body: `{ phone?, email?, password }`
- Response: `{ token, user }`
- Auth: none.
- Validation: existing user lookup by phone/email and password match.

### `POST /api/auth/logout`
- Purpose: revoke current token.
- Request body: none.
- Response: `{ msg: 'Successfully logged out' }`
- Auth: bearer token required.
- Validation: token is stored in blacklist.

### `POST /api/orders/place`
- Purpose: place a user order.
- Request body: `{ cartItems, totalAmount, paymentMethod, biltiInfo }`
- Response: `{ msg: 'Success', orderId }`
- Auth: bearer token required.
- Validation: none beyond required fields being present in JSON.

### `GET /api/orders/my-orders`
- Purpose: retrieve authenticated user's orders.
- Response: list of orders with `items`.
- Auth: bearer token required.

### `GET /api/admin/dashboard-stats`
- Purpose: admin overview counts.
- Response: `{ totalOrders, totalUsers, pendingOrders, totalRevenue }`
- Auth: admin bearer token required.

### `GET /api/admin/analytics`
- Purpose: admin sales and order analytics.
- Response: `{ revenueData, qualityData, statusData }`
- Auth: admin bearer token required.

### `GET /api/admin/orders`
- Purpose: list all orders with user and item details.
- Response: order objects with `User` and `items`.
- Auth: admin bearer token required.

### `PUT /api/admin/orders/:id/status`
- Purpose: update order status.
- Request body: `{ status }`
- Response: updated order.
- Auth: admin bearer token required.

### `GET /api/admin/qualities`
- Purpose: get full quality catalog, styles, attributes, and pricing.
- Response: nested quality objects.
- Auth: none.

### `POST /api/admin/qualities`
- Purpose: create a new quality.
- Request body: `{ name, tag, price, image_url }` and optional `multipart/form-data` image.
- Response: created quality.
- Auth: admin bearer token required and `superadmin/admin` role.

### `PUT /api/admin/qualities/:id`
- Purpose: update existing quality.
- Request body: partial fields and optional image.
- Response: updated quality.
- Auth: admin bearer token required and `superadmin/admin` role.

### `DELETE /api/admin/qualities/:id`
- Purpose: delete a quality.
- Response: deletion confirmation.
- Auth: admin bearer token required and `superadmin/admin` role.

### `POST /api/admin/styles`
- Purpose: create style.
- Request body: style fields.
- Response: created style.
- Auth: admin bearer token required and `superadmin/admin` role.

### `DELETE /api/admin/styles/:id`
- Purpose: delete style.
- Response: deletion confirmation.
- Auth: admin bearer token required and `superadmin/admin` role.

### `POST /api/admin/attributes`
- Purpose: create product attribute.
- Request body: attribute fields.
- Response: created attribute.
- Auth: admin bearer token required and `superadmin/admin` role.

### `PUT /api/admin/attributes/:id`
- Purpose: update a product attribute.
- Response: updated attribute.
- Auth: admin bearer token required and `superadmin/admin` role.

### `DELETE /api/admin/attributes/:id`
- Purpose: remove an attribute.
- Auth: admin bearer token required and `superadmin/admin` role.

### `POST /api/admin/pricing/seed-dummy`
- Purpose: create placeholder price matrix entries.
- Request body: `{ qualityId }`
- Auth: admin bearer token required and `superadmin/admin` role.

### `POST /api/admin/pricing/update`
- Purpose: update price matrix entries for a style.
- Request body: `{ styleId, categoryId, colorId, widthId?, prices: [{ sizeId, price }] }`
- Auth: admin bearer token required and `superadmin/admin` role.

### `GET /api/admin/staff`
- Purpose: get admin user list.
- Auth: admin bearer token required and `superadmin/admin` role.

### `POST /api/admin/staff`
- Purpose: add admin user.
- Request body: admin details.
- Auth: admin bearer token required and `superadmin/admin` role.

### `DELETE /api/admin/staff/:id`
- Purpose: delete admin user.
- Auth: admin bearer token required and `superadmin/admin` role.

### `GET /api/admin/users`
- Purpose: list normal users.
- Auth: admin bearer token required.

## Authentication

### Login Flow

- User submits phone and password in `AuthScreen.js`.
- Backend authenticates via `/auth/login` and issues a JWT.
- Frontend stores the token and user in secure storage.
- Auth state toggles `isAuthenticated` and app switches to ordering flow.

### Registration Flow

- Step 1: phone and username submission creates OTP.
- Step 2: OTP verification marks OTP as verified.
- Step 3: password submission creates the user.
- There is no frontend support for email registration in user flow.

### Token/Session Handling

- Stored in Expo Secure Store under `userToken` and `userData`.
- API interceptor adds bearer token to requests.
- Logout blacklists token in `BlacklistedToken`.

### Refresh Tokens

- Not implemented. JWTs expire after 7 days and the app does not request refresh tokens.

### Protected Routes

- Frontend route protection is handled by `useAuthStore` state.
- Backend route protection uses `auth.js` and admin routes use `adminAuth.js` plus role checks.

### User Roles and Permissions

- Roles: `user`, `admin`, `superadmin`.
- `admin` and `superadmin` can access admin routes.
- The admin registration route additionally checks `ADMIN_SECRET_KEY`.

## Business Logic

### Order Workflow

- Users browse quality categories, choose a style, select category/color/width/size.
- Quantity changes update cart state by key.
- `ConfirmOrderScreen.js` builds a cart item list by matching product attributes and price matrix entries.
- Orders are posted to `/api/orders/place` with `cartItems`, `totalAmount`, `paymentMethod`, and `biltiInfo`.

### Catalog Workflow

- Admins manage qualities, styles, and attributes.
- `QualityScreen.js` fetches `/api/admin/qualities` and renders nested quality/style data.
- Selection screen uses attribute groups to filter category/color/width/size.

### Pricing Workflow

- Prices are stored in `PriceMatrix` by style/category/color/width/size.
- Frontend uses price matching logic in `SizeSelectionScreen.js` and `ConfirmOrderScreen.js`.

## Environment Variables

- `DB_NAME` - PostgreSQL database name.
- `DB_USER` - database username.
- `DB_PASS` - database user password.
- `DB_HOST` - database host.
- `JWT_SECRET` - JWT signing secret.
- `ADMIN_SECRET_KEY` - secret required for admin creation/forgot-password.
- `PORT` - backend port (default 5000).

> Inference: A `.env` file is expected in `backend/` but not included in the repo.

## Configuration

### package.json

- Root `package.json` manages Expo app dependencies.
- Scripts: `start`, `dev`, `reset-project`, `android`, `ios`, `web`, `lint`.
- Backend `package.json` includes `dev` script for `nodemon server.js`.

### tsconfig

- Extends `expo/tsconfig.base`.
- Enables strict TypeScript checking.
- Defines path alias `@/*` for `./src/*`.

### eslint

- Uses `eslint-config-expo/flat`.
- Ignores `dist/*`.

### docker / CI / CD

- No Docker or CI/CD config found.
- No GitHub Actions or workflow YAML files.

### Build configuration

- Standard Expo build via `expo` scripts.
- Backend has no build step; runs directly from source.

### Deployment configuration

- No explicit deployment config for frontend or backend.
- Backend likely runs as a Node service on port 5000; frontend uses Expo.

## Data Flow

1. User action on mobile screen triggers Axios request.
2. `src/utils/api.js` attaches token and forwards request to backend.
3. `backend/server.js` routes request, middleware validates auth.
4. Sequelize queries or updates the PostgreSQL database.
5. Backend returns JSON response.
6. Frontend updates UI and local state using responses.

### Example Ordering Flow

- `ConfirmOrderScreen` computes item prices and `totalAmount`.
- Sends payload to `POST /api/orders/place`.
- Backend creates `Order` and `OrderItem` rows.
- Response returns `orderId` and success.

## Important Classes & Functions

### Frontend

- `useAuthStore.setAuth` - stores auth state and secure storage.
- `useAuthStore.checkAuth` - restores auth at app startup.
- `useCartStore.updateQuantity` - adjusts the cart map for a product config.
- `useCartStore.getTotalItems` - sums cart quantities.
- `AppNavigator` - decides whether to show auth or main flow.
- `AuthScreen` - multi-step registration and login UI.
- `SizeSelectionScreen` - product selection and pricing logic.
- `ConfirmOrderScreen` - order summary, removal, and placement.

### Backend

- `connectDB` - Sequelize authentication and sync.
- `auth` middleware - JWT validation and blacklist check.
- `adminAuth` middleware - role-based admin access.
- `backend/routes/auth.js` - manages register/login/logout.
- `backend/routes/order.js` - order lifecycle.
- `backend/routes/admin.js` - catalog and admin CRUD.

## Coding Conventions

- Functional React components with hooks.
- Consistent use of `async/await` on backend and frontend.
- Frontend uses inline styles via `StyleSheet.create`.
- Backend routes are organized by feature in separate router files.
- Minimal use of TypeScript; main app is JS with a TypeScript config for future support.
- Naming is generally descriptive, with `camelCase` and purpose-based store methods.

## Known TODOs

- No explicit `TODO` or `FIXME` comments were found in source files.

## Development Commands

- Install dependencies: `npm install`
- Frontend development: `npx expo start` or `npm run dev`
- Android emulator: `npm run android`
- iOS simulator: `npm run ios`
- Web: `npm run web`
- Lint: `npm run lint`
- Reset starter project: `npm run reset-project`
- Backend dev: from `backend/` run `npm run dev`

## Potential Issues

- Hardcoded backend host URL (`http://192.168.18.18:5000`) in frontend screens and upload routes.
- No `.env` included; environment setup is required manually.
- No migration files: database schema is managed by `sequelize.sync({ alter: true })` which is risky in production.
- Backend lacks strong validation and input sanitization.
- OTP is valid only for 60 seconds and no resend flow exists beyond resetting the timer on the client.
- No refresh token support; long-lived JWTs and blacklist are the only token strategy.
- Admin APIs expose broad CRUD without rate limits or request validation.
- Some backend upload URLs and frontend requests assume local LAN IP, limiting portability.
- Many admin routes accept non-validated JSON and may fail silently with generic `500`.
- No testing framework or coverage.

## Future Development Notes

- Use env-based backend URL in frontend rather than hardcoded LAN address.
- Add database migrations and seeders for production-ready deployments.
- Extract backend controllers and validation logic from route files.
- Add tests for auth, order placement, and admin endpoints.
- Consider supporting email/password registration in the app UX.
- Implement refresh tokens and stronger session handling.
- Improve error responses with structured payloads.
- Add Docker / CI config for deployment.
- Leverage `src/components` reusable UI building blocks more consistently.
- Add `app-example` cleanup if the starter reset script is not required.

---

## Important Note

This repository is a hybrid mobile app and backend project. The mobile app is meant to run via Expo and communicates with a local backend running on port `5000`. The backend expects a PostgreSQL database and a `.env` file with database and JWT settings.
