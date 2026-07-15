-- Check whether ANY auth users exist on this project
select id, email, email_confirmed_at, created_at
from auth.users
order by created_at desc
limit 20;
