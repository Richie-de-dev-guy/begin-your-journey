-- Phase 2: Admin dashboard, RBAC, CMS schema

-- ============ ROLES & PERMISSIONS ============
create type public.app_role as enum ('super_admin','pastor','content_editor','event_coordinator','support_staff');
create type public.content_status as enum ('draft','published','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- Individual permission overrides (e.g. grant a specific pastor prayer-request access)
create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  permission text not null,
  unique (user_id, permission)
);
grant select on public.user_permissions to authenticated;
grant all on public.user_permissions to service_role;
alter table public.user_permissions enable row level security;

-- Role -> permission map
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  permission text not null,
  unique (role, permission)
);
grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;
alter table public.role_permissions enable row level security;

insert into public.role_permissions (role, permission) values
  -- super admin: everything
  ('super_admin','dashboard.view'),('super_admin','content.read'),('super_admin','content.create'),('super_admin','content.update'),('super_admin','content.publish'),
  ('super_admin','sermons.manage'),('super_admin','events.manage'),('super_admin','announcements.manage'),('super_admin','ministries.manage'),
  ('super_admin','media.manage'),('super_admin','inquiries.read'),('super_admin','inquiries.update'),
  ('super_admin','prayer_requests.read'),('super_admin','prayer_requests.update'),
  ('super_admin','users.manage'),('super_admin','audit_logs.read'),('super_admin','settings.manage'),
  -- pastor / ministry leader
  ('pastor','dashboard.view'),('pastor','content.read'),('pastor','sermons.manage'),('pastor','events.manage'),('pastor','ministries.manage'),
  -- content / media editor
  ('content_editor','dashboard.view'),('content_editor','content.read'),('content_editor','content.create'),('content_editor','content.update'),('content_editor','content.publish'),
  ('content_editor','sermons.manage'),('content_editor','announcements.manage'),('content_editor','media.manage'),
  -- event coordinator
  ('event_coordinator','dashboard.view'),('event_coordinator','events.manage'),
  -- support / follow-up staff
  ('support_staff','dashboard.view'),('support_staff','inquiries.read'),('support_staff','inquiries.update');

