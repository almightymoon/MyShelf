-- Athar's Shelf — CORE schema (paste into SQL Editor and click Run)
-- Project must be: zvopkmghtflbpymsejcc (check the URL bar)
-- Success = green "Success" + no red error. Then Table Editor should list: sites, ideas, models

create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  name text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text := 'atharqulimoon@gmail.com';
  user_name text;
  user_role text := 'member';
begin
  user_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  if lower(new.email) = admin_email then
    user_role := 'admin';
  end if;
  insert into public.profiles (id, email, name, role)
  values (new.id, lower(new.email), user_name, user_role)
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(profiles.name, ''), excluded.name),
        role = case when excluded.role = 'admin' then 'admin' else profiles.role end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text default '',
  url text not null,
  category text references public.categories (id) on delete set null,
  description text default '',
  explore_note text default '',
  image_url text default '',
  gallery jsonb not null default '[]'::jsonb,
  look jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id text primary key,
  title text not null,
  type text default 'Reference',
  access text not null default 'free' check (access in ('free', 'paid')),
  price numeric,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.idea_likes (
  idea_id text not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table if not exists public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id text not null references public.ideas (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.models (
  id text primary key,
  title text not null,
  note text default '',
  filename text default '',
  storage_path text,
  src_url text,
  size bigint,
  sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

insert into public.categories (id, label) values
  ('studio', 'Studios'),
  ('portfolio', 'Portfolio'),
  ('culture', 'Culture'),
  ('shop', 'Shops')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 157286400)
on conflict (id) do update
  set public = true,
      file_size_limit = 157286400;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sites enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_likes enable row level security;
alter table public.idea_comments enable row level security;
alter table public.models enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sites_public_read" on public.sites;
create policy "sites_public_read" on public.sites for select using (true);
drop policy if exists "sites_admin_write" on public.sites;
create policy "sites_admin_write" on public.sites for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ideas_public_read" on public.ideas;
create policy "ideas_public_read" on public.ideas for select using (true);
drop policy if exists "ideas_admin_write" on public.ideas;
create policy "ideas_admin_write" on public.ideas for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "likes_public_read" on public.idea_likes;
create policy "likes_public_read" on public.idea_likes for select using (true);
drop policy if exists "likes_auth_write" on public.idea_likes;
create policy "likes_auth_write" on public.idea_likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_auth_delete" on public.idea_likes;
create policy "likes_auth_delete" on public.idea_likes for delete using (auth.uid() = user_id);

drop policy if exists "comments_public_read" on public.idea_comments;
create policy "comments_public_read" on public.idea_comments for select using (true);
drop policy if exists "comments_auth_insert" on public.idea_comments;
create policy "comments_auth_insert" on public.idea_comments for insert with check (auth.uid() = user_id);

drop policy if exists "models_public_read" on public.models;
create policy "models_public_read" on public.models for select using (true);
drop policy if exists "models_admin_write" on public.models;
create policy "models_admin_write" on public.models for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages_admin_read" on public.messages;
create policy "messages_admin_read" on public.messages for select using (public.is_admin());
drop policy if exists "messages_anyone_insert" on public.messages;
create policy "messages_anyone_insert" on public.messages for insert with check (true);
drop policy if exists "messages_admin_delete" on public.messages;
create policy "messages_admin_delete" on public.messages for delete using (public.is_admin());

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

notify pgrst, 'reload schema';

-- Prove it worked (you should see row counts)
select 'profiles' as name, count(*)::int as n from public.profiles
union all select 'categories', count(*)::int from public.categories
union all select 'sites', count(*)::int from public.sites
union all select 'ideas', count(*)::int from public.ideas
union all select 'models', count(*)::int from public.models;
