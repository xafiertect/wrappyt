<p align="center">
  <h1 align="center">🦛 YouTube View Decline Diagnosis & Hippo Academy</h1>
</p>

<p align="center">
  <strong>AI-Powered YouTube Analytics · View Forecasting · Anomaly Detection · RAG Consultation</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/XGBoost-2C8EBB?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube API" />
</p>

---

## 📖 Project Overview

**YouTube View Decline Diagnosis & Hippo Academy** adalah platform AI full-stack yang dirancang untuk membantu kreator YouTube mendiagnosis penyebab penurunan performa (views) channel mereka secara ilmiah. Platform ini mengintegrasikan **Machine Learning** untuk peramalan views, **Deteksi Anomali** real-time, **YouTube OAuth 2.0 Integration**, serta **RAG AI Consultant** yang terhubung dengan basis pengetahuan Hippo Academy.

Proyek ini dibuat sebagai **Capstone Project** untuk memberikan solusi analitik cerdas yang dapat ditindaklanjuti oleh para kreator konten.

---

## 🎥 Video Demo & Testing

Berikut adalah demonstrasi aplikasi, alur integrasi YouTube OAuth, proses diagnosis machine learning, dan konsultasi AI berbasis RAG:

<p align="center">
  <video src="./docs/testing_video.mp4" controls width="100%" poster="./Screenshot_20260608_143942.png">
    browser Anda tidak mendukung tag video HTML5. Silakan tonton langsung melalui file <a href="./docs/testing_video.mp4">docs/testing_video.mp4</a>.
  </video>
</p>

> [!NOTE]
> *Jika video demo belum diputar, Anda dapat menambahkan rekaman layar pengujian ke dalam folder `docs/` dengan nama `testing_video.mp4`.*

---

## 📸 Application Screenshots (Galeri Dashboard)

<p align="center">
  <strong>1. Dashboard Utama & Status Prediksi Views</strong><br/>
  <img src="./Screenshot_20260608_143942.png" alt="Dashboard Panel" width="90%" style="border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>2. Analisis Anomali & Grafik Tren Multi-Horizon</strong><br/>
  <img src="./Screenshot_20260608_145045.png" alt="Analytics Panel" width="90%" style="border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" />
</p>

---

## ✨ Fitur Utama

| Fitur | Deskripsi | Teknologi |
| :--- | :--- | :--- |
| 📊 **Multi-Horizon Prediction** | Peramalan views untuk 7, 14, dan 30 hari ke depan untuk melihat potensi tren drop | XGBoost Regression |
| 🔍 **Anomaly Detection** | Deteksi otomatis penurunan views yang tidak wajar di luar tren musiman | Isolation Forest |
| 🤖 **RAG AI Consultant** | Konsultan AI interaktif yang dibatasi pada basis pengetahuan strategi pemulihan views | Google Gemini API + RAG |
| 🔗 **YouTube OAuth 2.0** | Sinkronisasi data performa channel kreator secara real-time langsung dari YouTube API | YouTube Data & Analytics API |
| 🎨 **Content Management** | Pengelolaan ide konten, draf naskah, analisis thumbnail, dan rekomendasi waktu upload | FastAPI CRUD + Pillow |

---

