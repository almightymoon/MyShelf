-- User admin: block + CRUD (run once in SQL Editor)
-- Project: zvopkmghtflbpymsejcc

alter table public.profiles
  add column if not exists blocked boolean not null default false;

-- Admins can update any profile (name / blocked); members still update self
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

create or replace function public.is_protected_admin(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_id
      and (
        role = 'admin'
        or lower(email) = 'atharqulimoon@gmail.com'
      )
  );
$$;

create or replace function public.admin_update_member(
  target_id uuid,
  new_name text default null,
  new_blocked boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage members';
  end if;
  if public.is_protected_admin(target_id) and new_blocked is true then
    raise exception 'Cannot block the admin account';
  end if;

  update public.profiles
  set
    name = coalesce(nullif(trim(new_name), ''), name),
    blocked = coalesce(new_blocked, blocked)
  where id = target_id
  returning * into row;

  if row.id is null then
    raise exception 'User not found';
  end if;
  return row;
end;
$$;

create or replace function public.admin_delete_member(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage members';
  end if;
  if public.is_protected_admin(target_id) then
    raise exception 'Cannot delete the admin account';
  end if;

  delete from public.profiles where id = target_id;
  delete from auth.users where id = target_id;
end;
$$;

create or replace function public.admin_create_member(
  new_email text,
  new_password text,
  new_name text default ''
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  uid uuid := gen_random_uuid();
  normalized text := lower(trim(new_email));
  display text := coalesce(nullif(trim(new_name), ''), split_part(normalized, '@', 1));
  row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create members';
  end if;
  if normalized is null or normalized = '' then
    raise exception 'Email is required';
  end if;
  if new_password is null or char_length(new_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  if normalized = 'atharqulimoon@gmail.com' then
    raise exception 'That email is reserved for the admin';
  end if;
  if exists (select 1 from auth.users where lower(email) = normalized) then
    raise exception 'A user with that email already exists';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    coalesce((select instance_id from auth.users limit 1), '00000000-0000-0000-0000-000000000000'),
    uid,
    'authenticated',
    'authenticated',
    normalized,
    crypt(new_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', display),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    uid,
    jsonb_build_object('sub', uid::text, 'email', normalized, 'email_verified', true, 'name', display),
    'email',
    uid::text,
    now(),
    now(),
    now()
  );

  insert into public.profiles (id, email, name, role, blocked)
  values (uid, normalized, display, 'member', false)
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        role = 'member',
        blocked = false
  returning * into row;

  return row;
end;
$$;

grant execute on function public.admin_update_member(uuid, text, boolean) to authenticated;
grant execute on function public.admin_delete_member(uuid) to authenticated;
grant execute on function public.admin_create_member(text, text, text) to authenticated;

notify pgrst, 'reload schema';
