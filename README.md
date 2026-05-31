# Cars AI Platform

AI-powered marketplace for buying **Indian cars** — browse, get smart recommendations, and place orders. Built with React, Express, and Supabase.

```
Cars-AI-Platform/
├── fn/                  # Frontend — React + Vite (deploy to Vercel)
├── bn/                  # Backend  — Express + Supabase client (deploy to Railway)
└── supabase-schema.sql  # Database schema (run once in Supabase SQL editor)
```

## Features

- Browse 12+ popular Indian cars (Maruti, Tata, Mahindra, Hyundai, Kia, Toyota…)
- Filter by brand, fuel type, body type
- Detailed car pages with specs, features, and **Buy Now** flow
- 🤖 **AI Assistant** — Llama 3.3 70B (open source, via Groq) grounded on your catalog
- Works **with or without** Supabase (falls back to in-memory data)
- Works **with or without** Groq (falls back to rule-based chat)

---

## Local Development

### 1. Backend (`bn/`)

```bash
cd bn
cp .env.example .env       # leave Supabase blank to use in-memory data
npm install
npm run dev                # http://localhost:4000
```

### 2. Frontend (`fn/`)

```bash
cd fn
npm install
npm run dev                # http://localhost:5173 (proxies /api → :4000)
```

Open `http://localhost:5173` — that's it.

---

## AI Setup (Groq + Llama — free)

1. Sign up at https://console.groq.com (no credit card)
2. Create an API key at https://console.groq.com/keys
3. Add to `bn/.env`:
   ```
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
4. Restart the backend. The chat will now use Llama 3.3 70B, grounded on your car catalog.

Swap to other open models by changing `GROQ_MODEL`: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`, etc.

---

## Supabase Setup (optional but recommended)

1. Create a project at https://supabase.com
2. Open the SQL editor and run [`supabase-schema.sql`](./supabase-schema.sql)
3. In `bn/.env` fill in:
   ```
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Seed sample cars:
   ```bash
   cd bn && npm run seed
   ```

---

## Deployment

### Backend → Railway
1. `railway init` inside `bn/` (or connect the repo via the Railway UI)
2. Set env vars in Railway: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (your Vercel URL)
3. Railway auto-detects `railway.json` and runs `npm start`

### Frontend → Vercel
1. `vercel` inside `fn/` (or import the repo)
2. Set env var `VITE_API_URL` = your Railway backend URL (e.g. `https://your-app.up.railway.app`)
3. Vercel uses `vercel.json` — Vite framework preset, SPA rewrites

---

## API

| Method | Path                       | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/cars`                | List cars (filter: brand, fuel_type…)    |
| GET    | `/api/cars/filters`        | Distinct brand / fuel / body lists       |
| GET    | `/api/cars/:id`            | Get car details                          |
| POST   | `/api/cars/:id/buy`        | Place an order                           |
| POST   | `/api/ai/recommend`        | Structured recommendations               |
| POST   | `/api/ai/chat`             | Natural-language car search              |

---

## Tech Stack

- **Frontend** — React 18, React Router, Vite
- **Backend** — Node 18+, Express, Supabase JS
- **Database** — Supabase (Postgres)
- **Hosting** — Vercel (FE) + Railway (BE)
