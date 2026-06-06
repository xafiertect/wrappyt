# Rules: Tambah Thumbnail Video di Halaman Analitik

## Tujuan
Menampilkan thumbnail YouTube di setiap baris tabel video pada halaman `Analytics.jsx`.

---

## Data Source
- Setiap video dari API sudah memiliki field `video_id` (contoh: `zI6bTJxFX3A`).
- URL thumbnail YouTube dibangun dari `video_id` tanpa perlu perubahan backend:

| Kualitas | URL Pattern | Ukuran |
|---|---|---|
| `mqdefault` | `https://img.youtube.com/vi/{video_id}/mqdefault.jpg` | 320×180 (4:3 crop) |
| `hqdefault` | `https://img.youtube.com/vi/{video_id}/hqdefault.jpg` | 480×360 |
| `default`   | `https://img.youtube.com/vi/{video_id}/default.jpg`   | 120×90  |

Gunakan **`mqdefault`** — cukup jelas, loading cepat.

---

## Perubahan File
**File yang diubah:** `frontend/src/pages/Analytics.jsx`  
**File lain:** tidak ada perubahan.

---

## Spesifikasi Implementasi

### 1. Kolom Judul (td pertama)
Ubah cell `Judul Video` dari:
```
[Judul teks]
[video_id kecil]
```
Menjadi layout horizontal:
```
[Thumbnail] | [Judul teks]
             | [video_id kecil]
```

### 2. Layout Thumbnail
- Gunakan `flexbox` dengan `gap: '0.75rem'` dan `alignItems: 'center'`
- Thumbnail: `<img>` dengan ukuran `width: 96px, height: 54px` (rasio 16:9)
- Style: `borderRadius: 6`, `objectFit: 'cover'`, `flexShrink: 0`
- Border: `1px solid var(--border-glass)` agar sesuai dark theme

### 3. Fallback jika Thumbnail Gagal Load
- Tambahkan `onError` pada `<img>` → ganti `src` ke placeholder abu-abu
- Placeholder: `https://via.placeholder.com/96x54/1a1a2e/666?text=No+Thumb`
- Atau bisa gunakan inline SVG placeholder

### 4. Lebar Kolom
- Kolom `Judul Video` di `<th>` perlu diperlebar: tambahkan `minWidth: 280` atau `width: '35%'`
- Untuk menghindari overflow, tetap gunakan `maxWidth: 300` pada `<td>` tapi dengan `overflow: visible` di container flex

### 5. Skeleton Loading
- `TableSkeleton` saat ini menggunakan div dengan tinggi 48px
- Naikkan menjadi **height: 64px** agar sesuai dengan baris berthumbnail

### 6. Tidak Ada Perubahan Backend
- Tidak perlu perubahan API, endpoint, atau data model
- Thumbnail URL dibuat langsung di frontend dari `video_id`

---

## Batasan / Constraints
- Jangan ubah kolom lain (Views, CTR, Status, Upload, Anomali)
- Jangan tambah state baru yang tidak perlu
- Thumbnail hanya tampil jika `video_id` tidak kosong/null
- Tidak perlu lazy-loading kompleks; browser native lazy load cukup: `loading="lazy"`

---

## Urutan Eksekusi
1. Edit `Analytics.jsx` → baris 340–346 (cell `Judul`)
2. Update skeleton height (baris 26) dari 48 → 64
3. Test: jalankan `npm run dev` di `/frontend`, buka `localhost:5173/analytics`
4. Verifikasi: thumbnail tampil, tidak break layout, fallback bekerja saat video_id invalid
