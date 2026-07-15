# Deploy Athar’s Shelf on a VPS

Self-hosted stack (no Supabase):

| Service | Role |
|---------|------|
| **Postgres** | Sites, ideas, models, users, messages |
| **MinIO** | Object storage for covers / ideas / 3D GLBs (300MB) |
| **API** | Auth (JWT), CRUD, uploads |
| **Caddy** | Serves the Vite build + proxies `/api` and `/media` |

## 1. Server requirements

- Ubuntu 22.04+ (or similar)
- Docker + Docker Compose plugin
- DNS A record pointing at the VPS (for HTTPS)

## 2. Install Docker (Ubuntu)

```bash
sudo apt update
sudo apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out / in, then:
docker compose version
```

## 3. Ship the app

```bash
git clone <your-repo> athars-shelf
cd athars-shelf
cp .env.vps.example .env
nano .env   # set DOMAIN, passwords, JWT_SECRET
```

Important `.env` values:

```env
DOMAIN=shelf.yourdomain.com
POSTGRES_PASSWORD=...
JWT_SECRET=...          # openssl rand -hex 32
MINIO_ROOT_PASSWORD=...
ADMIN_EMAIL=atharqulimoon@gmail.com
ADMIN_PASSWORD=Roll#947131
MAX_UPLOAD_MB=300
VITE_API_URL=https://shelf.yourdomain.com
```

For production, set `VITE_API_URL` to the public origin (same host is fine: `https://shelf.yourdomain.com`).

## 4. Build frontend + start stack

```bash
npm install
# Point the browser build at your public API origin
export VITE_API_URL=https://shelf.yourdomain.com
npm run build

docker compose up -d --build
```

Open `https://shelf.yourdomain.com` (Caddy issues HTTPS when `DOMAIN` is a real hostname).

Local smoke test without DNS:

```env
DOMAIN=localhost
VITE_API_URL=http://localhost
```

Then `http://localhost`.

## 5. Admin login

On first API boot the admin user is created from env:

- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

## 6. Local development

Terminal A — data plane only:

```bash
docker compose up -d postgres minio minio-init api
```

Terminal B — Vite:

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

API: `http://localhost:4000/api/health`

## 7. Uploads / 300MB models

`MAX_UPLOAD_MB=300` is enforced by the API + multer. MinIO has no Supabase Free 50MB cap. Keep enough disk on the VPS for `minio_data`.

## 8. Backups

```bash
# Postgres dump
docker compose exec -T postgres pg_dump -U shelf athar_shelf > backup.sql

# MinIO data lives in the docker volume `minio_data`
docker volume ls | grep minio
```

## 9. Leaving Supabase / Vercel

- Point DNS at the VPS
- Stop relying on `VITE_SUPABASE_*`
- The `supabase/` SQL folder is legacy reference only — the live schema is `server/sql/schema.sql`
