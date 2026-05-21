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
  <img src="https://img.shields.io/badge/XGBoost-2C8EBB?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube API" />
</p>

---

**YouTube View Decline Diagnosis & Hippo Academy** is a full-stack AI-powered platform that helps **YouTube creators** understand, predict, and recover from views drops. It combines **multi-horizon view forecasting** (XGBoost), **real-time anomaly detection** (Isolation Forest), **YouTube OAuth 2.0 channel integration**, and a **RAG-powered AI consultant** (Google Gemini) — all wrapped in a premium dark-mode dashboard.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📊 **Multi-Horizon Prediction** | Forecast views for 7, 14, and 30 days using trained XGBoost regression models |
| 🔍 **Anomaly Detection** | Instantly flag abnormal views drops with Isolation Forest |
| 🔗 **YouTube OAuth 2.0** | Connect your YouTube channel directly to pull real-time analytics |
| 🤖 **AI Consultant (RAG)** | Chat with Gemini-powered assistant backed by Hippo Academy knowledge base |
| 🎨 **Thumbnail Generator** | AI-driven thumbnail composition, color palette, and overlay suggestions |
| 📅 **Posting Schedule** | Data-driven optimal upload time recommendations |
| 📝 **Draft Management** | Full CRUD system for planning video ideas, scripts, and publication dates |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  Dashboard · Analytics · AI Consultation · Content Management   │
│                          :5173                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (Axios)
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND (FastAPI)                         │
│                          :8000                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ /predict  │ │  /auth   │ │/consult  │ │ /manage  │           │
│  │ XGBoost  │ │ YouTube  │ │ Gemini   │ │  Drafts  │           │
│  │ IsoForest│ │ OAuth2.0 │ │  + RAG   │ │Thumbnail │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│         │            │            │                              │
│    models/*.pkl  YouTube API  hippo_kb.md                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   NOTEBOOKS (Data Science Pipeline)              │
│  Data Prep → Feature Engineering → Model Training → Export .pkl  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```text
.
├── backend/                      # FastAPI REST API & ML inference engine
│   ├── routers/                  #   API endpoint modules
│   │   ├── predict.py            #     XGBoost regression + Isolation Forest
│   │   ├── auth.py               #     YouTube OAuth 2.0 flow
│   │   ├── consultation.py       #     Gemini RAG chatbot
│   │   ├── management.py         #     Draft CRUD + thumbnail + schedule
│   │   ├── stats.py              #     Channel statistics aggregation
│   │   └── history.py            #     Prediction history
│   ├── utils/                    #   Core business logic
│   │   ├── model_loader.py       #     ML model & scaler loader with fallback
│   │   ├── feature_engineering.py#     On-the-fly feature computation
│   │   ├── youtube_oauth.py      #     OAuth token lifecycle management
│   │   ├── youtube_api.py        #     YouTube Data/Analytics API wrapper
│   │   └── rag.py                #     RAG retrieval + topic guardrail
│   ├── schemas/prediction.py     #   Pydantic v2 request/response schemas
│   ├── models/                   #   Trained model files (*.pkl)
│   ├── scalers/                  #   Scaler files (*.pkl)
│   ├── data/                     #   Knowledge base & local data
│   ├── main.py                   #   Application entry point
│   └── requirements.txt          #   Python dependencies
│
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── pages/                #   View components
│   │   │   ├── Dashboard.jsx     #     Main prediction & YouTube sync panel
│   │   │   ├── Analytics.jsx     #     Channel-level analytics charts
│   │   │   ├── Consultation.jsx  #     AI consultation chat interface
│   │   │   └── Management.jsx    #     Draft & content planning manager
│   │   ├── components/           #   Reusable UI components
│   │   │   ├── Sidebar.jsx       #     Navigation sidebar
│   │   │   ├── MetricCard.jsx    #     KPI metric display card
│   │   │   └── AnomalyAlert.jsx  #     Anomaly detection banner
│   │   ├── services/api.js       #   Axios API client
│   │   ├── App.jsx               #   Root component & router config
│   │   ├── index.css             #   Global design system
│   │   └── main.jsx              #   React DOM entry point
│   └── package.json              #   Node.js dependencies
│
├── notebooks/                    # Jupyter research & training pipeline
│   ├── preparation/              #   Data cleaning & merging
│   ├── feature_enginering/       #   Feature extraction & transformation
│   └── modelling/                #   Model training, evaluation & export
│
├── data/                         # Raw & processed datasets
├── docs/                         # Technical documentation & workflow guides
├── captonevenv/                  # Python virtual environment (git-ignored)
└── README.md                     # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| pip | latest |

### 1. Clone & Setup

```bash
git clone https://github.com/xafiertect/Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning.git
cd Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning
```

### 2. Backend

```bash
python -m venv captonevenv && source captonevenv/bin/activate
cd backend && pip install -r requirements.txt
cp .env.example .env     # ← fill in your API keys
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key for AI Consultant |
| `GEMINI_MODEL` | ❌ | Gemini model name (default: `gemini-2.5-flash`) |
| `YOUTUBE_CLIENT_ID` | ❌ | Google OAuth 2.0 Client ID for YouTube integration |
| `YOUTUBE_CLIENT_SECRET` | ❌ | Google OAuth 2.0 Client Secret |
| `YOUTUBE_REDIRECT_URI` | ❌ | OAuth callback URL (default: `http://localhost:8000/auth/youtube/callback`) |

---

## 📖 Documentation

| Module | Guide |
|---|---|
| **Frontend** | [frontend/README.md](./frontend/README.md) |
| **Backend** | [backend/README.md](./backend/README.md) |
| **Notebooks** | [notebooks/README.md](./notebooks/README.md) |

---

## 📄 License

This project was built as a **Capstone Project** for academic purposes.
