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
  - Integrated `@tanstack/react-query` with optimized stale times and memory garbage collection.
  - Wrapped root navigator in `QueryClientProvider`.
  - Built comprehensive typed `api-client.ts` and `use-queries.ts` hooks library.
- [x] **Phase 3: Customer Home Screen & Dynamic Menu**:
  - Implemented single sticky top header with official round logo, location badge (`Airport Road, Biratnagar`), language toggle, theme toggle, and cart badge.
  - Implemented time-aware dynamic greeting banner:
    - 5:00 PM – 11:00 PM: *"Evenings in the Garden 🌿 — Charcoal grills are live."*
    - 11:00 AM – 4:00 PM: *"Sunny Courtyard Lunch ☀️ — Fresh platters & Newari Khaja."*
    - Default: *"Garden Oasis & Private Cabins 🌿 — Authentic dining on Airport Road."*
  - Replaced all "Rooftop" references with dedicated "Private Cabins & Indoor Dining".
  - Created two-card action split:
    - **Card A**: Garden Table & Private Cabin Booking (ambient green garden tables or air-conditioned secluded private cabins).
    - **Card B**: Kitchen Takeaway & Express Delivery with live badge *"⚡ Ready in 25–35 mins"*.
  - Pinned horizontal category filter chips (`Chef's Recommendations, Nepali, Continental, Asian, Indian`).
  - Refined compact horizontal menu cards (`MenuCardHorizontal`) with 96x96px rounded thumbnails, food safety standard icons (green dot in square for veg, red in square for non-veg), sensory copywriting, and instant inline quantity steppers (`[- 1 +]`).
  - Positioned persistent floating cart bar above bottom navigation dock (`bottom: 74px` / `10px` above tabs) with subtotal and *"View Tray / Checkout →"* trigger.
  - Verified 100% clean TypeScript and Expo Lint.

---

## 3. Pending Modules & Roadmap

| Module | Status | Dependencies | Target Milestone |
| :--- | :---: | :--- | :--- |
| **Cart & Validated Checkout Flow** | In Progress | `/checkout/calculate`, `/orders` | Phase 4 |
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
