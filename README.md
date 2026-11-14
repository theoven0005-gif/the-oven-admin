# The Oven — Admin Panel (v2)

Professional restaurant operations console for **The Oven**, built with React 19 + Vite + TypeScript + Firebase. Connects to the same Firebase project as the customer Android app: the panel manages orders, payments, menu, categories, banners, feedback and settings — all live from Firestore.

## Features

- **Dashboard** — today's orders, revenue, average order value, 7-day top items, live order-status funnel
- **Orders** — realtime queue, full delivery/pickup/dine-in workflows (pending → confirmed → preparing → ready → out for delivery / delivered / picked up / served → completed / cancelled), editable order notes, timeline
- **Payments** — online-payment screenshot verification queue (approve/reject inline), COD cash-due tracking, full payment history
- **Customers** — search, orders per customer, total spent, last order
- **Menu** — full CRUD on `menuItems` (name, description, price, category, photo upload to Storage, available + featured toggles, size variants for pizzas), one-click **"Seed real menu"** (90 real items + categories, skips if already seeded), and a **Flyer view** tab with the original menu flyers
- **Categories** — full CRUD on `categories` (used by the menu category picker)
- **Banners** — full CRUD on `banners` (promo images with show/hide, sort order)
- **Feedback** — ratings with delete
- **Notifications** — audit log with clear-old (>30 days), clear-all and per-item delete
- **Settings** — persisted to `settings/restaurant` (name, phone, address, delivery fee, minimum order, opening hours, payment instructions, announcement)
- **Auth** — Firebase email/password login with admin role check via `admins/{uid}`
- **Cloud Functions** — FCM push to admins on new orders + customer notifications on every status/payment change

## 1. Install

Install Node.js LTS. In this folder:

```bash
npm install
cd functions
npm install
cd ..
```

## 2. Firebase setup

Use the **same Firebase project as your customer Android app**.

1. Firebase Console → Build → **Authentication** → enable **Email/Password**.
2. Create the admin account (Authentication → Users → Add user), then create a Firestore document:
   - Collection: `admins`, Document ID: the new user's UID, any field e.g. `{"role":"admin"}`.
3. Enable **Firestore Database**, **Storage**, and **Cloud Messaging**.
4. Web app config: Project settings → Your apps → Web app (create if needed) → copy the config.
5. Copy `.env.example` to `.env` and paste the values:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase Console → Project settings → Your apps → Web app |
| `VITE_FIREBASE_VAPID_KEY` | Project settings → Cloud Messaging → Web Push certificates |

6. Put the same web config into `public/firebase-messaging-sw.js` (replace the `YOUR_*` placeholders).
7. Deploy Firestore + Storage rules:

```bash
firebase deploy --only firestore,storage
```

## 3. Expected Firestore structure

### Seeding the real menu (one click)

The panel ships with the real The Oven menu in `src/lib/menuSeed.ts` (90 items: pizzas with S/M/L pricing, burgers, wraps, sides, shawarma, wings, drinks, extra toppings, and all 22 deals — prices in PKR).

1. Open the **Menu** page in the admin panel.
2. Click **"Seed real menu"**.
3. It writes all items to `menuItems` plus the 9 categories to `categories` — and **skips automatically if the menu is already seeded**, so you can't create duplicates.

The Menu page also has a **Flyer view** tab showing the original restaurant flyers (`public/menu/*.jpg`).

`settings/restaurant` — written by the Settings page:

```json
{
  "name": "The Oven",
  "phone": "+923001234567",
  "address": "Main Street, Islamabad",
  "deliveryFee": 150,
  "minOrder": 500,
  "openingTime": "11:00",
  "closingTime": "23:00",
  "accountTitle": "The Oven Restaurant",
  "accountNumber": "PK36...",
  "paymentNote": "Please enter your Order ID in the transfer reference.",
  "announcements": ""
}
```

`menuItems/{id}`:

```json
{
  "name": "Special Fajita",
  "description": "…",
  "price": 1150,
  "category": "Pizza",
  "imageUrl": "https://…",
  "imagePath": "menu/…",
  "sizes": [{ "label": "S", "price": 650 }, { "label": "M", "price": 950 }, { "label": "L", "price": 1150 }],
  "available": true,
  "featured": true
}
```

`categories/{id}`: `{ "name": "Burgers", "description": "…", "sortOrder": 1, "active": true }`

`banners/{id}`: `{ "title": "Weekend Deal", "subtitle": "…", "imageUrl": "https://…", "imagePath": "banners/…", "sortOrder": 0, "active": true }`

`orders/{id}` (as written by the customer app):

```json
{
  "customerId": "uid",
  "customerName": "Customer Name",
  "phone": "+923001234567",
  "type": "delivery",
  "status": "pending",
  "paymentMethod": "online",
  "paymentStatus": "pending_verification",
  "paymentBank": "Meezan Bank",
  "paymentScreenshotUrl": "https://…",
  "address": "Customer delivery address",
  "items": [{ "name": "Special Fajita", "quantity": 1, "price": 1150, "size": "Large" }],
  "subtotal": 1150,
  "deliveryFee": 150,
  "total": 1300,
  "notes": "internal staff notes",
  "createdAt": "server timestamp"
}
```

For COD use `"paymentMethod": "cod"` and `"paymentStatus": "cash_due"`.

## 4. Customer app integration notes

- The Android app must save the customer's FCM token into `users/{uid}.fcmToken` after login/token refresh — Cloud Functions use it for status notifications.
- The app should read `menuItems` (filter `available == true`), `categories` (filter `active == true`, order by `sortOrder`), `banners` (filter `active == true`, order by `sortOrder`), and `settings/restaurant` for fees/hours/payment instructions.
- Recommended customer messages are in the old panel's README and in `functions/src/index.ts`.

## 5. Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 6. Deploy

Build the panel:

```bash
npm run build
```

Deploy functions:

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

Deploy the web panel:

```bash
firebase deploy --only hosting
```

(Cloud Functions typically requires the Blaze plan.)

## Security

- Never put Admin SDK credentials or service-account JSON in the frontend.
- Only Firebase Auth UIDs listed in `admins/{uid}` can write anything; sign-in alone grants no access.
- Login shows a clear **"Access denied"** screen for non-admin accounts.
- Storage uploads are limited to images under 5 MB, writable only by admins.

## 7. GitHub Pages deploy (automatic)

Every push to `main` deploys the panel to GitHub Pages via `.github/workflows/deploy.yml`
(also runnable manually from the Actions tab → "Deploy admin panel to GitHub Pages").

How it works:

1. `npm ci` installs dependencies, then `npm run build` builds the site.
2. The build runs with `VITE_BASE_PATH=/<repo-name>/`, so all assets load correctly
   under the GitHub Pages project path (e.g. `https://<user>.github.io/<repo>/`).
3. `dist/index.html` is copied to `dist/404.html` so BrowserRouter routes still work
   when a page is refreshed or a deep link is opened directly.
4. The `dist` folder is published with GitHub Pages.

Before the first deploy, enable Pages in the repo: **Settings → Pages → Build and deployment
→ Source: GitHub Actions**. Then set these 7 repository secrets
(**Settings → Secrets and variables → Actions → New repository secret**) — names only,
no values are stored in this repo:

| Secret | Value source |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |
| `VITE_FIREBASE_VAPID_KEY` | Project settings → Cloud Messaging → Web Push certificates |

The build reads them from GitHub Secrets only — `.env` is git-ignored and no secret
values are committed to this repository.

## 8. Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Firebase config comes from
your local `.env` file (see section 2 above). To preview the production build locally:

```bash
npm run build
npm run preview
```
