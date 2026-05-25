# Deploy LearnIQ on Vercel + Neon PostgreSQL

This project deploys as **one Vercel app** (Next.js frontend + API routes). The database runs on **Neon**.

## 1. Create Neon database

1. Go to [neon.tech](https://neon.tech) and create a project.
2. Copy two connection strings from the Neon dashboard:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (non-pooler) → `DIRECT_URL`

Example:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

## 2. Deploy on Vercel

1. Push this repo to **GitHub**.
2. [vercel.com/new](https://vercel.com/new) → Import the repository.
3. **Root Directory:** `frontend` (required — includes `frontend/server` API + Prisma)
4. Framework: **Next.js** (auto-detected)
5. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL |
| `JWT_SECRET` | Long random secret |
| `GROQ_API_KEY` | Your Groq API key |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (your production URL) |

6. Click **Deploy**.

The build runs inside `frontend/` only:

- `npm run install:vercel` — installs deps + Prisma client in `frontend/server`
- `npm run build:vercel` — prepares API bundle, `prisma db push` on Neon, builds Next.js

After editing API code in repo `backend/`, sync before push:

```powershell
npm run sync:server
```

## 3. Seed the database (once)

After the first successful deploy, from your PC:

```powershell
cd C:\Users\VITTHAL\Downloads\learniq-main\frontend\server

$env:DATABASE_URL="your-neon-pooled-url"
$env:DIRECT_URL="your-neon-direct-url"
npm run db:seed
```

Demo login: `student@learniq.com` / `password123`

## 4. Verify

- App: `https://your-app.vercel.app`
- API health: `https://your-app.vercel.app/api/health`
- TKIET chatbot: `https://your-app.vercel.app/inquiry/public`

## Local development

**Option A — separate backend (default)**

```powershell
# Terminal 1
cd backend
# .env with DATABASE_URL + DIRECT_URL (can be same locally)
npm run dev

# Terminal 2
cd frontend
# .env: NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev
```

**Option B — API via Next.js only**

```powershell
cd frontend
# .env: DATABASE_URL, DIRECT_URL, GROQ_API_KEY, JWT_SECRET
# Do NOT set NEXT_PUBLIC_API_URL (uses /api)
npm run dev
```

## Neon + Vercel integration (optional)

In Vercel → **Storage** → Connect **Neon** — it can inject `DATABASE_URL` automatically. You still need to add `DIRECT_URL` manually from Neon (direct connection string).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Prisma `DIRECT_URL` missing | Add both Neon URLs in Vercel env |
| Build fails on `prisma db push` | Check Neon URLs and SSL (`?sslmode=require`) |
| API 404 on Vercel | Root Directory must be `frontend`; commit `frontend/server` to git |
| CORS errors | Set `FRONTEND_URL` to your exact Vercel URL |
| Chatbot offline | Set `GROQ_API_KEY` in Vercel |

## Architecture on Vercel

```
Browser → your-app.vercel.app
            ├── /           → Next.js pages
            └── /api/*      → Express API (serverless via pages/api)
            └── Neon        → PostgreSQL (Prisma)
```
