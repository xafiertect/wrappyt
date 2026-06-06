


<p align="center">
  <h1 align="center">🚀 Hippo Academy — Backend API</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Pydantic-v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic" />
  <img src="https://img.shields.io/badge/XGBoost-1.7-2C8EBB?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Scikit--Learn-1.3-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/YouTube_API-v3-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube" />
</p>

<p align="center">
  FastAPI-based REST API serving ML inference, YouTube OAuth integration, RAG-powered AI consultation, and content management features.
</p>

---

## 📁 Directory Structure

```text
backend/
├── main.py                        # Application entry point & lifespan config
├── requirements.txt               # Python dependencies
├── .env                           # Environment variables (git-ignored)
├── .env.example                   # Template for .env setup
│
├── routers/                       # API endpoint modules
│   ├── predict.py                 #   POST /predict/ — XGBoost + Isolation Forest
│   ├── auth.py                    #   GET  /auth/youtube/* — OAuth 2.0 flow
│   ├── consultation.py            #   POST /consultation/chat — Gemini RAG chatbot
│   ├── management.py              #   CRUD /management/* — Drafts, Thumbnails, Schedule
│   ├── stats.py                   #   GET  /stats/* — Channel statistics
│   └── history.py                 #   GET  /history/* — Prediction history
│
├── schemas/
│   └── prediction.py              # All Pydantic v2 request/response models
│
├── utils/                         # Core business logic
│   ├── model_loader.py            #   Model & scaler loader with smart fallback
│   ├── feature_engineering.py     #   On-the-fly feature computation (12 → 20+ features)
│   ├── youtube_oauth.py           #   Token save/load/refresh/revoke lifecycle
│   ├── youtube_api.py             #   YouTube Data API v3 & Analytics API v2 wrapper
│   └── rag.py                     #   RAG retrieval engine + topic guardrail
│
├── models/                        # Trained model pickles (*.pkl)
├── scalers/                       # Trained scaler pickles (*.pkl)
├── encoders/                      # Label encoder pickles (*.pkl)
└── data/
    ├── hippo_kb.md                # Hippo Academy knowledge base for RAG
    └── drafts.json                # Local draft storage (file-based persistence)
```

---

## 🛠️ Setup & Installation

### 1. Virtual Environment

```bash
# From project root
python -m venv captonevenv
source captonevenv/bin/activate          # Linux/macOS
# captonevenv\Scripts\activate           # Windows
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# ─── Required ───────────────────────────────
GEMINI_API_KEY="your-google-ai-studio-key"

# ─── Optional: YouTube OAuth ────────────────
YOUTUBE_CLIENT_ID="your-google-oauth-client-id"
YOUTUBE_CLIENT_SECRET="your-google-oauth-client-secret"
YOUTUBE_REDIRECT_URI="http://localhost:8000/auth/youtube/callback"

# ─── Optional: Model Configuration ──────────
GEMINI_MODEL="gemini-2.5-flash"
MODEL_PATH="./models"
SCALER_PATH="./scalers"
```

### 4. Run Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

| URL | Description |
|---|---|
| `http://localhost:8000` | API Base URL |
| `http://localhost:8000/docs` | Swagger UI (interactive API explorer) |
| `http://localhost:8000/redoc` | ReDoc documentation |

---

## 🔌 API Reference

### Prediction Engine

#### `POST /predict/`

Accepts raw video metrics, computes derived features on-the-fly, and returns multi-horizon view forecasts with anomaly detection.

<details>
<summary>📥 Request Body</summary>

```json
{
  "views": 15000,
  "ctr": 4.5,
  "impressions": 200000,
  "avg_view_duration": "00:03:30",
  "video_duration": "00:10:00",
  "likes": 500,
  "comments": 120,
  "retention_rate": 35.0, uvicorn main:app --reload --port 8000
  "subscriber_gained": 50,
  "video_age_days": 5,
  "lag_views_7d": 12000,
  "rolling_mean_views_14d": 11000
}
```

</details>

<details>
<summary>📤 Response</summary>

```json
{
  "status": "Tidak Viral",
  "confidence": 0.62,
  "is_viral": false,
  "predicted_views": {
    "days_1": 12500,
    "days_2": 13200,
    "days_3": 13800,
    "chart_data": []
  },
  "anomaly": {
    "is_anomaly": false,
    "anomaly_score": 0.125,
    "label": "Normal"
  },
  "recommendation": "CTR di bawah 3% — redesign thumbnail..."
}
```
> **Hippo Academy 2-jam rule**: `status` ditentukan dari kecepatan views per 2 jam pertama — `Viral` (≥2.000), `Normal` (1.000–1.999), `Tidak Viral` (<1.000). Field `is_viral` adalah boolean shorthand dari status = "Viral".

</details>

---

### YouTube OAuth 2.0

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/youtube/login` | Redirects to Google consent screen |
| `GET` | `/auth/youtube/callback` | Handles OAuth code exchange → token storage |
| `GET` | `/auth/youtube/status` | Check authentication state |
| `GET` | `/auth/youtube/channel` | Fetch channel info + recent videos list |
| `GET` | `/auth/youtube/video/{video_id}/metrics` | Pull real-time analytics for a specific video |
| `POST` | `/auth/youtube/logout` | Revoke token and clear session |

---

### AI Consultation (RAG)

#### `POST /consultation/chat`

<details>
<summary>📥 Request Body</summary>

```json
{
  "message": "Bagaimana cara meningkatkan CTR thumbnail?",
  "history": [],
  "channel_stats": {
    "avg_ctr": 2.8,
    "avg_retention": 27.5,
    "recent_views_drop": true,
    "total_videos": 12
  }
}
```

</details>

<details>
<summary>📤 Response</summary>

```json
{
  "reply": "Berdasarkan data channel Anda dengan CTR 2.8%...",
  "context_used": true,
  "is_off_topic": false
}
```

</details>

---

### Content Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/management/drafts` | List all video drafts |
| `POST` | `/management/drafts` | Create new draft |
| `PUT` | `/management/drafts/{id}` | Update existing draft |
| `DELETE` | `/management/drafts/{id}` | Delete draft |
| `POST` | `/management/thumbnail/suggest` | AI thumbnail composition suggestions |
| `GET` | `/management/schedule/optimal-hours` | Best posting times with scores |

---

## ⚙️ ML Model Loading

The backend uses a **smart fallback** system for model loading at startup:

```
Priority 1: Multi-horizon models
  ├── model1_xgboost_7d.pkl
  ├── model1_xgboost_14d.pkl
  └── model1_xgboost_30d.pkl

Priority 2: Single model fallback
  └── model1_xgboost_regression.pkl  (used for all 3 horizons)

Anomaly Detection:
  ├── model3_isolation_forest.pkl
  └── scaler_model3.pkl
```

> **Important:** Copy all `.pkl` files from the notebooks output into `backend/models/` and `backend/scalers/` before starting the server.
