-- drizzle-statement
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  has_role_result boolean;
begin
  if to_regclass('public.user_roles') is null then
    return false;
  end if;
  execute
    'select exists (select 1 from public.user_roles where user_id = $1 and role::text = $2)'
    into has_role_result
    using _user_id, _role;
  return coalesce(has_role_result, false);
end;
$$;

-- drizzle-statement
create or replace function public.has_permission(_user_id uuid, _permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  permission_result boolean;
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.user_roles') is null
    or to_regclass('public.role_permissions') is null
    or to_regclass('public.user_permissions') is null then
    return false;
  end if;
  execute $query$
    select exists (
      select 1 from public.profiles
      where id = $1 and is_active = true
    ) and (
      exists (
        select 1
        from public.user_roles ur
        join public.role_permissions rp on rp.role = ur.role
        where ur.user_id = $1 and rp.permission = $2
      )
      or exists (
        select 1 from public.user_permissions
        where user_id = $1 and permission = $2
      )
    )
  $query$
    into permission_result
    using _user_id, _permission;
  return coalesce(permission_result, false);
end;
$$;
