# Sportiv Owner Web

Next.js 15 App Router dashboard for Sportiv field owners.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4 with Sportiv design tokens
- Supabase Auth (`@supabase/ssr` + `@supabase/supabase-js`)
- TanStack Query, Zod, React Hook Form
- next-themes (light / dark / system)
- Recharts, date-fns, Lucide
- Sentry (`@sentry/nextjs`)

## Setup

1. **Install Node.js 20+** if it is not already available on your PATH.

2. **Install dependencies**

```bash
cd "D:\Cursor Files\sportiv-owner-web"
npm install
```

3. **Configure environment**

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional Sentry DSN |

4. **Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth & roles

- `/login` — email/password sign-in; requires `app_metadata.role === "owner"`.
- `/signup` — calls the `register-owner` Edge Function, then signs the new owner in.
- `/reset-password` — password reset email stub.
- Middleware protects `/app/*` and redirects non-owners to login.

Ensure the Supabase Auth redirect URL includes `http://localhost:3000/auth/callback` for email flows.

## App routes

| Route | Purpose |
| --- | --- |
| `/app` | Overview — today’s bookings, 7d stats, go-live checklist |
| `/app/calendar` | Week calendar, filters, realtime, holds, add booking |
| `/app/fields` | Owner fields list |
| `/app/fields/new` | Create field (sports, slots, price, map pin) |
| `/app/fields/[id]` | Edit field, photos, listing preview |
| `/app/fields/[id]/schedule` | Weekly hours, exceptions, holds, slot preview |
| `/app/schedule` | Links to per-field schedules |
| `/app/bookings/new` | **Manual / walk-in booking** via `create-owner-booking` |
| `/app/bookings/[id]` | Booking detail, cancel, complete / no-show, notes |
| `/app/analytics` | Occupancy & revenue charts |
| `/app/account` | Profile, verification upload, theme, support |

## Backend prerequisites (sportiv repo)

From `D:\Cursor Files\sportiv`:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token>"
supabase db push
supabase functions deploy register-owner --no-verify-jwt
supabase functions deploy create-owner-booking
supabase functions deploy cancel-booking
```

Migrations include owner manual bookings, `field_slot_holds`, and `set_field_location`.

Copy the same `SUPABASE_URL` / anon key into `.env.local` as `NEXT_PUBLIC_*` values (see `.env.example`).

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Design tokens

Light / dark CSS variables live in `app/globals.css`:

- `--bg`, `--raised`, `--inset`, `--ink`, `--muted`, `--court`
- Soft neumorphic shadows: `--shadow-neu`, `--shadow-neu-sm`, `--shadow-neu-inset`
- Fonts: Outfit (display) + DM Sans (body) via `next/font/google`
