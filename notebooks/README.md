# 📓 YouTube Analytics ML Pipeline — Jupyter Notebooks

Workspace penelitian dan pengembangan model Machine Learning (ML) untuk prediksi penonton (*views*) dan deteksi anomali performa video YouTube.

Seluruh notebook di sini dirancang untuk mengonsumsi dataset utama `Data_Merged_Fix.csv` di folder data.

---

## 📁 Struktur Direktori Notebooks

```text
notebooks/
├── preparation/              # Tahap Pembersihan Data
│   └── prep_data.ipynb       # Ingest data mentah, pembersihan outlier, dan merge awal
│
├── feature_enginering/       # Tahap Rekayasa Fitur (Standardisasi Input)
│   ├── 01_feature_engineering_wildan.ipynb
│   ├── 03_feature_engineering_qiqi.ipynb
│   ├── 05_feature_engineering_rizqi.ipynb
│   └── 06_feature_engineering_zahra.ipynb
│
└── modelling/                # Tahap Pelatihan Model ML
    ├── 08_model1_regression_views.ipynb  # Pelatihan Model 1 XGBoost untuk proyeksi 3 horizon
    ├── 09_model2_decline_detection.ipynb # Deteksi penurunan views dengan visualisasi SHAP
    └── 10_model3_anomaly_detection.ipynb # Deteksi anomali views menggunakan Isolation Forest
```

---

## ⚙️ Cara Menjalankan Notebooks

### 1. Registrasi Kernel Virtual Environment
Untuk memastikan Jupyter Notebook menggunakan dependensi yang sama dengan backend (dari virtual environment `captonevenv`), Anda wajib mendaftarkan kernel virtual environment terlebih dahulu:

1. Aktifkan virtual environment Anda:
   ```bash
   source ../captonevenv/bin/activate
   ```
2. Pasang modul `ipykernel`:
   ```bash
   pip install ipykernel
   ```
3. Daftarkan kernel dengan nama kustom:
   ```bash
   python -m ipykernel install --user --name=captonevenv --display-name "Python (captonevenv)"
   ```

### 2. Memulai Jupyter Lab / Notebook
Setelah kernel terdaftar, jalankan perintah berikut dari root folder proyek:
```bash
jupyter lab
```
Ketika membuka salah satu notebook di atas, pilih kernel **`Python (captonevenv)`** pada pojok kanan atas sebelum mengeksekusi cell.

---

## 🔄 Alur Eksekusi Notebooks

1. **Preparation (`preparation/prep_data.ipynb`)**:
   Membaca seluruh dataset mentah, menyelaraskan baris data, dan mengekspor dataset siap proses ke folder data.
2. **Feature Engineering (`feature_enginering/`)**:
   Menghitung rasio performa penting seperti CTR, skor retensi tontonan, serta rata-rata bergerak (*rolling mean*) 14 hari yang dibutuhkan oleh model prediksi.
3. **Modelling (`modelling/`)**:
   * Menjalankan training Model 1 (XGBoost) untuk memprediksi views 7, 14, dan 30 hari ke depan.
   * Mengekspor file model `.pkl` dan `scaler.pkl` ke folder `/backend/models` dan `/backend/scalers` agar dapat digunakan secara langsung oleh server backend.