-- Security-definer helpers (avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.has_permission(_user_id uuid, _permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = _user_id and rp.permission = _permission
  ) or exists (
    select 1 from public.user_permissions up
    where up.user_id = _user_id and up.permission = _permission
  ) or exists (
    select 1 from public.profiles p where p.id = _user_id and p.is_active = false
  ) = false and (
    exists (select 1 from public.user_roles ur join public.role_permissions rp on rp.role = ur.role where ur.user_id = _user_id and rp.permission = _permission)
    or exists (select 1 from public.user_permissions up where up.user_id = _user_id and up.permission = _permission)
  )
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ AUDIT LOG ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit read by authorized" on public.audit_logs for select to authenticated
  using (public.has_permission(auth.uid(), 'audit_logs.read'));
create policy "audit insert own" on public.audit_logs for insert to authenticated
  with check (actor_id = auth.uid());
-- no update/delete policies: append-only

-- ============ CMS: PAGES ============
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null default '',
  seo_title text,
  seo_description text,
  featured_image_url text,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;
grant all on public.pages to service_role;
alter table public.pages enable row level security;
create policy "public reads published pages" on public.pages for select to anon using (status = 'published');
create policy "staff read pages" on public.pages for select to authenticated using (public.has_permission(auth.uid(),'content.read'));
create policy "staff create pages" on public.pages for insert to authenticated with check (public.has_permission(auth.uid(),'content.create'));
create policy "staff update pages" on public.pages for update to authenticated using (public.has_permission(auth.uid(),'content.update'));
create policy "staff delete pages" on public.pages for delete to authenticated using (public.has_permission(auth.uid(),'content.publish'));

-- ============ SERMONS ============
create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  speaker text not null default '',
  description text not null default '',
  passage text,
  topic text,
  sermon_date date,
  thumbnail_url text,
  video_url text,
  audio_url text,
  is_featured boolean not null default false,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.sermons to anon;
grant select, insert, update, delete on public.sermons to authenticated;
grant all on public.sermons to service_role;
alter table public.sermons enable row level security;
create policy "public reads published sermons" on public.sermons for select to anon using (status = 'published');
create policy "staff manage sermons select" on public.sermons for select to authenticated using (public.has_permission(auth.uid(),'sermons.manage'));
create policy "staff manage sermons insert" on public.sermons for insert to authenticated with check (public.has_permission(auth.uid(),'sermons.manage'));
create policy "staff manage sermons update" on public.sermons for update to authenticated using (public.has_permission(auth.uid(),'sermons.manage'));
create policy "staff manage sermons delete" on public.sermons for delete to authenticated using (public.has_permission(auth.uid(),'sermons.manage'));

-- ============ EVENTS ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  featured_image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Africa/Lagos',
  venue text,
  online_url text,
  registration_url text,
  is_featured boolean not null default false,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public reads published events" on public.events for select to anon using (status = 'published');
create policy "staff manage events select" on public.events for select to authenticated using (public.has_permission(auth.uid(),'events.manage'));
create policy "staff manage events insert" on public.events for insert to authenticated with check (public.has_permission(auth.uid(),'events.manage'));
create policy "staff manage events update" on public.events for update to authenticated using (public.has_permission(auth.uid(),'events.manage'));
create policy "staff manage events delete" on public.events for delete to authenticated using (public.has_permission(auth.uid(),'events.manage'));

-- ============ ANNOUNCEMENTS ============
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  published_at timestamptz,
  expires_at timestamptz,
  priority int not null default 0,
  is_featured boolean not null default false,
  status content_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "public reads live announcements" on public.announcements for select to anon
  using (status = 'published' and (expires_at is null or expires_at > now()));
create policy "staff manage announcements select" on public.announcements for select to authenticated using (public.has_permission(auth.uid(),'announcements.manage'));
create policy "staff manage announcements insert" on public.announcements for insert to authenticated with check (public.has_permission(auth.uid(),'announcements.manage'));
create policy "staff manage announcements update" on public.announcements for update to authenticated using (public.has_permission(auth.uid(),'announcements.manage'));
create policy "staff manage announcements delete" on public.announcements for delete to authenticated using (public.has_permission(auth.uid(),'announcements.manage'));

-- ============ MINISTRIES ============
create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  featured_image_url text,
  schedule text,
  contact text,
  display_order int not null default 0,
  is_active boolean not null default true,
  status content_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.ministries to anon;
grant select, insert, update, delete on public.ministries to authenticated;
grant all on public.ministries to service_role;
alter table public.ministries enable row level security;
create policy "public reads published ministries" on public.ministries for select to anon using (status = 'published' and is_active = true);
create policy "staff manage ministries select" on public.ministries for select to authenticated using (public.has_permission(auth.uid(),'ministries.manage'));
create policy "staff manage ministries insert" on public.ministries for insert to authenticated with check (public.has_permission(auth.uid(),'ministries.manage'));
create policy "staff manage ministries update" on public.ministries for update to authenticated using (public.has_permission(auth.uid(),'ministries.manage'));
create policy "staff manage ministries delete" on public.ministries for delete to authenticated using (public.has_permission(auth.uid(),'ministries.manage'));

-- ============ MEDIA LIBRARY ============
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null default 0,
  alt_text text,
  width int,
  height int,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.media_assets to anon;
grant select, insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
alter table public.media_assets enable row level security;
create policy "public reads media metadata" on public.media_assets for select to anon using (true);
create policy "staff manage media insert" on public.media_assets for insert to authenticated with check (public.has_permission(auth.uid(),'media.manage'));
create policy "staff manage media update" on public.media_assets for update to authenticated using (public.has_permission(auth.uid(),'media.manage'));
create policy "staff manage media delete" on public.media_assets for delete to authenticated using (public.has_permission(auth.uid(),'media.manage'));

-- ============ INQUIRIES ============
create type public.inquiry_status as enum ('new','in_progress','contacted','resolved','archived');
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text not null default '',
  message text not null,
  status inquiry_status not null default 'new',
  assigned_to uuid,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.inquiries to anon;
grant select, update on public.inquiries to authenticated;
grant all on public.inquiries to service_role;
alter table public.inquiries enable row level security;
create policy "anyone can submit inquiry" on public.inquiries for insert to anon with check (true);
create policy "staff read inquiries" on public.inquiries for select to authenticated using (public.has_permission(auth.uid(),'inquiries.read'));
create policy "staff update inquiries" on public.inquiries for update to authenticated using (public.has_permission(auth.uid(),'inquiries.update'));

-- ============ PRAYER REQUESTS (confidential) ============
create type public.prayer_status as enum ('new','under_prayer','follow_up','completed','archived');
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  submitter_name text,
  contact text,
  is_private boolean not null default true,
  status prayer_status not null default 'new',
  assigned_to uuid,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.prayer_requests to anon;
grant select, update on public.prayer_requests to authenticated;
grant all on public.prayer_requests to service_role;
alter table public.prayer_requests enable row level security;
create policy "anyone can submit prayer request" on public.prayer_requests for insert to anon with check (true);
create policy "authorized read prayer requests" on public.prayer_requests for select to authenticated using (public.has_permission(auth.uid(),'prayer_requests.read'));
create policy "authorized update prayer requests" on public.prayer_requests for update to authenticated using (public.has_permission(auth.uid(),'prayer_requests.update'));

-- ============ STAFF INVITATIONS ============
create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role app_role not null,
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email)
);
grant select, insert, update, delete on public.staff_invitations to authenticated;
grant all on public.staff_invitations to service_role;
alter table public.staff_invitations enable row level security;
create policy "admins manage invitations" on public.staff_invitations for all to authenticated
  using (public.has_permission(auth.uid(),'users.manage'));

-- profiles & roles policies
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.has_permission(auth.uid(),'users.manage'));
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and is_active = (select is_active from public.profiles where id = auth.uid()));
create policy "admins update profiles" on public.profiles for update to authenticated using (public.has_permission(auth.uid(),'users.manage'));
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_permission(auth.uid(),'users.manage'));
create policy "users read own permission overrides" on public.user_permissions for select to authenticated using (user_id = auth.uid() or public.has_permission(auth.uid(),'users.manage'));
create policy "authenticated read role permissions" on public.role_permissions for select to authenticated using (true);

-- indexes
create index idx_pages_status on public.pages(status);
create index idx_sermons_status_date on public.sermons(status, sermon_date desc);
create index idx_events_status_starts on public.events(status, starts_at);
create index idx_announcements_status on public.announcements(status, expires_at);
create index idx_ministries_order on public.ministries(display_order);
create index idx_inquiries_status on public.inquiries(status, created_at desc);
create index idx_prayer_status on public.prayer_requests(status, created_at desc);
create index idx_audit_created on public.audit_logs(created_at desc);
create index idx_user_roles_user on public.user_roles(user_id);