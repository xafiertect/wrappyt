<p align="center">
  <h1 align="center">⚡ Hippo Academy — Frontend Dashboard</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Axios-1.7-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
  <img src="https://img.shields.io/badge/Recharts-2.13-22B5BF?style=for-the-badge&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/CSS3-Custom-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
</p>

<p align="center">
  Premium dark-mode dashboard for YouTube view prediction, anomaly detection, and AI-powered content consultation.
</p>

---

## 📁 Directory Structure

```text
frontend/
├── public/                          # Static assets
├── src/
│   ├── components/                  # Reusable UI building blocks
│   │   ├── Sidebar.jsx              #   Left navigation bar with route links
│   │   ├── MetricCard.jsx           #   Animated KPI card (views, CTR, etc.)
│   │   └── AnomalyAlert.jsx         #   Alert banner for detected anomalies
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── Dashboard.jsx            #   Main hub — prediction form, YouTube sync,
│   │   │                            #   chart visualization, recommendation panel
│   │   ├── Analytics.jsx            #   Channel-wide performance analytics
│   │   ├── Consultation.jsx         #   AI chat interface (Gemini + RAG)
│   │   └── Management.jsx           #   Video draft CRUD, thumbnail ideas,
│   │                                #   optimal posting schedule
│   │
│   ├── services/
│   │   └── api.js                   #   Centralized Axios client — all API calls
│   │
│   ├── App.jsx                      #   Route definitions (React Router v6)
│   ├── index.css                    #   Global design tokens & glassmorphism styles
│   └── main.jsx                     #   ReactDOM entry point
│
├── package.json                     # Dependencies & scripts
└── vite.config.js                   # Vite dev server & proxy config
```

---

## 🛠️ Setup & Installation

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at **http://localhost:5173**

> **Note:** The backend API must be running at `http://localhost:8000` for all features to work correctly.

---

## 🖥️ Pages & Features

### 📊 Dashboard (`/`)

The primary workspace for video performance analysis.

| Section | Description |
|---|---|
| **YouTube Sync** | Connect your YouTube account via OAuth or select a sample video from the local dataset |
| **Metric Input Form** | 12 input fields mapped to ML model features (CTR, impressions, retention, etc.) |
| **Prediction Results** | Visualizes 7/14/30-day view forecasts as area chart with status badge |
| **Anomaly Alert** | Inline banner when Isolation Forest detects abnormal view decline |
| **Recommendation** | Actionable tips generated from prediction context |

### 📈 Analytics (`/analytics`)

Channel-level aggregate statistics and trend visualizations sourced from the processed CSV dataset.

### 🤖 Consultation (`/consult`)

Interactive chat interface powered by Google Gemini API with RAG retrieval from the Hippo Academy knowledge base. Includes conversation history management and channel stats personalization.

### 📝 Management (`/management`)

Content planning suite:
- **Video Drafts** — Create, edit, and track video ideas through Draft → Ready → Scheduled → Published workflow
- **Thumbnail Suggestions** — AI-generated thumbnail concepts with color palettes and composition tips
- **Optimal Schedule** — Data-driven best times to publish content (day + hour + score)

---

## 🔗 API Integration

All backend communication is handled through `src/services/api.js`. Key endpoints:

```javascript
// Prediction
api.post('/predict/', payload)

// YouTube OAuth
api.get('/auth/youtube/status')
api.get('/auth/youtube/channel')
api.get('/auth/youtube/video/{id}/metrics')

// AI Consultation
api.post('/consultation/chat', { message, history, channel_stats })

// Management
api.get('/management/drafts')
api.post('/management/thumbnail/suggest', { video_title, content_type })
api.get('/management/schedule/optimal-hours')
```

---

## 🎨 Design System

The UI uses a custom CSS design system defined in `index.css`:

- **Color Palette:** Deep navy/slate backgrounds with cyan and violet accent colors
- **Glass Effect:** Semi-transparent panels with `backdrop-filter: blur()`
- **Typography:** System font stack optimized for readability
- **Animations:** Smooth hover transitions and fade-in effects for cards and charts
- **Responsive:** Flexbox-based layout that adapts to different screen widths
