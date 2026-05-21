# 🚀 Hippo Academy — YouTube Prediction & Management Backend API

Repositori ini berisi layanan Backend berbasis **FastAPI** yang mengintegrasikan model Machine Learning prediksi performa YouTube dan deteksi anomali views, modul AI Consultation berbasis RAG (Retrieval-Augmented Generation) Hippo Academy, serta fitur manajemen pembuatan konten (drafts, thumbnail generator, posting schedule).

---

## 📁 Struktur Direktori Backend

```text
backend/
├── main.py                    # Titik masuk utama aplikasi & konfigurasi lifespan
├── requirements.txt           # Dependensi Python lengkap
├── .env                       # File konfigurasi environment (tidak di-commit)
├── .env.example               # Template contoh variabel environment
├── data/
│   ├── hippo_kb.md            # Knowledge base metodologi Hippo Academy untuk RAG
│   └── drafts.json            # Database penyimpanan draf video (in-memory file-based persistence)
├── schemas/
│   └── prediction.py          # Definisi schema Pydantic v2 untuk input/output API
├── routers/
│   ├── predict.py             # Endpoint prediksi XGBoost (3-horizon) & Isolation Forest
│   ├── consultation.py        # Chatbot RAG Hippo Academy berbasis Gemini API
│   ├── management.py          # CRUD Draf, generator thumbnail Gemini, jam posting optimal
│   ├── stats.py               # Agregat statistik channel dari CSV processed notebook
│   └── history.py             # History endpoint
├── utils/
│   ├── __init__.py
│   ├── model_loader.py        # Loader global model ML & Scaler dengan sistem fallback
│   ├── feature_engineering.py  # Proses kalkulasi fitur on-the-fly untuk input ML
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
* **Windows (Git Bash / Command Prompt):**
  ```bash
  source ../captonevenv/Scripts/activate
  ```

### 2. Install Dependensi
Jalankan instalasi pustaka yang dibutuhkan dari dalam folder `backend`:
```bash
pip install -r requirements.txt
```

### 3. Konfigurasi Environment (`.env`)
Salin berkas `.env.example` menjadi `.env` lalu lengkapi variabel berikut:
```env
APP_NAME="Hippo Academy API"
APP_VERSION="2.0.0"
DEBUG=True

# Konfigurasi Model
MODEL_PATH="./models"
SCALER_PATH="./scalers"
DATA_PROCESSED_PATH="../data/processed"

# RAG & AI Consultation
GEMINI_API_KEY="isi_dengan_gemini_api_key_anda"
HIPPO_KB_PATH="./data/hippo_kb.md"
```

---

## ⚙️ Integrasi Model Machine Learning

Backend ini mendukung dua jenis model loading secara cerdas:
1. **Multi-Horizon XGBoost Prediction (Rekomendasi):** Menggunakan `model1_xgboost_7d.pkl`, `model1_xgboost_14d.pkl`, dan `model1_xgboost_30d.pkl`.
2. **Single Model Fallback:** Jika versi multi-horizon tidak ada, loader akan otomatis mencari `model1_xgboost_regression.pkl` dan menggunakannya untuk ketiga horizon prediksi agar API tidak mengalami crash.
3. **Isolation Forest (Anomaly Detection):** Menggunakan `model3_isolation_forest.pkl` dan scaler pendukung `scaler_model3.pkl`.

> **Catatan Penting:** Pastikan semua file `.pkl` hasil training dipindahkan dari direktori notebook ke dalam folder `backend/models/` dan `backend/scalers/` sebelum server dijalankan.

---

## 🚀 Menjalankan Server API

Gunakan Uvicorn untuk menjalankan server pengembangan lokal:
```bash
uvicorn main:app --reload
```

Server akan aktif dan dapat diakses di:
* **Base URL:** `http://localhost:8000`
* **Swagger UI Docs:** `http://localhost:8000/docs` (Sangat disarankan untuk interaksi pengujian endpoint)
* **Redoc UI Docs:** `http://localhost:8000/redoc`

---

## 🔌 Endpoint API Utama

### 1. Endpoint Prediksi (`/predict/`)
* **Metode:** `POST`
* **Deskripsi:** Menerima metrik performa mentah sebuah video, melakukan perhitungan fitur *on-the-fly* (CTR, durasi tonton detik, retensi, skor interaksi), mengembalikan proyeksi *views* 7, 14, 30 hari ke depan, mendeteksi apakah terjadi anomali penurunan, dan menyusun saran aksi (*actionable recommendation*).
* **Payload Input:**
  ```json
  {
    "views": 12500,
    "ctr": 2.8,
    "impressions": 446000,
    "avg_view_duration": "00:02:45",
    "video_duration": "00:10:00",
    "likes": 420,
    "comments": 85,
    "retention_rate": 27.5,
    "subscriber_gained": 34,
    "video_age_days": 3,
    "lag_views_7d": 11000.0,
    "rolling_mean_views_14d": 10500.0
  }
  ```

### 2. AI Consultation Chat (`/consultation/chat`)
* **Metode:** `POST`
* **Deskripsi:** Chatbot AI interaktif terintegrasi Gemini API. Dilengkapi sistem **RAG** untuk membaca knowledge base Hippo Academy (`hippo_kb.md`) dan **guardrail sistem ketat** yang otomatis menolak pertanyaan di luar topik YouTube/Hippo Academy.
* **Payload Input:**
  ```json
  {
    "message": "Bagaimana cara membuat hook 10 detik pertama yang efektif?",
    "history": [],
    "channel_stats": {
      "avg_ctr": 2.8,
      "avg_retention": 27.5,
      "recent_views_drop": true,
      "total_videos": 12
    }
  }
  ```

### 3. Manajemen Draf Video (`/management/drafts`)
* **Metode:** `GET` / `POST` / `PUT` / `DELETE`
* **Deskripsi:** Operasi CRUD lengkap draf pembuatan video (judul, outline skrip, ide konsep thumbnail, rencana posting) dengan persistensi penyimpanan file lokal otomatis (`backend/data/drafts.json`).

### 4. Saran Thumbnail Otomatis (`/management/thumbnail/suggest`)
* **Metode:** `POST`
* **Deskripsi:** Menerima rencana judul dan jenis video kreator, lalu menggunakan Gemini untuk memberikan rekomendasi komposisi desain, palet warna hex, teks overlay pendek, dan ekspresi wajah yang terbukti menaikkan CTR secara ilmiah.

### 5. Jadwal Posting Optimal (`/management/schedule/optimal-hours`)
* **Metode:** `GET`
* **Deskripsi:** Mengembalikan slot hari dan jam WIB terbaik untuk rilis konten lengkap dengan skor optimalitas dan justifikasi alasan analitisnya.
