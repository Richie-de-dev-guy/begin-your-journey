# Chosen Fruit Covenant Ministries Website

The public website and staff content-management system for Chosen Fruit Covenant
Ministries Int’l Inc., based in Calabar, Cross River State, Nigeria.

## Overview

The application combines public church information and published content with a
protected admin dashboard. Staff access is managed through Supabase Auth and
role-based permissions; signing in alone does not grant admin access.

### Public website

- Church information, contact details, ministries, sermons, and events
- Published CMS pages and announcements from Supabase
- Contact enquiry and private prayer-request forms
- Responsive layouts and basic search-engine metadata

### Admin dashboard

- Supabase-authenticated admin routes at `/admin`
- Content management for pages, sermons, events, announcements, and ministries
- Media library for JPEG, PNG, WebP, and GIF images up to 5 MB
- Super Administrator editor for the six public About page sections
- Staff invitations, role management, and audit history
- Server-side permission checks and database row-level security (RLS)

## Technology

- [TanStack Start](https://tanstack.com/start) with React 19 and TypeScript
- [Vite](https://vite.dev/) and [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) Auth, Postgres, and Storage
- [Drizzle ORM](https://orm.drizzle.team/) and Drizzle Kit for schema management
- [Bun](https://bun.sh/) for package management and project scripts

## Prerequisites

- Bun installed
- A Supabase project for the application
- Supabase project URL and publishable key
- A Supabase Postgres connection string for schema setup

## Local development

1. Install dependencies:

   ```sh
   bun install
   ```

2. Copy `.env.example` to `.env` and replace the placeholders with values from
   the **same Supabase project**. Keep `.env` private and out of version control.
   See [Environment variables](#environment-variables).

3. Start the development server:

   ```sh
   bun run dev
   ```

   Open the local URL printed by Vite (normally `http://localhost:5173`).

4. To create or update the Supabase schema, follow
   [Database setup](#database-setup).

## Environment variables

| Variable                        | Required                        | Purpose                                                                                |
| ------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                  | Yes                             | Supabase project URL used by server-side functions                                     |
| `SUPABASE_PUBLISHABLE_KEY`      | Yes                             | Publishable key used by server-side Supabase clients                                   |
| `VITE_SUPABASE_URL`             | Yes for browser auth            | Project URL embedded in the browser bundle                                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes for browser auth            | Publishable key embedded in the browser bundle                                         |
| `DATABASE_URL`                  | For database scripts            | Supabase Postgres connection string                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | For privileged staff operations | Server-only key used for staff invitations and media-reference checks                  |
| `SITE_URL`                      | For staff invitations           | Public application origin used to construct invitation redirects                       |
| `ADMIN_EMAIL`                   | Optional                        | Existing Supabase Auth account used by `bun run db:seed`; otherwise the script prompts |

Use the Supabase **publishable** key in `VITE_*` variables. Never put a service
role or secret key, database password, or user password in a `VITE_*` variable:
Vite exposes those variables to the browser. Do not commit `.env` or paste
credentials into source files.

For local development, set `SITE_URL` to the local origin shown by Vite. In
production, use the deployed site origin. Configure Supabase Auth's redirect
allow list to include the matching `/admin/reset-password` URL.

## Database setup

The Drizzle schema is defined in [`drizzle/schema.ts`](./drizzle/schema.ts).
Database setup uses Drizzle Kit push, followed by the Supabase-specific
functions, grants, seed permissions, triggers, and Storage policies in
`drizzle/pre-push.sql` and `drizzle/post-push.sql`.

1. Set `DATABASE_URL` to the Postgres connection string from the Supabase
   project's **Connect** panel. Use a database password, not a Supabase API key.
2. Use the session-pooler connection details when connecting through the
   Supabase pooler. The script changes the pooler port from `6543` to `5432`
   when needed.
3. Confirm `DATABASE_URL` and `SUPABASE_URL` both point to the intended project.
4. Run:

   ```sh
   bun run db:push
   ```

This command changes the target database schema. Review any Drizzle Kit
confirmation prompts before accepting changes, and use the intended project.
Do not manually apply the legacy SQL migration; the supported setup path is
`bun run db:push`.

The About page editor requires this schema setup. It adds six placeholder About
sections without replacing any content an administrator has already saved.

## Initial admin access

1. Create or invite the administrator in the Supabase Dashboard under
   **Authentication → Users**. Set or reset the password through Supabase Auth.
2. After the schema has been pushed, grant that existing account staff access:

   ```sh
   bun run db:seed
   ```

   Enter the account email when prompted, or set `ADMIN_EMAIL` in `.env`.

3. Sign in at `/admin/login` with that Supabase Auth account.

The seed script activates the account's staff profile, grants the
`super_admin` role, and ensures `dashboard.view`. It does not create an Auth
account, set a password, or bypass authentication. Keep the service role key
server-only; use it for the staff invitation and privileged media-reference
operations that require it.

## Available scripts

| Command              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `bun run dev`        | Start the Vite development server                       |
| `bun run build`      | Create the production build                             |
| `bun run preview`    | Preview a production build locally                      |
| `bun run test`       | Run the automated test suite                            |
| `bun run test:watch` | Run tests in watch mode                                 |
| `bunx tsc --noEmit`  | Type-check the project                                  |
| `bun run lint`       | Run ESLint                                              |
| `bun run format`     | Format project files with Prettier                      |
| `bun run db:push`    | Push the Drizzle schema and run Supabase setup SQL      |
| `bun run db:seed`    | Grant admin access to an existing Supabase Auth account |

## Content and data

Public pages display published content from Supabase. Draft and archived
records are restricted to authorized staff. Contact enquiries and prayer
requests are stored separately; prayer-request records are protected by
database policies and staff permissions.

Image uploads are validated on the server for allowed format, file signature,
and size. Uploaded images can be selected in the Media Library and their public
URLs used by supported content records.

## Security model

- Supabase Auth verifies user identities.
- Server functions check the user's permissions before protected operations.
- PostgreSQL RLS policies enforce access at the database layer.
- Admin routes require an active staff profile and the appropriate permissions.
- Service-role credentials are used only in server-side code and must never be
  exposed to the browser.

Do not disable these checks to troubleshoot access. Instead, confirm the account
exists in Supabase Auth, the schema has been pushed, and the account has the
required role and permissions.

## Project layout

| Path                         | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `src/routes/`                | Public pages and file-based route definitions                   |
| `src/routes/admin/`          | Protected admin pages                                           |
| `src/components/`            | Shared site, content, form, and admin components                |
| `src/config/church.ts`       | Central church details and navigation                           |
| `src/content/`               | Content types and local fallback content                        |
| `src/lib/admin/`             | Admin server functions, schemas, permissions, and guards        |
| `src/integrations/supabase/` | Supabase clients, auth middleware, and generated database types |
| `drizzle/schema.ts`          | Drizzle table, enum, index, and RLS definitions                 |
| `drizzle/pre-push.sql`       | Database helper functions prepared before schema push           |
| `drizzle/post-push.sql`      | Supabase-specific post-push setup                               |
| `scripts/`                   | Database push and administrator provisioning scripts            |

## Launch checklist

- [ ] Replace all Supabase placeholders with credentials from the intended project.
- [ ] Set production environment variables securely in the hosting provider.
- [ ] Run `bun run db:push` against the intended Supabase database.
- [ ] Create or invite the initial Auth user and run `bun run db:seed`.
- [ ] Configure Auth redirect URLs and email delivery for the deployed domain.
- [ ] Confirm official church copy, leadership details, service times, active ministries,
      social links, logo, and privacy policy with the church.
- [ ] Run `bunx tsc --noEmit`, `bun run lint`, `bun run test`, and `bun run build`.

Online giving and member accounts are not currently implemented.
