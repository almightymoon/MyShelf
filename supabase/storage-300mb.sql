-- Raise media bucket limit to 300MB (run once in SQL Editor)
update storage.buckets
set file_size_limit = 314572800,
    public = true
where id = 'media';

-- Proof
select id, public, file_size_limit
from storage.buckets
where id = 'media';
