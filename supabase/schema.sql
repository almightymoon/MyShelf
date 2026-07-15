-- Athar's Shelf — run this once in the Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
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
  admin_email text := lower(coalesce(current_setting('app.admin_email', true), 'atharqulimoon@gmail.com'));
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

-- Categories
create table if not exists public.categories (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

-- Sites
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

-- Ideas
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

-- 3D models
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

-- Contact inbox
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Seed categories
insert into public.categories (id, label) values
  ('studio', 'Studios'),
  ('portfolio', 'Portfolio'),
  ('culture', 'Culture'),
  ('shop', 'Shops')
on conflict (id) do nothing;

-- Storage bucket (public read; 150MB limit for GLB uploads)
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 157286400)
on conflict (id) do update
  set public = true,
      file_size_limit = 157286400;

-- Sample 3D models (remote GLB URLs — no storage upload needed)
insert into public.models (id, title, note, filename, src_url, sample) values
  ('sample-astronaut', 'Astronaut study', 'A classic spatial reference — orbit, light, and clean silhouette.', 'Astronaut.glb', 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', true),
  ('sample-robot', 'Robot expressive', 'Character form in the round — useful when you need presence, not polish.', 'RobotExpressive.glb', 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', true),
  ('sample-armstrong', 'Neil Armstrong', 'Figure study with a clear silhouette — good for scale and framing.', 'NeilArmstrong.glb', 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb', true)
on conflict (id) do nothing;

-- Starter shelf (shared across all visitors)
insert into public.sites (title, blurb, url, category, description, explore_note, image_url, sort_order) 
select * from (values
  ('Other Means', 'Culture, brand, and sharp moments.', 'https://othermeans.studio', 'studio', 'A studio for culture and brand moments.', 'What stands out is the pacing — every section feels intentional, never busy. Typography and motion share the same quiet confidence.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', 0),
  ('Noma Projects', 'Objects with a story attached.', 'https://nomaprojects.com', 'shop', 'Curiosities from the Noma universe.', 'The shop feels like an extension of the restaurant’s world — tactile photography, restrained type, and products that read as souvenirs from another place.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', 1),
  ('Field Notes', 'A slower kind of internet.', 'https://fieldnotesbrand.com', 'culture', 'Notes from a slower kind of life.', 'Editorial calm done right. The site trusts white space and lets the product photography do most of the talking.', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80', 2),
  ('Mina Kwon', 'Soft colours, sharp perspective.', 'https://example.com', 'portfolio', 'A portfolio that knows when to stay quiet.', 'Colour is used like a signature — never decorative noise. The work is left room to breathe, which makes each project land harder.', 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80', 3),
  ('Aesop', 'A sensory storefront online.', 'https://www.aesop.com', 'shop', 'A sensory world, beautifully built.', 'Aesop’s digital presence matches the brand: considered materials, deliberate hierarchy, and almost no wasted motion.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', 4),
  ('Yuko Shimizu', 'Ink with wild instinct.', 'https://yukoart.com', 'portfolio', 'Ink, instinct and wildness.', 'The site stays out of the way of the illustrations. High-contrast work, strong grids, and a portfolio rhythm that feels hand-led.', 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80', 5)
) as v(title, blurb, url, category, description, explore_note, image_url, sort_order)
where not exists (select 1 from public.sites limit 1);

insert into public.ideas (id, title, type, access, price, image_url, sort_order) values
  ('soft-chrome', 'Soft chrome', 'Material study', 'free', null, 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=900&q=85', 0),
  ('quiet-architecture', 'Quiet architecture', 'Space', 'free', null, 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85', 1),
  ('red-interruption', 'A red interruption', 'Colour', 'paid', 4, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85', 2),
  ('type-in-motion', 'Type in motion', 'Typography', 'free', null, 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=900&q=85', 3),
  ('blue-room', 'The blue room', 'Atmosphere', 'free', null, 'https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=900&q=85', 4),
  ('gloss-grain', 'Gloss & grain', 'Material study', 'paid', 6, 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=900&q=85', 5),
  ('useful-object', 'A useful object', 'Object', 'free', null, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=85', 6),
  ('paper-folded', 'Paper, folded', 'Composition', 'free', null, 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85', 7),
  ('late-afternoon', 'Late afternoon', 'Light', 'free', null, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85', 8),
  ('frame-within', 'A frame within', 'Composition', 'free', null, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=85', 9),
  ('signal-orange', 'Signal orange', 'Colour', 'paid', 3, 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85', 10),
  ('almost-tactile', 'Almost tactile', 'Texture', 'free', null, 'https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=85', 11)
on conflict (id) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sites enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_likes enable row level security;
alter table public.idea_comments enable row level security;
alter table public.models enable row level security;
alter table public.messages enable row level security;

-- Profiles
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- Categories
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- Sites
drop policy if exists "sites_public_read" on public.sites;
create policy "sites_public_read" on public.sites for select using (true);
drop policy if exists "sites_admin_write" on public.sites;
create policy "sites_admin_write" on public.sites for all using (public.is_admin()) with check (public.is_admin());

-- Ideas
drop policy if exists "ideas_public_read" on public.ideas;
create policy "ideas_public_read" on public.ideas for select using (true);
drop policy if exists "ideas_admin_write" on public.ideas;
create policy "ideas_admin_write" on public.ideas for all using (public.is_admin()) with check (public.is_admin());

-- Likes
drop policy if exists "likes_public_read" on public.idea_likes;
create policy "likes_public_read" on public.idea_likes for select using (true);
drop policy if exists "likes_auth_write" on public.idea_likes;
create policy "likes_auth_write" on public.idea_likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_auth_delete" on public.idea_likes;
create policy "likes_auth_delete" on public.idea_likes for delete using (auth.uid() = user_id);

-- Comments
drop policy if exists "comments_public_read" on public.idea_comments;
create policy "comments_public_read" on public.idea_comments for select using (true);
drop policy if exists "comments_auth_insert" on public.idea_comments;
create policy "comments_auth_insert" on public.idea_comments for insert with check (auth.uid() = user_id);

-- Models
drop policy if exists "models_public_read" on public.models;
create policy "models_public_read" on public.models for select using (true);
drop policy if exists "models_admin_write" on public.models;
create policy "models_admin_write" on public.models for all using (public.is_admin()) with check (public.is_admin());

-- Messages
drop policy if exists "messages_admin_read" on public.messages;
create policy "messages_admin_read" on public.messages for select using (public.is_admin());
drop policy if exists "messages_anyone_insert" on public.messages;
create policy "messages_anyone_insert" on public.messages for insert with check (true);
drop policy if exists "messages_admin_delete" on public.messages;
create policy "messages_admin_delete" on public.messages for delete using (public.is_admin());

-- Storage policies
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
