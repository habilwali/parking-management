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
# parking-management
