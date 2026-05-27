"""
Router: /stats
==============
Endpoint statistik agregat channel berdasarkan data processed dari notebook.
Membaca model_output_*.csv yang dihasilkan pipeline ML.
"""

import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/stats", tags=["Statistics"])

DATA_DIR = os.getenv("DATA_PROCESSED_PATH", "../data/processed")


def _read_csv_safe(filename: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return pd.DataFrame()
    return pd.read_csv(path)


@router.get("/")
async def get_stats():
    """Ringkasan statistik agregat dari semua output model."""
    regression_df = _read_csv_safe("model_output_regression.csv")
    anomaly_df    = _read_csv_safe("model_output_anomaly.csv")

    stats = {}

    if not regression_df.empty:
        stats["regression"] = {
            "total_videos": len(regression_df),
            "avg_predicted_views_7d":  round(regression_df["pred_7d"].mean(), 0) if "pred_7d" in regression_df else None,
            "avg_predicted_views_30d": round(regression_df["pred_30d"].mean(), 0) if "pred_30d" in regression_df else None,
        }

    if not anomaly_df.empty:
        total = len(anomaly_df)
        anomaly_count = int(anomaly_df["anomaly_label_model"].sum()) if "anomaly_label_model" in anomaly_df else 0
        stats["anomaly"] = {
            "total_records": total,
            "anomaly_count": anomaly_count,
            "anomaly_rate_pct": round(anomaly_count / total * 100, 2) if total > 0 else 0,
        }

    if not stats:
        return {
            "message": "Data statistik belum tersedia. Jalankan pipeline notebook terlebih dahulu.",
            "data": {}
        }

    return {"status": "ok", "data": stats}


@router.get("/youtube-videos")
async def get_youtube_videos(limit: int = 15):
    """Daftar video sampel dari abis_cleaning.csv untuk pengisian otomatis."""
    csv_path = "../data/cleaned/abis_cleaning.csv"
    if not os.path.exists(csv_path):
        return {"data": []}
    try:
        df = pd.read_csv(csv_path)
        # Select first few rows with necessary columns
        subset = df[["video_id", "judul_video"]].head(limit)
        return {"data": subset.to_dict(orient="records")}
    except Exception as e:
        return {"data": [], "error": str(e)}


@router.get("/youtube-sync")
async def sync_youtube_video(video_id_or_url: str):
    """Mengambil metrik video dari abis_cleaning.csv berdasarkan video_id atau URL."""
    # Extract video_id from URL if needed
    video_id = video_id_or_url
    if "youtube.com" in video_id_or_url or "youtu.be" in video_id_or_url:
        import re
        patterns = [
            r"(?:v=|\/v\/|embed\/|youtu.be\/|\/shorts\/)([^&\?\n]+)"
        ]
        for pattern in patterns:
            match = re.search(pattern, video_id_or_url)
            if match:
                video_id = match.group(1)
                break

    csv_path = "../data/cleaned/abis_cleaning.csv"
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset abis_cleaning.csv tidak ditemukan.")

    try:
        df = pd.read_csv(csv_path)
        # Find video by ID
        row = df[df["video_id"] == video_id]
        
        if row.empty:
            # Fallback: Pick a random video or first video so that any user-input video ID works seamlessly
            row = df.head(1)
            is_fallback = True
        else:
            is_fallback = False

        record = row.iloc[0]
        
        # Format average view duration (e.g. "0:03:37" -> "00:03:37")
        raw_avg = str(record.get("rata_rata_durasi_tonton", "00:03:00"))
        parts = raw_avg.split(":")
        if len(parts) == 2:
            avg_duration = f"00:{parts[0].zfill(2)}:{parts[1].zfill(2)}"
        elif len(parts) == 3:
            avg_duration = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}:{parts[2].zfill(2)}"
        else:
            avg_duration = "00:03:00"

        # Format video duration in seconds (e.g. 541.0 seconds -> "00:09:01")
        try:
            total_seconds = int(float(record.get("durasi", 600)))
            hrs = total_seconds // 3600
            mins = (total_seconds % 3600) // 60
            secs = total_seconds % 60
            video_duration = f"{str(hrs).zfill(2)}:{str(mins).zfill(2)}:{str(secs).zfill(2)}"
        except:
            video_duration = "00:10:00"

        # Calculate lag views and rolling mean safely
        lag_views = int(record.get("ts1_views", record.get("penayangan", 10000) * 0.8))
        rolling_mean = int(record.get("ts2_views", record.get("penayangan", 10000) * 0.9))

        return {
            "status": "success",
            "is_fallback": is_fallback,
            "video_title": record.get("judul_video", "Video Baru"),
            "metrics": {
                "views": int(record.get("penayangan", 15000)),
                "ctr": float(record.get("rasio_klik_tayang_dari_tayangan", 5.0)),
                "impressions": int(record.get("tayangan", 200000)),
                "avg_view_duration": avg_duration,
                "video_duration": video_duration,
                "likes": int(record.get("suka", 500)),
                "comments": int(record.get("komentar_ditambahkan", 120)),
                "retention_rate": float(record.get("persentase_penayangan_rata_rata", 35.0)),
                "subscriber_gained": int(record.get("subscriber_yang_diperoleh", 50)),
                "video_age_days": 5, # Default standard age
                "lag_views_7d": lag_views,
                "rolling_mean_views_14d": rolling_mean
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses data video: {str(e)}")


@router.get("/anomalies")
async def get_anomalies(limit: int = 20):
    """Daftar video yang terdeteksi anomali (penurunan mendadak)."""
    anomaly_df = _read_csv_safe("model_output_anomaly.csv")
    if anomaly_df.empty:
        return {"data": [], "message": "Data anomaly belum tersedia."}

    if "anomaly_label_model" not in anomaly_df.columns:
        raise HTTPException(status_code=500, detail="Kolom anomaly_label_model tidak ditemukan di CSV.")

    anomalies = anomaly_df[anomaly_df["anomaly_label_model"] == 1].head(limit)
    return {"data": anomalies.to_dict(orient="records"), "count": len(anomalies)}


@router.get("/forecast")
async def get_forecast(limit: int = 30):
    """Data forecast Prophet — 30 hari ke depan dengan confidence interval."""
    forecast_df = _read_csv_safe("model_output_forecast.csv")
    if forecast_df.empty:
        return {"data": [], "message": "Data forecast belum tersedia."}

    return {"data": forecast_df.tail(limit).to_dict(orient="records")}


@router.get("/videos")
async def get_videos_analytics(limit: int = 50):
    """
    Daftar lengkap video dengan status, CTR, anomaly flag, dan tanggal publish.
    Menggabungkan abis_cleaning.csv + model_output_anomaly.csv + model_output_regression.csv.
    """
    base_path = os.path.join(os.path.dirname(DATA_DIR), "cleaned", "abis_cleaning.csv")

    if not os.path.exists(base_path):
        return {"data": [], "message": "Data abis_cleaning.csv tidak tersedia."}

    try:
        base_df = pd.read_csv(base_path)
        anomaly_df = _read_csv_safe("model_output_anomaly.csv")
        regression_df = _read_csv_safe("model_output_regression.csv")

        # Pilih kolom yang dibutuhkan dari dataset utama
        cols_needed = [c for c in ["video_id", "judul_video", "waktu_publikasi_video",
                                   "penayangan_tak_dilewati", "penayangan",
                                   "rasio_klik_tayang_dari_tayangan"] if c in base_df.columns]
        df = base_df[cols_needed].copy()

        # Normalisasi kolom views (bisa pakai penayangan_tak_dilewati atau penayangan)
        if "penayangan_tak_dilewati" in df.columns:
            df["views"] = df["penayangan_tak_dilewati"].fillna(df.get("penayangan", 0)).fillna(0).astype(int)
        elif "penayangan" in df.columns:
            df["views"] = df["penayangan"].fillna(0).astype(int)
        else:
            df["views"] = 0

        df["ctr"] = df["rasio_klik_tayang_dari_tayangan"].fillna(0.0).astype(float) if "rasio_klik_tayang_dari_tayangan" in df.columns else 0.0
        df["date"] = df["waktu_publikasi_video"].fillna("").astype(str) if "waktu_publikasi_video" in df.columns else ""
        df["title"] = df["judul_video"].fillna("Video").astype(str) if "judul_video" in df.columns else "Video"

        # Gabung dengan anomaly data
        if not anomaly_df.empty and "video_id" in anomaly_df.columns and "anomaly_label_model" in anomaly_df.columns:
            df = df.merge(anomaly_df[["video_id", "anomaly_label_model", "anomaly_score"]],
                          on="video_id", how="left")
        else:
            df["anomaly_label_model"] = 0
            df["anomaly_score"] = 0.0

        df["anomaly"] = df["anomaly_label_model"].fillna(0).astype(int) == 1

        # Gabung dengan regression output untuk views_predicted
        if not regression_df.empty and "video_id" in regression_df.columns and "views_predicted" in regression_df.columns:
            df = df.merge(regression_df[["video_id", "views_predicted"]], on="video_id", how="left")
            df["views_predicted"] = df["views_predicted"].fillna(df["views"])
        else:
            df["views_predicted"] = df["views"]

        # Tentukan status berdasarkan CTR + anomaly + views
        # Konsisten dengan Hippo Academy 2-jam rule di /predict:
        #   Viral: CTR > 7% atau views > 50k
        #   Normal: CTR 3-7% (borderline)
        #   Tidak Viral: CTR < 3% atau terdeteksi anomali
        def derive_status(row):
            if row["anomaly"] or row["ctr"] < 3.0:
                return "Tidak Viral"
            if row["ctr"] > 7.0 or row["views"] > 50000:
                return "Viral"
            return "Normal"

        df["status"] = df.apply(derive_status, axis=1)

        # Format output
        result = df[["video_id", "title", "views", "ctr", "date", "status", "anomaly", "anomaly_score"]]\
            .head(limit)\
            .to_dict(orient="records")

        return {"data": result, "total": len(df)}

    except Exception as e:
        return {"data": [], "error": str(e), "message": "Gagal memuat data video analytics."}


