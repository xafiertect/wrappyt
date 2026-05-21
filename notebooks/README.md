<p align="center">
  <h1 align="center">📓 YouTube Analytics ML Pipeline — Notebooks</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Jupyter-F37626?style=for-the-badge&logo=jupyter&logoColor=white" alt="Jupyter" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas" />
  <img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/XGBoost-2C8EBB?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" />
</p>

<p align="center">
  End-to-end data science pipeline — from raw YouTube CSV data to production-ready ML model exports.
</p>

---

## 📁 Directory Structure

```text
notebooks/
├── preparation/                             # Phase 1: Data Cleaning
│   └── prep_data.ipynb                      #   Raw data ingest, outlier removal, merge
│
├── feature_enginering/                      # Phase 2: Feature Engineering
│   ├── 02_feature_engineering_wildan.ipynb   #   Subscriber & growth metrics
│   ├── 03_feature_engineering_qiqi.ipynb     #   Engagement & retention features
│   ├── 04_feature_engineering_yusuf.ipynb    #   Content & duration features
│   ├── 05_feature_engineering_akmal.ipynb    #   Temporal & trend features
│   ├── 06_feature_engineering_zahra.ipynb    #   Revenue & monetization features
│   └── 07_feature_aggregation.ipynb         #   Merge all features → features_merged.csv
│
└── modelling/                               # Phase 3: Model Training
    ├── 08_model1_regression_views.ipynb      #   XGBoost regression (7d/14d/30d forecast)
    ├── 09_model2_timeseries_forecast.ipynb   #   Prophet time-series forecasting
    └── 10_model3_anomaly_detection.ipynb     #   Isolation Forest anomaly detection
```

---

## 🔄 Execution Pipeline

The notebooks must be executed in sequential order. Each phase feeds into the next.

```
Phase 1                    Phase 2                           Phase 3
┌──────────────┐    ┌────────────────────────┐    ┌──────────────────────────┐
│  prep_data   │───▶│  02 - 06 Feature Eng.  │───▶│  08 XGBoost Regression   │
│              │    │  07 Aggregation        │    │  09 Prophet Forecast     │
│  Raw CSV     │    │                        │    │  10 Isolation Forest     │
│  → Clean CSV │    │  → features_merged.csv │    │                          │
└──────────────┘    └────────────────────────┘    │  → models/*.pkl          │
                                                  │  → scalers/*.pkl         │
                                                  └──────────────────────────┘
```

### Phase 1 — Data Preparation

| Notebook | Input | Output | Description |
|---|---|---|---|
| `prep_data.ipynb` | Raw YouTube CSV files | `Data_Merged_Fix.csv` | Reads all raw data files, handles missing values, removes duplicates, aligns column names, and exports a unified clean dataset |

### Phase 2 — Feature Engineering

| Notebook | Contributor | Features Generated |
|---|---|---|
| `02_feature_engineering_wildan.ipynb` | Wildan | Subscriber growth rate, subscriber ratio metrics |
| `03_feature_engineering_qiqi.ipynb` | Qiqi | Engagement score, retention rate, interaction metrics |
| `04_feature_engineering_yusuf.ipynb` | Yusuf | Content duration analysis, watch-time efficiency |
| `05_feature_engineering_akmal.ipynb` | Akmal | Temporal trends, rolling averages, lag features |
| `06_feature_engineering_zahra.ipynb` | Zahra | Revenue estimation, monetization indicators |
| `07_feature_aggregation.ipynb` | All | Merges all feature CSVs → `features_merged.csv` |

### Phase 3 — Model Training

| Notebook | Model | Algorithm | Output Files |
|---|---|---|---|
| `08_model1_regression_views.ipynb` | View Forecaster | XGBoost Regressor | `model1_xgboost_*.pkl`, `scaler_model1.pkl` |
| `09_model2_timeseries_forecast.ipynb` | Time-Series | Prophet | `model2_prophet.pkl` |
| `10_model3_anomaly_detection.ipynb` | Anomaly Detector | Isolation Forest | `model3_isolation_forest.pkl`, `scaler_model3.pkl` |

---

## ⚙️ Environment Setup

### 1. Register Jupyter Kernel

To ensure notebooks use the same dependencies as the backend:

```bash
# Activate the project's virtual environment
source ../captonevenv/bin/activate

# Install Jupyter kernel support
pip install ipykernel

# Register the kernel
python -m ipykernel install --user --name=captonevenv --display-name "Python (captonevenv)"
```

### 2. Launch Jupyter

```bash
jupyter lab
```

> **Important:** When opening any notebook, select the **`Python (captonevenv)`** kernel from the kernel picker (top-right corner) before running cells.

---

## 📦 Exporting Models to Backend

After training is complete, copy the generated `.pkl` files to the backend service:

```bash
# From project root
cp notebooks/modelling/output/model1_*.pkl    backend/models/
cp notebooks/modelling/output/model3_*.pkl    backend/models/
cp notebooks/modelling/output/scaler_*.pkl    backend/scalers/
```

The backend's `model_loader.py` will automatically detect and load these files on server startup.
