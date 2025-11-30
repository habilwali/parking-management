## Parking Management Starter

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- MongoDB API route with role-based access control

## Environment

Create a `.env.local` file with:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/parking"
```

## Available scripts

```bash
npm run dev     # start local dev server
npm run build   # build for production
npm run lint    # run ESLint
npm run seed:users  # hash + seed demo users into MongoDB
```

> The seeder loads `.env.local`, connects via `src/lib/mongodb.ts`, wipes any matching emails, hashes the passwords with bcrypt, and inserts the accounts defined in `src/lib/demo-users.ts`.

## Role-based demo

1. Visit `/login` and use one of the demo accounts:
   - `admin@parking.dev` / `admin123` → role `admin`
   - `super@parking.dev` / `super123` → role `super-admin`
2. Middleware enforces:
   - `/` requires `admin` or `super-admin`
   - `/dashboard` requires `super-admin`
3. Unauthenticated users are redirected to `/login?from=<path>`.
4. Unauthorized traffic is redirected to `/unauthorized`.
5. `/logout` clears the current session cookie.
6. Passwords are stored hashed via `bcryptjs`; modify `scripts/seed-users.ts` or add your own user creation flow to manage real accounts.

## MongoDB API

`GET /api/parking` connects to MongoDB and returns the first 10 documents from the `parking_spaces` collection. Seed that collection in your database to see real data flow through the UI.

`POST /api/vehicles` stores parking registrations submitted from the home page form. Each record includes creator info plus an auto-calculated expiration date based on the selected plan (monthly = +1 month, weekly = +7 days, 2 week = +14 days).

`POST /api/vehicles/[id]/renew` (triggered from the dashboard) renews expired vehicles by starting from the previously expired date, ensuring billing cycles chain correctly.

## Progressive Web App (PWA)

The app is configured as a PWA and can be installed on all devices:

### Features
- **Installable**: Install the app on iOS, Android, Windows, macOS, and Linux
- **Offline Support**: Service worker caches pages for offline access
- **App Icons**: Parking-themed icons in multiple sizes (72x72 to 512x512)
- **Manifest**: Complete PWA manifest with app name "Parking"
- **Install Prompt**: Automatic install prompt appears after 3 seconds

### Generating Icons
Icons are generated from an SVG file. To regenerate icons:

```bash
node scripts/generate-icons.js
```

This requires `sharp` (already installed as dev dependency).

### Installation
- **Desktop**: Look for the install button in the browser address bar
- **Mobile**: Use "Add to Home Screen" option in browser menu
- **Automatic**: An install prompt will appear after visiting the site

### Service Worker
The service worker (`/sw.js`) provides:
- Offline page caching
- Network-first strategy for dynamic content
- Automatic cache cleanup
- Update notifications
