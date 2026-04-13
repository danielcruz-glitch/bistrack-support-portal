# BisTrack Support Portal

A production-ready starter app for:

- authenticated staff ticket submission
- support/admin ticket dashboard
- priority and urgency color coding
- email notifications for new tickets
- overdue ticket reminders after 2 days
- user issue resolution confirmation
- billable time tracking
- invoice generation with print-to-PDF output

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Resend email
- Vercel deployment

## 1. Create your Supabase project

In Supabase:

1. Create a new project.
2. Go to **SQL Editor**.
3. Run the file in `database/schema.sql`.
4. In **Project Settings > API**, copy:
   - Project URL
   - anon public key
   - service role key

## 2. Create your environment file

Copy `.env.example` to `.env.local` and fill in real values.

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `SUPPORT_NOTIFICATION_EMAIL`
- `INVOICE_BILL_TO`
- `DEFAULT_HOURLY_RATE`
- `CRON_SECRET`

## 3. Install dependencies

```bash
npm install
```

## 4. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Create your first account

1. Go to `/signup`
2. Create your account
3. Confirm your email
4. In Supabase SQL Editor, promote your account:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

That gives you admin access for the support dashboard and invoices.

## 6. Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables in Vercel.
4. Deploy.

Set:

- `NEXT_PUBLIC_SITE_URL` to your real Vercel domain
- `CRON_SECRET` to a random secret string

Vercel cron is already configured in `vercel.json`.

## 7. Secure the overdue cron

When Vercel calls the cron route, add this environment variable in Vercel:

- `CRON_SECRET`

The route expects:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

If you want to test manually:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/overdue
```

## Main pages

- `/login`
- `/signup`
- `/dashboard`
- `/tickets/new`
- `/tickets/[id]`
- `/admin`
- `/invoices`
- `/invoices/[id]/print`

## Notes

- Staff sign up with role `user` by default.
- Admin/support role should be assigned manually in Supabase.
- Invoice output is a clean printable page so you can save it as PDF from the browser.
- Email sending uses Resend's default onboarding sender. Replace it later with your verified domain.

## Suggested next improvements

- file attachments and screenshots
- ticket comments with email updates to requester
- ticket assignment to technician
- SLA dashboard
- recurring issue analytics by department or category
- customer-facing knowledge base
