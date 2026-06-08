# 🦛 YouTube View Decline Diagnosis & Hippo Academy

[![Python Version](https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-240750?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev)
[![YouTube API](https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://developers.google.com/youtube)

An end-to-end, enterprise-grade machine learning and RAG-powered analytics platform designed for YouTube creators to diagnose, forecast, and recover from view drops.

---

## 🎥 Demo & Testing Video

Below is the demo and testing video showing the platform in action, including real-time channel sync, predictive analytics, anomaly detection, and AI consultation:

<p align="center">
  <video src="docs/testing_video.mp4" width="100%" controls autoplay muted loop>
    Your browser does not support the video tag. Please download the video file at <code>docs/testing_video.mp4</code>.
  </video>
</p>

---

## 📸 Interface Preview

<p align="center">
  <img src="./Screenshot_20260608_143942.png" width="49%" alt="Dashboard Interface" />
  <img src="./Screenshot_20260608_145045.png" width="49%" alt="Analytics Panel" />
</p>

---

## 🚀 Key Features

*   📊 **Multi-Horizon View Forecasting**: Predict views for 7, 14, and 30 days ahead using tuned XGBoost regression models.
*   🔍 **Real-Time Anomaly Detection**: Automatically flag sudden, abnormal view drops using Isolation Forest.
*   📈 **Viral Probability Prediction**: Predict whether a video will go viral at 2-hour, 24-hour, and 48-hour horizons using relative velocity metrics.
*   🤖 **AI Consultant (RAG)**: Chat with a specialized AI advisor powered by Google Gemini, bounded to the Hippo Academy Knowledge Base (`backend/data/hippo_kb.md`).
*   🔗 **YouTube OAuth 2.0**: Sync channel metrics directly from YouTube Data and Analytics APIs.
*   🎨 **Thumbnail Optimizer & Planner**: Plan content drafts, schedule posts, and get AI-powered thumbnail feedback.

---

## 🧠 Machine Learning Engine

This platform utilizes 5 specialized models trained on YouTube performance datasets:

| Model | Algoritma Utama | Target Prediksi | Metrik Evaluasi |
| :--- | :--- | :--- | :--- |
| **M1: Views Regression** | XGBoost Regressor | Estimasi jumlah views (7, 14, 30 hari) | R², RMSE, MAE |
| **M2: Time-Series Forecast** | Prophet | Proyeksi tren views dengan confidence interval | MAPE, RMSE |
| **M3: Anomaly Detection** | Isolation Forest | Klasifikasi drop views tidak wajar (-1 / 1) | Precision, Recall, F1 |
| **M4: Root Cause Analysis** | Decision Tree + SHAP | Identifikasi penyebab penurunan utama | Accuracy, SHAP Values |
| **M5: Viral Survival** | Cox Proportional Hazard | Probabilitas viralitas relatif pada jam 2, 24, & 48 | C-Index, Brier Score |

---

## 🏗️ System Architecture

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

## 🗂️ Project Structure

```text
.
├── backend/                      # FastAPI REST API & ML Inference Engine
│   ├── routers/                  # API endpoints (predict, auth, consult, stats)
│   ├── utils/                    # Business logic (RAG, YouTube OAuth & APIs)
│   ├── models/                   # Serialized ML models (*.pkl)
│   ├── scalers/                  # Data scaling parameters
│   ├── data/                     # RAG Knowledge Base files
│   └── main.py                   # FastAPI application entry point
│
├── frontend/                     # React Single Page Application (SPA)
│   ├── src/pages/                # Dashboard, Analytics, Chat, Management views
│   ├── src/components/           # Reusable UI elements (metrics, cards, alerts)
│   └── src/index.css             # Premium custom CSS variables & styles
│
├── notebooks/                    # Research, Feature Engineering & Training Pipeline
│   ├── preparation/              # Data cleansing notebooks
│   ├── feature_engineering/      # Feature extraction pipelines
│   └── modelling/                # Training & evaluation scripts
│
├── docs/                         # Technical documentation & architecture guides
├── docker-compose.yml            # Multi-container orchestrator
└── Caddyfile                     # Production reverse proxy server configuration
```

---

## 🛠️ Installation & Setup

### Option 1: Local Development

#### Prerequisites
*   Python $\ge 3.10$
*   Node.js $\ge 18$

#### 1. Setup Backend
```bash
# Activate virtual environment
python -m venv captonevenv && source captonevenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables and configure them
cp .env.example .env

# Run FastAPI backend
cd backend
uvicorn main:app --reload --port 8000
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

### Option 2: Production Deployment (Docker Compose)

The production stack uses Docker Compose with Caddy as a reverse proxy, automatic SSL, and optimal routing:

```bash
# Clone the repository
git clone https://github.com/xafiertect/Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning.git
cd Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning

# Configure environment keys
cp .env.example .env

# Build and start services in detached mode
docker-compose up --build -d
```

Services are automatically mapped:
*   Frontend: [http://localhost](http://localhost) (with Nginx static compression)
*   Backend API Docs: [http://localhost/docs](http://localhost/docs) (served through reverse proxy)

---

## 🔑 Environment Variables Configuration

Ensure you create a `.env` file in the root directory with the following keys:

```ini
# --- General Config ---
PORT=8000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# --- YouTube OAuth ---
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:8000/auth/youtube/callback
```

---

## 📖 Sub-Module Documentation

For advanced features and developer-specific guides:
*   [Frontend Architecture & Styling Guide](./frontend/README.md)
*   [Backend Endpoints & API Reference](./backend/README.md)
*   [Data Science Notebooks & Modeling Guide](./notebooks/README.md)
*   [Docker & Deploy Strategy](./docs/docker.md)
