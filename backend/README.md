# 🚀 Hippo Academy — YouTube Prediction & Management Backend API

Layanan REST API backend berbasis **FastAPI** yang mengintegrasikan model Machine Learning prediksi performa YouTube dan deteksi anomali views, modul AI Consultation berbasis RAG Hippo Academy, serta fitur integrasi akun YouTube via OAuth 2.0.

---

## 📁 Struktur Direktori Backend

```text
backend/
├── main.py                    # Titik masuk utama aplikasi & konfigurasi lifespan
├── requirements.txt           # Dependensi Python lengkap
├── .env                       # File konfigurasi environment (tidak di-commit)
├── data/
│   ├── hippo_kb.md            # Knowledge base metodologi Hippo Academy untuk RAG
│   └── drafts.json            # Database lokal untuk draf video
├── schemas/
│   └── prediction.py          # Definisi schema Pydantic v2 untuk input/output API
├── routers/
│   ├── predict.py             # Endpoint prediksi XGBoost & Isolation Forest
│   ├── consultation.py        # Chatbot RAG Hippo Academy berbasis Gemini API
│   ├── auth.py                # Endpoint YouTube OAuth 2.0 (Login, Callback, Status)
│   ├── management.py          # CRUD Draf, generator thumbnail, dan optimal jam posting
│   ├── stats.py               # Penyaji statistik data video lokal (fallback)
│   └── history.py             # Riwayat pengujian prediksi
├── utils/
│   ├── model_loader.py        # Loader global model ML & Scaler dengan sistem fallback
│   ├── feature_engineering.py  # Rekayasa fitur on-the-fly untuk input ML
│   ├── youtube_oauth.py       # Helper integrasi OAuth token management
│   ├── youtube_api.py         # Wrapper YouTube Data & Analytics API dengan caching
│   └── rag.py                 # RAG Engine (retrieval & guardrail topik)
├── models/                    # Folder penyimpanan file model (*.pkl)
└── scalers/                   # Folder penyimpanan file scaler (*.pkl)
```

---

## 🛠️ Persiapan & Instalasi (Setup)

### 1. Aktifkan Virtual Environment
Aktifkan virtual environment yang sudah dibuat sebelumnya di root folder proyek:
* **Linux / macOS:**
  ```bash
  source ../captonevenv/bin/activate
  ```
* **Windows:**
  ```bash
  ..\captonevenv\Scripts\activate
  ```

### 2. Install Dependensi
Jalankan perintah ini di terminal dari dalam folder `backend`:
```bash
pip install -r requirements.txt
```

### 3. Konfigurasi Environment (`.env`)
Buat file bernama `.env` di dalam folder `backend` dan sesuaikan nilainya:
```env
APP_NAME="Hippo Academy — YouTube Analytics API"
APP_VERSION="2.0.0"
DEBUG=True

# Security
API_KEY="your-super-secret-api-key"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"

# Machine Learning Paths
MODEL_PATH="./models"
SCALER_PATH="./scalers"
DATA_PROCESSED_PATH="../data/processed"

# RAG & AI Consultation
GEMINI_API_KEY="ISI_GEMINI_API_KEY_ANDA"
GEMINI_MODEL="gemini-2.5-flash"
HIPPO_KB_PATH="./data/hippo_kb.md"

# YouTube OAuth 2.0
YOUTUBE_CLIENT_ID="ISI_CLIENT_ID_DARI_GOOGLE_CONSOLE"
YOUTUBE_CLIENT_SECRET="ISI_CLIENT_SECRET_DARI_GOOGLE_CONSOLE"
YOUTUBE_REDIRECT_URI="http://localhost:8000/auth/youtube/callback"
```

---

## 🚀 Menjalankan Server API

Jalankan perintah Uvicorn di terminal dari dalam folder `backend`:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server akan aktif dan dapat diakses di:
* **Base URL:** `http://localhost:8000`
* **Swagger UI Docs:** `http://localhost:8000/docs` (Gunakan dokumentasi ini untuk menguji endpoint secara interaktif)

---

## 🔌 Endpoint API Utama

### 1. Endpoint Prediksi (`/predict/`)
* **Metode:** `POST`
* **Deskripsi:** Menerima metrik performa mentah sebuah video, menghitung fitur *on-the-fly*, lalu memprediksi views 7, 14, 30 hari ke depan serta deteksi anomali views.

### 2. YouTube OAuth (`/auth/`)
* `GET /auth/youtube/login`: Mengarahkan user ke halaman consent Google untuk memberikan hak akses data YouTube.
* `GET /auth/youtube/callback`: Dipanggil secara otomatis oleh Google untuk menukar kode otentikasi menjadi token akses yang disimpan secara aman di `token_store.json`.
* `GET /auth/youtube/status`: Memeriksa apakah token YouTube yang valid sudah tersimpan.
* `GET /auth/youtube/channel`: Mengambil informasi dasar channel YouTube serta daftar video terbaru.
* `GET /auth/youtube/video/{video_id}/metrics`: Mengambil seluruh metrik internal real-time video tertentu dari YouTube Analytics API.

### 3. AI Consultation (`/consultation/chat`)
* **Metode:** `POST`
* **Deskripsi:** Chatbot AI interaktif berbasis RAG yang membaca pedoman optimasi Hippo Academy dari `hippo_kb.md` dengan model Gemini.