## 🏗️ Arsitektur Sistem

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  Dashboard · Analytics · AI Consultation · Content Management   │
│                          :5173                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (Axios)
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND (FastAPI)                        │
│                          :8000                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ /predict  │ │  /auth   │ │/consult  │ │ /manage  │            │
│  │ XGBoost  │ │ YouTube  │ │ Gemini   │ │  Drafts  │            │
│  │ IsoForest│ │ OAuth2.0 │ │  + RAG   │ │Thumbnail │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│         │            │            │                             │
│    models/*.pkl  YouTube API  hippo_kb.md                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   NOTEBOOKS (Data Science Pipeline)             │
│  Data Prep → Feature Engineering → Model Training → Export .pkl │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Struktur Proyek

```text
.
├── backend/                      # FastAPI REST API & ML Inference Engine
│   ├── routers/                  # Endpoint API (Prediction, Auth, Chat, Drafts)
│   ├── utils/                    # Logika Bisnis Utama (Model Loader, RAG, YouTube API)
│   ├── schemas/                  # Validasi data dengan Pydantic v2
│   ├── models/                   # Model regresi terlatih (*.pkl)
│   ├── scalers/                  # Scaler pre-processing data (*.pkl)
│   ├── data/                     # Knowledge base (hippo_kb.md) & database lokal
│   ├── main.py                   # Entrypoint Backend
│   └── requirements.txt          # Dependensi Python Backend
│
├── frontend/                     # React + Vite Single Page Application
│   ├── src/
│   │   ├── pages/                # Halaman UI (Dashboard, Analytics, Chat, Management)
│   │   ├── components/           # Komponen UI Reusable (Sidebar, Card, Alert)
│   │   └── services/api.js       # Klien HTTP Axios
│   └── package.json              # Dependensi Frontend
│
├── notebooks/                    # Pipeline Riset & Pelatihan Model (Jupyter)
│   ├── preparation/              # Pembersihan & penggabungan dataset
│   ├── feature_engineering/      # Ekstraksi fitur & transformasi data
│   └── modelling/                # Pelatihan, evaluasi XGBoost & ekspor model
│
├── docker-compose.yml            # Konfigurasi orkestrasi Docker multi-container
├── Caddyfile                     # Konfigurasi reverse proxy & SSL otomatis
├── requirements.txt              # Daftar dependensi utama root
└── README.md                     # ← Dokumen yang sedang Anda baca
```

---

## 🚀 Panduan Memulai (Quick Start)

### Persyaratan Sistem
* Python ≥ 3.10
* Node.js ≥ 18
* Docker & Docker Compose (Opsional, untuk produksi)

---

### Cara 1: Menjalankan dengan Docker Compose (Rekomendasi Produksi)

Kami telah menyediakan konfigurasi Docker lengkap beserta reverse proxy Caddy untuk deployment cepat:

1. Salin berkas lingkungan dan isi API Key Anda:
   ```bash
   cp .env.example .env
   ```
2. Jalankan aplikasi menggunakan docker-compose:
   ```bash
   docker compose up -d --build
   ```
3. Buka browser pada alamat `http://localhost` (Frontend) atau `http://localhost/api` (Backend).

---

### Cara 2: Menjalankan Secara Lokal (Development Mode)

#### 1. Setup Backend (FastAPI)
```bash
# Buat Virtual Environment
python -m venv captonevenv
source captonevenv/bin/activate # di Linux/macOS

# Instal Dependensi
pip install -r requirements.txt

# Jalankan Backend
cd backend
cp .env.example .env # Isi API Key Gemini Anda di berkas ini
uvicorn main:app --reload --port 8000
```

#### 2. Setup Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Buka **http://localhost:5173** di browser Anda.

---

## 🔑 Konfigurasi Environment Variables (`.env`)

| Variabel | Wajib | Keterangan |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | ✅ | Kunci API Google AI Studio untuk chatbot konsultasi RAG |
| `GEMINI_MODEL` | ❌ | Model Gemini yang digunakan (default: `gemini-1.5-flash`) |
| `YOUTUBE_CLIENT_ID` | ❌ | Client ID Google OAuth 2.0 untuk integrasi API YouTube |
| `YOUTUBE_CLIENT_SECRET` | ❌ | Client Secret Google OAuth 2.0 |

---

## 👥 Tim Kontributor

* **Rizqi Maulidiyah** - Project Lead & Developer
* **Wildan Taufiqurrahman** - Backend & ML Engineer
* **Akmal Goldi** - ML Engineer
* **Yusuf Al-Qodri** - ML Engineer
* **Zahra** - Frontend UI Developer

---

## 📄 Lisensi

Proyek ini dibangun untuk tujuan akademis sebagai **Tugas Akhir/Capstone Project**. Hak cipta dipegang oleh tim pengembang Capstone.
