# Purple Haze Restro & Garden - Mobile App

The official cross-platform React Native / Expo application for **Purple Haze Restro & Garden, Biratnagar**, connecting seamlessly to the unified Next.js backend deployed at [https://purplehaze-nine.vercel.app/](https://purplehaze-nine.vercel.app/).

---

## 📱 Features

- **Digital Menu & Filters:**
  - Dynamic categories, instant search, and Veg/Non-Veg filter toggles.
  - Multi-variant selector (e.g., Half / Full, Steamed / Fried / Jhol / C-Mo:Mo).
  - Add-ons (e.g., Extra Achar, Extra Cheese) and special cooking instructions.
  - **Live Availability Sync:** Realtime broadcast from Supabase reflects dishes sold out or restocked instantly without app restart.

- **Cart & Bill Summary:**
  - Client-side cart persistence using Zustand.
  - Live server-side re-calculation with coupon validation (`/api/v1/checkout/calculate`).

- **Secure Checkout & Idempotency:**
  - Home delivery vs. Takeaway / Pickup selector.
  - Client-generated UUIDv4 `idempotency-key` to prevent double charges on slow networks.
  - Multiple payment options:
    - **Cash on Delivery (COD)**
    - **eSewa** (in-app browser authentication session + server-side status verification)
    - **Khalti** (in-app browser authentication session + server-side lookup)

- **Realtime Order Tracking:**
  - Live progress timeline: `Placed` ➔ `Confirmed` ➔ `Cooking in Kitchen` ➔ `Packed & Ready` ➔ `Out for Delivery` ➔ `Delivered`.
  - Supabase Realtime channel subscription with automatic 5-second polling fallback.
  - 1-tap call & WhatsApp support buttons.
  - Guest order lookup with Order Number and Phone Number.

- **Authentication & Profiles:**
  - Dual JWT token storage in `expo-secure-store` (15-min access token + rotating refresh token family).
  - Automatic 401 token refresh queue and retry interceptor in `api.ts`.
  - Saved delivery addresses and favorite dishes.

- **Push Notifications:**
  - Automated Expo Push token registration (`/api/v1/notifications/push-token`).
  - Native alerts when order status changes or when kitchen accepts an order.

---

## 🛠️ Tech Stack

- **Framework:** [Expo SDK 58](https://expo.dev/) with React Native 0.88 & React 19
- **Language:** TypeScript
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Navigation:** [React Navigation 7](https://reactnavigation.org/) (Bottom Tabs + Native Stack)
- **Real-Time Engine:** [@supabase/supabase-js](https://supabase.com/docs/guides/realtime) Broadcast
- **Security:** `expo-secure-store` for cryptographic token storage
- **Payments & Web Browser:** `expo-web-browser` with deep link return scheme `purplehaze://`
- **Push Notifications:** `expo-notifications`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Expo Go on iOS or Android, or an active simulator/emulator

### Installation
```bash
# Clone the repository
git clone https://github.com/bista-creation/purplehaze-mobile.git
cd purplehaze-mobile

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## 🔗 Deep Linking & Payment Returns

The application registers the URL scheme `purplehaze://` in `app.json`.

Supported routes:
- `purplehaze://orders/:orderId` — Directly opens live order tracker.
- `purplehaze://payment-result?orderId=...&status=PAID` — Returns from eSewa/Khalti payment gateway and triggers authoritative server verification.
