# Sarvam Device Manager (v2)

Multi-tenant EMI device management platform. Shops install an Android app on
financed phones; this dashboard locks/unlocks/sirens/wipes devices when
customers miss payments. Built for 100k shops / 1M devices.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Prisma + PostgreSQL (Supabase to start, portable to any Postgres)
- JWT sessions in httpOnly cookies, PBKDF2 password hashing (Web Crypto)
- Tailwind CSS

## Architecture rules
- Every file is under 200 lines.
- All code and UI text in English.
- Multi-tenant: Organization -> Shops -> Users / Devices.
- Role-based access: OWNER (whole org), MANAGER / STAFF (own shop).
- Every sensitive action writes an immutable `AuditLog` row in the same
  transaction.
- Phones authenticate with a per-device token (`X-Device-Token`).

## Setup
```bash
npm install
cp .env.example .env     # fill DATABASE_URL, JWT_SECRET, CRON_SECRET
npm run prisma:push      # create tables
npm run seed             # demo org, shops, users, devices
npm run dev
```
Demo login: `owner1` / `admin123`

## Deploy (Vercel)
- Set env vars in the Vercel project.
- `vercel.json` schedules the EMI and offline auto-lock crons.

## Migrating to Oracle VM later
Only `DATABASE_URL` / `DIRECT_URL` change — point them at the self-hosted
PostgreSQL. No code changes.
