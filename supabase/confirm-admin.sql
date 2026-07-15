-- Create + confirm Athar as admin on THIS project (zvopkmghtflbpymsejcc)
-- Prefer: Dashboard → Authentication → Users → Add user → Create new user
--   Email: atharqulimoon@gmail.com
--   Password: Roll#947131
--   Auto Confirm User: ON
--
-- If the user already exists unconfirmed, this confirms + promotes:

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'atharqulimoon@gmail.com';

insert into public.profiles (id, email, name, role)
select id, lower(email), coalesce(raw_user_meta_data->>'name', 'Athar Iqbal'), 'admin'
from auth.users
where lower(email) = 'atharqulimoon@gmail.com'
on conflict (id) do update
  set role = 'admin',
      email = excluded.email;

-- Proof: should show 1 row with confirmed = true
select id, email, (email_confirmed_at is not null) as confirmed
from auth.users
where lower(email) = 'atharqulimoon@gmail.com';
