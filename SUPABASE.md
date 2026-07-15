# Supabase setup — Athar’s Shelf

Uploads, shelf data, likes, comments, and auth now live in Supabase (not browser storage).

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) → New project  
2. Open **Project Settings → API**  
3. Copy **Project URL** and **anon public** key  

## 2. Env file

```bash
cp .env.example .env
```

Fill in (Vite requires the `VITE_` prefix — `process.env.SUPABASE_*` won’t reach the browser):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

Restart the Vite dev server after saving `.env`.

### Vercel

Connecting Supabase in Vercel does **not** automatically give Vite `VITE_*` names. The integration usually syncs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`

This app’s `vite.config.js` maps those into the client at build time. After changing env vars, **redeploy**.

Optional: in Vercel → Project → Settings → Environment Variables, also add:

```
VITE_SUPABASE_URL=…same URL…
VITE_SUPABASE_ANON_KEY=…same publishable/anon key…
```

Then redeploy.

## 3. Run the schema

In the Supabase dashboard → **SQL Editor** → New query:

1. Paste the full contents of `supabase/schema.sql`  
2. Run it  

That creates tables, RLS policies, the public `media` storage bucket (150MB), seed categories, starter sites/ideas, and sample 3D models.

## 4. Admin account

Sign up (or create a user in **Authentication → Users**) with:

- Email: `atharqulimoon@gmail.com`  
- Password: your choice (same as before if you want: `Roll#947131`)

A trigger promotes that email to `profiles.role = 'admin'`.

**Tip:** For local testing, turn off email confirmation under **Authentication → Providers → Email** → disable “Confirm email”.

## 5. Auth & storage notes

| Action | Who |
|--------|-----|
| Read sites / ideas / models | Anyone |
| Publish / edit / delete / upload | Admin only |
| Like / comment | Signed-in members |
| Contact form | Anyone (inbox visible to admin) |
| Download free idea pins / models | Members (paid pins → request via contact) |

Files upload to Storage bucket `media` under `covers/`, `gallery/`, `ideas/`, and `models/`.

## 6. Verify

1. `npm run dev` — banner gone when `.env` is set  
2. Log in as admin → Admin panel appears  
3. Publish a site or upload a model  
4. Open the shelf in another browser / incognito — content should match  

Without `.env`, the app falls back to local demo data and shows a setup banner.
