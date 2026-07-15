-- Athar's Shelf — Postgres schema for VPS (no Supabase)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null default '',
  password_hash text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text default '',
  url text not null,
  category text references categories (id) on delete set null,
  description text default '',
  explore_note text default '',
  image_url text default '',
  gallery jsonb not null default '[]'::jsonb,
  look jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ideas (
  id text primary key,
  title text not null,
  type text default 'Reference',
  access text not null default 'free' check (access in ('free', 'paid')),
  price numeric,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists idea_likes (
  idea_id text not null references ideas (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table if not exists idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id text not null references ideas (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists models (
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

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

insert into categories (id, label) values
  ('studio', 'Studios'),
  ('portfolio', 'Portfolio'),
  ('culture', 'Culture'),
  ('shop', 'Shops')
on conflict (id) do nothing;

insert into models (id, title, note, filename, src_url, sample) values
  ('sample-astronaut', 'Astronaut study', 'A classic spatial reference — orbit, light, and clean silhouette.', 'Astronaut.glb', 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', true),
  ('sample-robot', 'Robot expressive', 'Character form in the round — useful when you need presence, not polish.', 'RobotExpressive.glb', 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', true),
  ('sample-armstrong', 'Neil Armstrong', 'Figure study with a clear silhouette — good for scale and framing.', 'NeilArmstrong.glb', 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb', true)
on conflict (id) do nothing;
