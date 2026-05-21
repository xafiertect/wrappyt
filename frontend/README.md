# 🚀 Hippo Academy — Frontend Web Dashboard

Dashboard antarmuka pengguna interaktif yang dirancang menggunakan **React.js** dan **Vite** untuk melakukan prediksi performa video YouTube, mendiagnosis anomali penurunan views, dan melakukan konsultasi interaktif dengan AI Hippo Academy.

---

## 📁 Struktur Folder Frontend

```text
frontend/
├── public/                    # Aset publik statis (logo, gambar)
├── src/
│   ├── components/            # Komponen UI yang dapat digunakan kembali
│   │   ├── MetricCard.jsx     # Card statistik CTR, Views, dll.
│   │   ├── AnomalyAlert.jsx   # Banner peringatan jika terdeteksi anomali views
│   │   ├── Navbar.jsx         # Bar navigasi utama
│   │   └── ConsultationChat.jsx # Chat container untuk konsultasi AI
│   ├── pages/                 # Halaman utama aplikasi
│   │   ├── Dashboard.jsx      # Panel input metrik, visualisasi grafik, dan sync YouTube
│   │   ├── Consult.jsx        # Halaman chat dengan AI Consultant Hippo Academy
│   │   └── Management.jsx     # Halaman manajemen draf & ide konten video
│   ├── services/
│   │   └── api.js             # Client Axios & registrasi endpoint API Backend
│   ├── App.jsx                # Konfigurasi rute halaman (React Router v6)
│   ├── index.css              # Sistem styling CSS global (glassmorphism & dark mode)
│   └── main.jsx               # Entry point untuk render DOM React
├── package.json               # Dependensi npm & skrip pelaksana
└── vite.config.js             # Konfigurasi Vite
```

---

## 🛠️ Instalasi & Menjalankan Aplikasi

### 1. Install Node.js Dependencies
Jalankan perintah berikut di terminal dari dalam folder `frontend`:
```bash
npm install
```

### 2. Jalankan Server Development Lokal
Jalankan server Vite untuk membuka dashboard di localhost:
```bash
npm run dev
```

Dashboard akan aktif dan dapat diakses melalui browser Anda di alamat:
👉 **`http://localhost:5173`**

---

## 💡 Fitur Unggulan & Cara Penggunaan

### 1. Integrasi Akun YouTube (OAuth 2.0)
* **Kondisi A (Belum Login / Default)**: 
  * Dashboard akan menampilkan tombol **"Login dengan YouTube"** (jika kredensial Google di `.env` backend sudah terisi).
  * Pengguna dapat memilih video dari **Video Sampel (Dataset Lokal)** atau memasukkan ID video secara manual untuk melakukan simulasi data performa.
* **Kondisi B (Terhubung)**:
  * Dashboard menampilkan status terhubung, avatar channel, nama channel, serta jumlah subscriber terkini secara real-time.
  * Terdapat dropdown dinamis berisi daftar video terbaru dari channel YouTube Anda. Memilih video di dropdown ini akan otomatis memanggil metrik internal (CTR, views, durasi tonton, impresi) dari YouTube Analytics API untuk dimasukkan ke form prediksi.

### 2. Prediksi & Deteksi Anomali
* Mengisi atau menyinkronkan data video ke form input di sebelah kanan.
* Klik tombol **"Prediksi Sekarang"** untuk mengirim data ke model ML backend.
* Hasil proyeksi tren views (7, 14, 30 hari ke depan) akan ditampilkan dalam bentuk grafik area, lengkap dengan badge indikator performa (`Viral` / `Normal` / `Declining`) dan teks rekomendasi aksi.

### 3. Konsultasi AI Hippo Academy
* Navigasi ke menu **Konsultasi AI**.
* Pengguna dapat berdiskusi secara interaktif mengenai optimasi channel dengan asisten AI yang telah dilengkapi *guardrail* (hanya menjawab topik seputar YouTube).
