# Chosen Fruit Covenant Ministries Int’l Inc. — Website and Admin CMS

Public website for Chosen Fruit Covenant Ministries Int’l Inc., a Pentecostal / Charismatic
Christian ministry in Calabar, Cross River State, Nigeria.

## Tech stack

- TanStack Start (React 19 + TypeScript, SSR) with Vite
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Lucide React icons
- File-based routing in `src/routes/`

## Development

```bash
bun install
bun run dev      # local dev server
bun run build    # production build
bun run test     # run tests
bunx tsc --noEmit
```

Copy `.env.example` to `.env` and set values from one Supabase project. Never commit
`.env`, put a password or service-role key in a `VITE_*` variable, or share database
credentials. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used only for staff
invitation and role-management operations and server-side media-reference checks.
Set `SITE_URL` to the public site origin so Supabase invitations return to
`/admin/reset-password`.

## Database schema

Set `DATABASE_URL` in `.env` to your Supabase Postgres connection string, then run
`bun run db:push`. Use the database password in the connection string; do not use the
Supabase publishable or service-role key. For Supabase migrations, use the Session
pooler connection string from the same project's Connect panel; `db:push` changes
the transaction-pooler port (6543) to the session-pooler port (5432) automatically.
The command pushes the schema in
`drizzle/schema.ts`, then automatically installs the Supabase permission functions,
role-permission seed data, signup trigger, grants, and media storage policies.

Do not run the old SQL migration files manually. Drizzle manages the tables, enums,
indexes, and row-level security policies. The remaining Supabase-specific setup runs
automatically as part of `db:push`. The command briefly installs deny-all helper
functions before Drizzle creates the RLS policies, then replaces them with the real
permission checks afterward.

After `db:push` succeeds and the account exists under **Supabase Dashboard →
Authentication → Users**, grant it admin access with `bun run db:seed`. Enter the
account email when prompted or set `ADMIN_EMAIL` in `.env`. This activates the account's staff profile, grants the
`super_admin` role, and ensures the `dashboard.view` permission; it does not create
an account or password. Sign in at `/admin/login` with the email and password set
for the Supabase Auth account.

The Auth account must already exist in the same Supabase project. The admin
dashboard uses database roles and permissions; successful authentication alone
does not grant staff access.

The database schema and RLS policies are defined in `drizzle/schema.ts`.
`bun run db:push` uses Drizzle Kit push and then installs the Supabase-specific
functions, grants, trigger, role permissions, and storage policies. Do not run
legacy SQL migration files manually. In Supabase, ensure the Auth redirect allow
list includes the deployed site's `/admin/reset-password` URL. The media bucket
is provisioned by `db:push`.

Public sermons, events, ministries, announcements, and published CMS pages read
from the Supabase tables. Contact enquiries and prayer requests are submitted to
their respective tables; prayer-request contents are protected by RLS and staff
permissions.

## Project structure

- `src/config/church.ts` — **single source of truth** for church name, phone, email, address,
  navigation, service times, and social links. Update church facts here only.
- `src/content/` — fallback/initial content types. Published sermons, events,
  ministries, announcements, and custom pages are read from Supabase.
- `src/components/` — reusable components: `SiteHeader`, `SiteFooter`, `sections.tsx`
  (PageHero, MinistryCard, SermonCard, EventCard, ContactDetails, ServiceTimes, …),
  `ContactForm.tsx`, `ui.tsx` (PageContainer, SectionHeading, buttons, EmptyState).
- `src/routes/` — public pages plus `/admin` for the protected CMS, staff management,
  invitations, and audit history.
- `public/sitemap.xml`, `public/robots.txt` — SEO files (add absolute URLs once the
  production domain is known).

## Information still needed from the church before launch

1. Official mission / vision statements, church history, core values, statement of faith.
2. Service times (currently a placeholder prompting visitors to call).
3. Pastor / leadership names and introductions.
4. Confirmed list of active ministries (current cards are labelled examples).
5. Real sermons and events to publish.
6. Official logo (a text-based logo is used for now).
7. Confirmed social media links, if any.
8. Review and approval of the draft privacy policy.
9. Review of the Google Business listing spelling (“Choosen Fruit Ministry” vs the official name).

## Public forms

The contact form stores validated enquiries in Supabase. Prayer requests are stored
separately and can be marked private; access to their contents requires an explicit
staff permission. Both forms use server-side validation and database row-level security.

## Future phases

Future work includes online giving via Paystack/Flutterwave and member accounts/event
registration. For launch, configure the Supabase Auth redirect allow list and SMTP,
set production environment variables, push the Drizzle schema, and grant the initial
administrator with `bun run db:seed`.
