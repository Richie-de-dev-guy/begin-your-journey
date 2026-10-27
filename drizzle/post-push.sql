-- drizzle-statement
insert into public.role_permissions (role, permission) values
  ('super_admin','dashboard.view'),('super_admin','content.read'),('super_admin','content.create'),('super_admin','content.update'),('super_admin','content.publish'),
  ('super_admin','sermons.manage'),('super_admin','events.manage'),('super_admin','announcements.manage'),('super_admin','ministries.manage'),
  ('super_admin','media.manage'),('super_admin','inquiries.read'),('super_admin','inquiries.update'),
  ('super_admin','prayer_requests.read'),('super_admin','prayer_requests.update'),
  ('super_admin','users.manage'),('super_admin','audit_logs.read'),('super_admin','settings.manage'),
  ('pastor','dashboard.view'),('pastor','content.read'),('pastor','sermons.manage'),('pastor','events.manage'),('pastor','ministries.manage'),
  ('content_editor','dashboard.view'),('content_editor','content.read'),('content_editor','content.create'),('content_editor','content.update'),('content_editor','content.publish'),
  ('content_editor','sermons.manage'),('content_editor','announcements.manage'),('content_editor','media.manage'),
  ('event_coordinator','dashboard.view'),('event_coordinator','events.manage'),
  ('support_staff','dashboard.view'),('support_staff','inquiries.read'),('support_staff','inquiries.update')
on conflict (role, permission) do nothing;

-- drizzle-statement
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  )
$$;

-- drizzle-statement
create or replace function public.has_permission(_user_id uuid, _permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and is_active = true
  ) and (
    exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      where ur.user_id = _user_id and rp.permission = _permission
    )
    or exists (
      select 1 from public.user_permissions
      where user_id = _user_id and permission = _permission
    )
  )
$$;

-- drizzle-statement
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

-- drizzle-statement
drop trigger if exists on_auth_user_created on auth.users;

-- drizzle-statement
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- drizzle-statement
create or replace function public.handle_staff_invite_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
    and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.staff_invitations
    set accepted_at = coalesce(accepted_at, now())
    where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

-- drizzle-statement
drop trigger if exists on_auth_user_invite_accepted on auth.users;

-- drizzle-statement
create trigger on_auth_user_invite_accepted
after update of email_confirmed_at on auth.users
for each row execute function public.handle_staff_invite_acceptance();

-- drizzle-statement
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_auth_users_id_fk'
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_id_fk
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'user_roles_user_id_auth_users_id_fk'
  ) then
    alter table public.user_roles
      add constraint user_roles_user_id_auth_users_id_fk
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'user_permissions_user_id_auth_users_id_fk'
  ) then
    alter table public.user_permissions
      add constraint user_permissions_user_id_auth_users_id_fk
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

-- drizzle-statement
grant usage on schema public to anon, authenticated, service_role;

-- drizzle-statement
grant select, update on public.profiles to authenticated;

-- drizzle-statement
grant select on public.user_roles, public.user_permissions, public.role_permissions to authenticated;

-- drizzle-statement
grant select, insert on public.audit_logs to authenticated;

-- drizzle-statement
grant select, insert, update, delete on public.pages, public.sermons, public.events,
  public.announcements, public.ministries, public.media_assets, public.staff_invitations
to authenticated;

-- drizzle-statement
grant insert on public.inquiries, public.prayer_requests to anon;

-- drizzle-statement
grant select, update on public.inquiries, public.prayer_requests to authenticated;

-- drizzle-statement
grant select on public.pages, public.sermons, public.events, public.announcements,
  public.ministries, public.media_assets to anon;

-- drizzle-statement
grant all on public.profiles, public.user_roles, public.user_permissions, public.role_permissions,
  public.audit_logs, public.pages, public.sermons, public.events, public.announcements,
  public.ministries, public.media_assets, public.inquiries, public.prayer_requests,
  public.staff_invitations to service_role;

-- drizzle-statement
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

-- drizzle-statement
drop policy if exists "public read media files" on storage.objects;

-- drizzle-statement
create policy "public read media files" on storage.objects
for select to anon using (bucket_id = 'media');

-- drizzle-statement
drop policy if exists "staff upload media files" on storage.objects;

-- drizzle-statement
create policy "staff upload media files" on storage.objects
for insert to authenticated
with check (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));

-- drizzle-statement
drop policy if exists "staff update media files" on storage.objects;

-- drizzle-statement
create policy "staff update media files" on storage.objects
for update to authenticated
using (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));

-- drizzle-statement
drop policy if exists "staff delete media files" on storage.objects;

-- drizzle-statement
create policy "staff delete media files" on storage.objects
for delete to authenticated
using (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));
