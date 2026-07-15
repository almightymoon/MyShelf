-- Run in SQL Editor for project zvopkmghtflbpymsejcc
-- 1) Confirm Athar's email so login works
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'atharqulimoon@gmail.com';

-- 2) Ensure admin profile (safe if tables already exist)
insert into public.profiles (id, email, name, role)
select id, lower(email), coalesce(raw_user_meta_data->>'name', 'Athar Iqbal'), 'admin'
from auth.users
where lower(email) = 'atharqulimoon@gmail.com'
on conflict (id) do update
  set role = 'admin',
      email = excluded.email;

-- 3) Quick proof
select id, email, email_confirmed_at is not null as confirmed
from auth.users
where lower(email) = 'atharqulimoon@gmail.com';
