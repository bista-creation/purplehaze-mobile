# Purple Haze Mobile Application Rebuild — Development Progress

Last Updated: 2026-11-12

## 1. Project Overview
Production rebuild of the Purple Haze Restro & Garden mobile application for Android and iOS using Expo (React Native), TypeScript, TanStack Query, Zustand, and Supabase Realtime, backed by the existing Next.js 16 production backend (`https://purplehaze-nine.vercel.app`).

---

## 2. Completed Modules
- [x] **Backend & Schema Audit**: Mapped all 44 database models, relationships, and Paisa currency representations.
- [x] **API Inventory Complete**: Cataloged 35+ REST endpoints across Customer, Menu, Reservations, Events, Orders, Dispatch, and Staff.
- [x] **Design Tokens Extracted**: Extracted live brand palette (`#5b21b6` primary, `#f5b942` gold accent, `#130b1d` dark canvas, `#ffffff`/`#1e132c` cards) and typography from website CSS.
- [x] **Architecture Specification**: Authored comprehensive architectural blueprint and milestone plan.
- [x] **Phase 2: Project Core & TanStack Query Integration**:
  - Installed `@tanstack/react-query` via Expo SDK-compatible resolution.
  - Configured global `QueryClient` with optimized stale times, memory garbage collection, and retry backoffs.
  - Wrapped root navigator in `QueryClientProvider` in `src/app/_layout.tsx`.
  - Upgraded centralized typed `api-client.ts` covering Delivery Zones, Checkout, Payments, Reservations, Events, Orders, Notifications, and Staff operations.
  - Created reusable TanStack Query hooks in `src/hooks/use-queries.ts`.
  - Verified 100% clean TypeScript (`npx tsc --noEmit`) and Expo Lint (`npx expo lint`).

---

## 3. Pending Modules & Roadmap

| Module | Status | Dependencies | Target Milestone |
| :--- | :---: | :--- | :--- |
| **Customer Home Screen (Time-aware, Split)**| In Progress | Design System, API client | Phase 3 |
| **Dynamic Menu with Horizontal Cards** | In Progress | `/menu/categories`, `/menu/dishes` | Phase 3 |
| **Cart & Validated Checkout Flow** | Pending | `/checkout/calculate`, `/orders` | Phase 4 |
| **Table Reservations & Private Cabins** | Pending | `/reservations`, Venue schema | Phase 5 |
| **Event & Banquet Bookings** | Pending | `/event-bookings`, Package data | Phase 5 |
| **Live Order Tracking & Reorder** | Pending | `/orders/track`, Supabase Realtime | Phase 6 |
| **Restaurant Order Acceptance (Staff Portal)**| Pending | `/admin/orders`, Atomic lock | Phase 7 |
| **Push Notifications (FCM / Expo)** | Pending | Firebase Cloud Messaging, Tokens | Phase 8 |
| **EAS Android & iOS Production Builds** | Pending | Expo EAS configuration | Phase 9 |

---

## 4. API Integrations & Database Dependencies
- **Backend Host**: `https://purplehaze-nine.vercel.app/api/v1`
- **Database**: PostgreSQL (Neon / Supabase managed)
- **Monetary Unit**: Stored as integer **Paisa** in database; formatted as Rupee (`NPR = Paisa / 100`) on client.
- **Realtime**: Supabase WebSocket channels for order timeline and live GPS rider tracking.
- **Push Gateway**: Firebase Cloud Messaging (FCM) & Expo Notifications.

---

## 5. Known Issues & Architectural Constraints Resolved
- **100x Calculation Bug**: Eliminated by establishing single authoritative server calculation (`/checkout/calculate`) and explicit `Paisa ➔ NPR` conversion helpers.
- **Required Checkout Guidance**: Customer cannot submit order without full name and phone number; inline alerts guide customer instantly.
- **Safe Area Insets**: Modal dialogues and floating checkout bars respect iOS and Android system navigation margins.

---

## 6. Next Implementation Steps
1. Refactor design tokens in `src/theme/` to strictly match the website's royal purple and gold palette.
2. Initialize clean TanStack Query provider and enhance typed API client.
3. Build the customer-facing Home screen with dynamic time-aware greeting and two-card Garden/Cabin reservation split.
