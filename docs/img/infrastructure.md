# 🏗️ Dokumentasi Infrastruktur — Hippo Academy

Dokumen ini menjelaskan arsitektur deployment produksi menggunakan **Docker Compose** + **Caddy** sebagai reverse proxy dengan SSL otomatis di VPS.

---

## Gambaran Umum

```
Internet
   │
   ▼  :80 / :443
┌──────────────────────────────────────────┐
│              Caddy (Reverse Proxy)        │
│         Auto-HTTPS via Let's Encrypt      │
│                                          │
│   /api/* ──► backend:8000 (FastAPI)      │
│   /*      ──► frontend:80 (React/nginx)  │
└──────────────────────────────────────────┘
        │                   │
        ▼                   ▼
 ┌────────────┐       ┌────────────┐
 │  Backend   │       │  Frontend  │
 │  FastAPI   │       │ React+Vite │
 │  port 8000 │       │  port 80   │
 │ (internal) │       │ (internal) │
 └────────────┘       └────────────┘
        │
        ├── ./backend/models/   (*.pkl — di-mount, bukan baked ke image)
        ├── ./backend/scalers/  (*.pkl)
        ├── ./backend/data/     (hippo_kb.md, drafts.json — read-write)
        ├── ./backend/token_store.json  (YouTube OAuth token)
        └── ./data/processed/   (CSV hasil pipeline notebook)
```

---

## Stack Komponen

| Komponen | Image / Tech | Port Internal | Keterangan |
| :--- | :--- | :---: | :--- |
| **Caddy** | `caddy:2-alpine` | 80, 443 (publik) | Reverse proxy + HTTPS otomatis (Let's Encrypt) |
| **Backend** | Custom `backend/Dockerfile` | 8000 | FastAPI + ML inference, tidak expose ke publik |
| **Frontend** | Custom `frontend/Dockerfile` | 80 | React SPA yang di-serve nginx, tidak expose ke publik |

> **Catatan:** Backend dan Frontend **tidak** mempublikasikan port ke host secara langsung. Semua traffic masuk hanya lewat Caddy.

---

## Docker Compose (`docker-compose.yml`)

### Project Name
```yaml
name: hippo-academy
```

### Service: `caddy`
- Image: `caddy:2-alpine`
- Publish: `80:80` dan `443:443`
- Mount `Caddyfile` sebagai read-only
- Volume persisten `caddy_data` (sertifikat SSL) dan `caddy_config`
- Bergantung pada `backend` dan `frontend` sebelum start

### Service: `backend`
- Build dari `backend/Dockerfile` dengan context root `.`
- Baca environment dari `.env` (env_file)
- Mount penting:
  - `./backend/models` → `/app/backend/models` (read-only)
  - `./backend/scalers` → `/app/backend/scalers` (read-only)
  - `./backend/data` → `/app/backend/data` (read-write, untuk drafts CRUD)
  - `./backend/token_store.json` → `/app/backend/token_store.json` (YouTube OAuth)
  - `./data/processed` → `/app/data/processed`
  - `./data/cleaned` → `/app/data/cleaned` (read-only)
- Healthcheck: `GET /health` setiap 30 detik

### Service: `frontend`
- Build dari `frontend/Dockerfile`
- Build arg `VITE_API_URL=/api` — di-bake saat build, membuat semua request Axios hit `/api/*` (same-origin, di-proxy Caddy ke backend)

### Network
- Semua service dalam satu network `proxy` (bridge) — Caddy bisa reach backend & frontend secara internal

---

## Caddy (`Caddyfile`)

```
wrappyt.web.id {
    encode gzip

    handle_path /api/* {
        reverse_proxy backend:8000
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

- **`wrappyt.web.id`** — domain produksi, HTTPS otomatis via Let's Encrypt (A record harus pointing ke IP VPS)
- `/api/*` — strip prefix `/api` lalu proxy ke FastAPI
- `/*` — fallback ke React SPA

### Testing Tanpa Domain (HTTP Only)
Ganti blok domain dengan:
```
:80 {
    handle_path /api/* {
        reverse_proxy backend:8000
    }
    handle {
        reverse_proxy frontend:80
    }
}
```

---

## Deployment ke VPS

### Prasyarat
- VPS dengan Docker & Docker Compose terinstal
- A record domain sudah pointing ke IP VPS
- File `.env` sudah dikonfigurasi (salin dari `.env.example`)

### Langkah Deploy

```bash
# 1. Clone repository di VPS
git clone https://github.com/xafiertect/Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning.git
cd Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning

# 2. Siapkan environment
cp .env.example .env
nano .env  # isi GEMINI_API_KEY, YOUTUBE_CLIENT_ID, dll

# 3. Pastikan model *.pkl sudah ada (tidak di-commit ke git, harus di-copy manual)
ls backend/models/
ls backend/scalers/

# 4. Build & jalankan semua service
docker compose up -d --build

# 5. Cek status
docker compose ps
docker compose logs -f
```

### Update Aplikasi
```bash
git pull origin main
docker compose up -d --build
```

---

## Volume & Data Persisten

| Volume / Path | Tipe | Keterangan |
| :--- | :--- | :--- |
| `caddy_data` | Docker named volume | Sertifikat SSL Let's Encrypt — **jangan dihapus** |
| `caddy_config` | Docker named volume | Konfigurasi internal Caddy |
| `./backend/models/` | Bind mount (read-only) | File model ML (*.pkl) — harus di-copy manual ke VPS |
| `./backend/scalers/` | Bind mount (read-only) | File scaler preprocessing (*.pkl) |
| `./backend/data/` | Bind mount (read-write) | Knowledge base + drafts.json (persistensi user content) |
| `./backend/token_store.json` | Bind mount | Token OAuth YouTube — auto-generated saat pertama login |

---

## Environment Variables

Lihat tabel lengkap di [README utama](../README.md#-konfigurasi-environment-variables-env).

Variabel minimal yang harus diisi:

```env
GEMINI_API_KEY=your_key_here
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

---

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
| :--- | :--- | :--- |
| HTTPS tidak aktif | A record domain belum propagate | Tunggu propagasi DNS, cek `docker compose logs caddy` |
| Backend unhealthy | `*.pkl` tidak ditemukan | Pastikan `backend/models/` dan `backend/scalers/` sudah diisi |
| Frontend 502 Bad Gateway | Frontend container belum siap | `docker compose restart caddy` setelah frontend sehat |
| Token YouTube expired | `token_store.json` lama | Hapus file tersebut lalu login ulang via OAuth |

---

## Referensi

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Caddy Docs](https://caddyserver.com/docs/)
- [Dokumentasi Backend](../backend/workflow.md)
- [Dokumentasi Frontend](../frontend/workflow.md)
- [README Utama](../README.md)
