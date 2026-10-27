# Phase 2 Roadmap — Admin Dashboard & CMS

- [x] Configure Supabase Auth, database, and storage integration; document required project environment and redirect configuration
- [x] Define profiles, roles/permissions, user_roles, pages, sermons, events, announcements, ministries, media_assets, inquiries, prayer_requests, audit_logs, RLS, and grants in Drizzle with a repeatable `db:push` workflow
- [x] Implement `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, and the protected `/admin` shell
- [x] Implement five RBAC roles, permission keys, RLS, and server-side permission enforcement
- [x] Build the admin dashboard using live database counts
- [x] Implement pages CRUD with draft/published/archived states and public published-page routing
- [x] Implement sermons, events, announcements, and ministries management
- [x] Implement the media library with server-side type, byte-signature, and 5 MB upload restrictions
- [x] Implement enquiry and confidential prayer-request submission and staff management
- [x] Implement staff invitations, role and active-state management, and audit-log viewing/writing
- [x] Connect public pages to published Supabase content
- [x] Add route tests, `.env.example`, and Supabase/admin setup documentation in `README.md`

Remote deployment still requires supplying valid Supabase credentials, running `bun run db:push`, and provisioning the initial administrator with `bun run db:seed`; those actions are environment-specific and are not performed by this source-code checklist.
