# NoidaHomes — Map-First Real Estate Platform

A full-stack, map-first real estate listings platform built with Next.js, Spring Boot, PostgreSQL/PostGIS, and Cloudinary — hosted entirely on **100% free tiers**.

---

## 🗺️ Deployment & Architecture Map

| Layer | Service / Provider | Where It Lives / URL | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | [Vercel Dashboard](https://vercel.com) | Auto-deploys on `git push origin main` |
| **Backend API** | **Render** | [Render Dashboard](https://dashboard.render.com) | Free Web Service (Docker container) |
| **Database** | **Supabase** | [Supabase Console](https://supabase.com) | PostgreSQL 17 + PostGIS (Mumbai `ap-south-1`) |
| **Image Storage**| **Cloudinary** | [Cloudinary Console](https://console.cloudinary.com) | 25 GB free tier, unsigned browser uploads |
| **Maps & Places**| **Google Cloud** | [Google Cloud Console](https://console.cloud.google.com) | Maps JavaScript API |
| **Repository** | **GitHub** | [`Harsh-Goel-1/map-listings`](https://github.com/Harsh-Goel-1/map-listings) | Monorepo (`frontend/` + `backend/`) |

---

## 🔑 Environment Variables & Configurations

### 1. Frontend (`frontend/.env.local` & Vercel Dashboard)
| Variable | Value / Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key |
| `NEXT_PUBLIC_API_URL` | Render backend URL (`https://<service>.onrender.com`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `iglsq1qi` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| `940d70bc-09e9-4017-b7da-2d95e716348c` (Unsigned) |

### 2. Backend (Render Dashboard > Environment)
| Variable | Value / Purpose |
| :--- | :--- |
| `DATABASE_URL` | `jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DATABASE_USERNAME` | `postgres.kmdtpmtzagoblmadfmuz` *(Pooler format)* |
| `DATABASE_PASSWORD` | Supabase DB Password |
| `PORT` | `8080` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,https://*.vercel.app` |

---

## ⚠️ Key Gotchas (Read This If Things Break!)

1. **Supabase IPv4 vs IPv6 on Render**:
   - Render's free tier **does not support IPv6**.
   - **Never** use `db.kmdtpmtzagoblmadfmuz.supabase.co` on Render — it causes `Network is unreachable`.
   - **Always** use the Supabase IPv4 Pooler: `aws-0-ap-south-1.pooler.supabase.com:5432` with username `postgres.kmdtpmtzagoblmadfmuz`.

2. **Render Cold Starts**:
   - The free backend spins down after 15 minutes of inactivity.
   - The first request after sleep takes ~30–50s to spin up.
   - *Fix (optional)*: Ping `https://<backend>/api/listings` every 10 mins using a free [UptimeRobot](https://uptimerobot.com) monitor.

3. **Admin Portal**:
   - Access via `/admin` on the website or the **`+ Add Property`** button in the top navbar.
   - Default password: `admin123`.

4. **PostGIS Extension**:
   - If resetting the database, run `CREATE EXTENSION IF NOT EXISTS postgis;` in the Supabase SQL editor before launching the backend.
   - `DataSeeder.java` auto-populates 22 sample Noida listings whenever the table is empty.

---

## 💻 Local Development

```bash
# Run Frontend (http://localhost:3000)
npm run dev

# Run Backend (http://localhost:8080)
npm run dev:backend
# or: cd backend && ./gradlew bootRun

# Production Build Test
npm run build
```
