# 📓 Notebooks — Panduan Menjalankan

## Prasyarat

1. **Python 3.10+** sudah terinstall.
2. **Virtual environment** (`venv`) sudah dibuat di root project:
   ```bash
   cd Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning
   python -m venv capstonevnv
   source capstonevnv/bin/activate   # Linux/macOS
   # atau: capstonevnv\Scripts\activate  # Windows
   ```
3. **Install dependencies**:
   ```bash
   pip install pandas numpy matplotlib seaborn scikit-learn xgboost lightgbm optuna statsmodels jupyter nbconvert
   ```

---

## Struktur Notebooks

| No | File | Pembuat | Deskripsi |
|----|------|---------|-----------|
| 0 | `make_raw_data.py` | — | Script untuk membuat `hippo_academy_raw.csv` dari `Data_Merged_Fix.csv`. **Jalankan pertama kali** sebelum notebook lain. |
| 0.5 | `youtube_analytics_preprocessing.ipynb` | — | Preprocessing data YouTube Analytics dari `data_raw_fix/`. Menghasilkan `data_ml_features.csv`. |
| 1 | `01_eda_qiqi.ipynb` | Qiqi | Exploratory Data Analysis: statistik deskriptif, distribusi views, korelasi, trend bulanan, CTR vs Views. |
| 2 | `02_feature_engineering_wildan.ipynb` | Wildan | **Growth Features**: daily growth rate, subscriber net, view velocity, rolling average views, growth acceleration. Output: `data/processed/features_growth.csv` |
| 3 | `03_feature_engineering_qiqi.ipynb` | Qiqi | **Engagement Features**: like rate, comment rate, retention proxy, engagement score. Output: `data/processed/features_engagement.csv` |
| 4 | `04_feature_engineering_yusuf.ipynb` | Yusuf | **CTR Impact Features**: impression-to-view rate, CTR normalized, CTR impression score, CTR category. |
| 5 | `05_feature_engineering_akmal.ipynb` | Akmal | **Time Decay & Feature Aggregation**: time decay weight, performance score aggregation. |
| 6 | `06_feature_engineering_zahra.ipynb` | Az-Zahrawani | **Revenue Features**: revenue per view, revenue per subscriber, monetization rate, avg revenue category. |
| 7 | `07_modeling_yusuf.ipynb` | Yusuf | **Predictive Modeling**: Logistic Regression, Random Forest, XGBoost + Optuna hyperparameter tuning. |

---

## Cara Menjalankan

### Opsi 1 — Satu per satu (Jupyter)

```bash
source ../capstonevnv/bin/activate
jupyter notebook
```

Buka notebook sesuai urutan (0 → 7).

### Opsi 2 — Jalankan semua otomatis (CLI)

Dari root project:

```bash
# 1. Aktifkan venv
source capstonevnv/bin/activate

# 2. Jalankan make_raw_data.py dulu
cd Model-Prediksi-dan-Diagnosa-Penurunan-Views-YouTube-Berbasis-Machine-Learning
cd notebooks
python make_raw_data.py
cd ..

# 3. Jalankan semua notebook
./run_notebooks.sh
```

Script `run_notebooks.sh` akan mengeksekusi semua `.ipynb` secara berurutan menggunakan `jupyter nbconvert --execute --inplace`.

### Opsi 3 — Jalankan notebook tertentu saja

```bash
source capstonevnv/bin/activate
jupyter nbconvert --to notebook --execute --inplace notebooks/01_eda_qiqi.ipynb
```

---

## Urutan Eksekusi yang Benar

```
make_raw_data.py
      ↓
youtube_analytics_preprocessing.ipynb
      ↓
01_eda_qiqi.ipynb
      ↓
02 → 06  (Feature Engineering, bisa paralel)
      ↓
07_modeling_yusuf.ipynb
```

> **Penting:** `make_raw_data.py` harus dijalankan lebih dulu karena notebook lain bergantung pada file `data/raw/hippo_academy_raw.csv` yang dihasilkannya.

---

## Output

- `data/raw/hippo_academy_raw.csv` — Data mentah hasil konversi
- `data/processed/features_growth.csv` — Fitur pertumbuhan
- `data/processed/features_engagement.csv` — Fitur engagement
- `data_raw_fix/data_ml_features.csv` — Fitur ML dari preprocessing
