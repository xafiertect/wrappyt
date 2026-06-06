"""
Router: /consultation
=====================
AI Chat endpoint berbasis Gemini API dengan RAG Hippo Academy.
Konteks dibatasi HANYA pada topik YouTube & Hippo Academy (lihat rules.md R2.1).
"""

import os
import logging
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import ConsultationRequest, ConsultationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/consultation", tags=["AI Consultation"])

# --- System Instruction (Hippo Academy Guardrail) ----------------------------
SYSTEM_INSTRUCTION = """Kamu adalah AI engineer yang membangun sistem Hippo Academy — platform analitik YouTube berbasis machine learning untuk channel Hippo Academy.

Kamu tahu sistem ini dari dalam: dataset 2.356 video, model XGBoost untuk prediksi views, Isolation Forest untuk deteksi anomali, Prophet untuk time-series forecast, dan classifier untuk risiko penurunan views. Semua angka yang kamu sebut harus dari data nyata yang ada di konteks.

GAYA BICARA:
- Natural dan mengalir, seperti ngobrol dengan teman yang ahli — bukan bullet point kaku
- Boleh pakai markdown (bold, list) tapi jangan overuse, sesuaikan dengan kompleksitas pertanyaan
- Kalau pertanyaannya santai, jawab santai. Kalau teknis, jawab teknis
- Gunakan "kamu" bukan "Anda" kecuali konteksnya formal
- Jangan buka dengan "Tentu saja!" atau "Baik!" — langsung ke inti

SCOPE YANG DIJAWAB (luas):
- Analitik YouTube: views, CTR, retensi, subscriber, revenue, engagement
- Strategi konten: ide topik, riset, hook, pacing, script, thumbnail
- Optimasi channel: jadwal upload, SEO judul/deskripsi/tag, komunitas
- Data & model: cara kerja XGBoost prediksi views, Isolation Forest, Prophet forecast
- Produksi video: editing rhythm, B-roll, struktur narasi
- Platform & algoritma: cara kerja rekomendasi YouTube, Shorts, tren
- Bisnis kreator: monetisasi, brand deal, niche positioning
- Pertanyaan teknis tentang sistem Hippo Academy ini

SATU-SATUNYA YANG DITOLAK:
Pertanyaan yang benar-benar tidak ada kaitan sama sekali dengan konten, kreator, data, atau platform digital (misal: resep masakan, cuaca, politik, kesehatan). Tolak dengan santai, satu kalimat, tanpa drama.

CARA GUNAKAN DATA:
- Kalau ada angka relevan di konteks, sebutkan — ini bedain kamu dari AI biasa
- Kalau tidak ada data spesifik, jawab berdasarkan prinsip umum tapi tetap practical
- Jangan ada disclaimer panjang. Kalau tidak tahu, bilang tidak tahu langsung."""


# --- Live Channel Stats (dari processed CSV) ---------------------------------
_live_stats_cache: dict = {}


def _load_live_stats() -> dict:
    """Baca statistik live dari model output CSV. Di-cache setelah pertama kali dimuat."""
    global _live_stats_cache
    if _live_stats_cache:
        return _live_stats_cache

    try:
        import pandas as pd

        _project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_dir = os.path.join(_project_root, "data")

        base_path = os.path.join(data_dir, "cleaned", "abis_cleaning.csv")
        anom_path = os.path.join(data_dir, "processed", "model_output_anomaly.csv")
        decl_path = os.path.join(data_dir, "processed", "model_output_decline.csv")
        reg_path  = os.path.join(data_dir, "processed", "model_output_regression.csv")

        if not os.path.exists(base_path):
            return {}

        base  = pd.read_csv(base_path)
        views = pd.to_numeric(base["penayangan"], errors="coerce").fillna(0)
        ctr   = pd.to_numeric(base["rasio_klik_tayang_dari_tayangan"], errors="coerce").fillna(0)
        ret   = pd.to_numeric(base["persentase_penayangan_rata_rata"], errors="coerce").fillna(0)

        total     = len(base)
        viral     = int((views >= 100_000).sum())
        normal    = int(((views >= 20_000) & (views < 100_000)).sum())
        not_viral = int((views < 20_000).sum())

        stats = {
            "total_videos":    total,
            "viral_count":     viral,
            "viral_pct":       round(viral / total * 100, 1),
            "normal_count":    normal,
            "tidak_viral_count": not_viral,
            "avg_views":       round(float(views.mean()), 0),
            "median_views":    round(float(views.median()), 0),
            "max_views":       int(views.max()),
            "avg_ctr":         round(float(ctr.mean()), 2),
            "avg_retention":   round(float(ret.mean()), 2),
        }

        # --- Upload pattern per hari & bulan ---------------------------------
        day_map = {0:"Senin", 1:"Selasa", 2:"Rabu", 3:"Kamis",
                   4:"Jumat", 5:"Sabtu", 6:"Minggu"}
        month_map = {1:"Januari", 2:"Februari", 3:"Maret", 4:"April",
                     5:"Mei", 6:"Juni", 7:"Juli", 8:"Agustus",
                     9:"September", 10:"Oktober", 11:"November", 12:"Desember"}

        date_col = "tanggal_upload" if "tanggal_upload" in base.columns else "waktu_publikasi_video"
        base["_tgl"] = pd.to_datetime(base[date_col], errors="coerce")
        base["_views"] = views
        df_dated = base.dropna(subset=["_tgl"])

        if len(df_dated) > 50:
            df_dated = df_dated.copy()
            df_dated["_hari"] = df_dated["_tgl"].dt.dayofweek.map(day_map)
            df_dated["_bulan"] = df_dated["_tgl"].dt.month.map(month_map)

            per_hari = df_dated.groupby("_hari").agg(
                jumlah=("video_id", "count"),
                avg_views=("_views", "mean"),
                viral=("_views", lambda x: int((x >= 100_000).sum()))
            ).round({"avg_views": 0})
            per_hari["avg_views"] = per_hari["avg_views"].astype(int)
            per_hari = per_hari.reindex(list(day_map.values())).dropna(how="all")

            per_bulan = df_dated.groupby("_bulan")["video_id"].count()
            per_bulan = per_bulan.reindex(list(month_map.values())).dropna()

            stats["upload_per_hari"] = {
                h: {
                    "jumlah": int(row["jumlah"]),
                    "avg_views": int(row["avg_views"]),
                    "viral": int(row["viral"]),
                }
                for h, row in per_hari.iterrows()
                if not pd.isna(row["jumlah"])
            }
            stats["upload_per_bulan"] = {b: int(n) for b, n in per_bulan.items()}
            stats["hari_terbanyak_upload"] = per_hari["jumlah"].idxmax()
            stats["hari_avg_views_tertinggi"] = per_hari["avg_views"].idxmax()
            stats["total_dengan_tanggal"] = len(df_dated)

        if os.path.exists(anom_path):
            anom = pd.read_csv(anom_path)
            stats["anomaly_count"] = int(anom["anomaly_label_model"].sum())
            stats["anomaly_pct"]   = round(stats["anomaly_count"] / total * 100, 1)

        if os.path.exists(decl_path):
            decl = pd.read_csv(decl_path)
            if "risk_level" in decl.columns:
                rc = decl["risk_level"].value_counts().to_dict()
                stats["decline_critical"] = rc.get("Critical", 0)
                stats["decline_high"]     = rc.get("High Risk", 0)
                stats["decline_low"]      = rc.get("Low Risk", 0)

        if os.path.exists(reg_path):
            reg = pd.read_csv(reg_path)
            if "views" in reg.columns and "views_predicted" in reg.columns:
                err = abs(reg["views"] - reg["views_predicted"]) / reg["views"].replace(0, 1)
                stats["regression_mape"] = round(float(err.mean()) * 100, 1)

        _live_stats_cache = stats
        logger.info(f"[Consultation] Live stats dimuat: {total} video")

    except Exception as e:
        logger.warning(f"[Consultation] Gagal muat live stats: {e}")

    return _live_stats_cache


def _build_live_stats_context() -> str:
    """Format live stats menjadi teks konteks untuk Gemini."""
    s = _load_live_stats()
    if not s:
        return ""

    def fmt(val, fmt_spec=None):
        if val == "---" or val is None:
            return "---"
        if fmt_spec == "comma_int" and isinstance(val, (int, float)):
            return f"{int(val):,}"
        if fmt_spec == "comma_float" and isinstance(val, (int, float)):
            return f"{val:,.0f}"
        return str(val)

    lines = [
        "Data Live Channel Hippo Academy (dari dataset nyata):",
        f"- Total video dianalisis: {s.get('total_videos', '---')}",
        f"- Viral (>=100k): {s.get('viral_count', '---')} video ({s.get('viral_pct', '---')}%)",
        f"- Normal (20k-100k): {s.get('normal_count', '---')} video",
        f"- Tidak Viral (<20k): {s.get('tidak_viral_count', '---')} video",
        f"- Anomali terdeteksi: {s.get('anomaly_count', '---')} video ({s.get('anomaly_pct', '---')}%)",
        f"- Rata-rata views: {fmt(s.get('avg_views'), 'comma_float')}",
        f"- Median views: {fmt(s.get('median_views'), 'comma_float')}",
        f"- Views tertinggi: {fmt(s.get('max_views'), 'comma_int')}",
        f"- Rata-rata CTR: {s.get('avg_ctr', '---')}%",
        f"- Rata-rata retensi: {s.get('avg_retention', '---')}%",
    ]
    if "decline_critical" in s:
        lines.append(
            f"- Video risiko decline Critical: {s['decline_critical']}, "
            f"High: {s['decline_high']}, Low: {s['decline_low']}"
        )
    if "regression_mape" in s:
        lines.append(f"- Akurasi model prediksi views (MAPE): {s['regression_mape']}%")

    # Upload pattern per hari
    if "upload_per_hari" in s:
        lines.append(f"\nPola Upload Per Hari (dari {s.get('total_dengan_tanggal', '?')} video dengan tanggal):")
        for hari, data in s["upload_per_hari"].items():
            lines.append(
                f"  {hari}: {data['jumlah']} video | avg views {data['avg_views']:,} | {data['viral']} video viral"
            )
        lines.append(f"  -> Hari terbanyak upload: {s.get('hari_terbanyak_upload', '?')}")
        lines.append(f"  -> Hari avg views tertinggi: {s.get('hari_avg_views_tertinggi', '?')}")

    if "upload_per_bulan" in s:
        bulan_str = ", ".join(f"{b}: {n}" for b, n in s["upload_per_bulan"].items())
        lines.append(f"\nUpload per bulan: {bulan_str}")

    return "\n".join(lines)


def _build_channel_context(channel_stats) -> str:
    """Membangun teks konteks dari statistik channel pengguna."""
    if not channel_stats:
        return ""
    parts = ["Data Channel Pengguna Saat Ini:"]
    if channel_stats.avg_ctr is not None:
        health = "Sehat" if channel_stats.avg_ctr >= 4.0 else "Perlu perbaikan"
        parts.append(f"- Rata-rata CTR: {channel_stats.avg_ctr:.1f}% ({health})")
    if channel_stats.avg_retention is not None:
        health = "Baik" if channel_stats.avg_retention >= 45.0 else "Di bawah standar"
        parts.append(f"- Rata-rata Retensi: {channel_stats.avg_retention:.1f}% ({health})")
    if channel_stats.recent_views_drop is not None:
        parts.append(
            f"- Penurunan views terkini: {'YA - segera tindak lanjut' if channel_stats.recent_views_drop else 'Tidak ada'}"
        )
    if channel_stats.total_videos is not None:
        parts.append(f"- Total video: {channel_stats.total_videos}")
    return "\n".join(parts)


@router.post("/chat", response_model=ConsultationResponse)
async def chat_with_ai(request: ConsultationRequest):
    """
    Chat dengan AI Consultant Hippo Academy.
    Menggunakan RAG dari knowledge base Hippo Academy + live stats CSV + Gemini API.
    """
    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Library google-genai belum terinstall. Jalankan: pip install google-genai"
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY tidak ditemukan di environment variables."
        )

    # -- RAG: Retrieve Hippo Academy context ----------------------------------
    from utils.rag import retrieve_hippo_context, is_topic_relevant

    off_topic  = not is_topic_relevant(request.message)
    kb_context = retrieve_hippo_context(request.message) if not off_topic else ""
    context_used = bool(kb_context)

    # -- Build augmented prompt -----------------------------------------------
    live_stats_ctx = _build_live_stats_context()
    channel_ctx    = _build_channel_context(request.channel_stats)

    augmented_parts = []
    if kb_context:
        augmented_parts.append(f"Referensi Knowledge Base Hippo Academy:\n{kb_context}")
    if live_stats_ctx:
        augmented_parts.append(live_stats_ctx)
    if channel_ctx:
        augmented_parts.append(channel_ctx)
    augmented_parts.append(f"Pertanyaan pengguna: {request.message}")

    full_prompt = "\n\n".join(augmented_parts)

    # -- Call Gemini API ------------------------------------------------------
    try:
        history_contents = [
            genai_types.Content(
                role=msg.role,
                parts=[genai_types.Part.from_text(text=msg.content or "")]
            )
            for msg in request.history
            if msg.content
        ]

        client     = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        chat = client.chats.create(
            model=model_name,
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
            history=history_contents,
        )
        response   = chat.send_message(full_prompt)
        reply_text = response.text

    except Exception as e:
        logger.error(f"[Consultation] Gemini API error: {e}")

        # Fallback: gunakan konten KB nyata, bukan template hardcoded
        from utils.rag import retrieve_hippo_context as _rag
        kb_fallback = _rag(request.message, top_k=3, max_chars=2000)
        s = _load_live_stats()

        stats_line = ""
        if s:
            stats_line = (
                f"\n\n(Data channel: {s.get('total_videos', '?')} video, "
                f"rata-rata CTR {s.get('avg_ctr', '?')}%, "
                f"retensi {s.get('avg_retention', '?')}%, "
                f"{s.get('viral_count', '?')} video viral, "
                f"{s.get('anomaly_count', '?')} anomali.)"
            )

        if kb_fallback:
            reply_text = (
                f"Berikut informasi dari knowledge base Hippo Academy yang relevan:\n\n"
                f"{kb_fallback}"
                f"{stats_line}\n\n"
                f"[Catatan: Gemini API tidak tersedia saat ini ({type(e).__name__}). "
                f"Jawaban berasal dari knowledge base lokal.]"
            )
        else:
            reply_text = (
                f"Maaf, AI Consultant sedang tidak dapat terhubung ke Gemini API ({type(e).__name__}). "
                f"Periksa GEMINI_API_KEY di file .env backend."
                f"{stats_line}"
            )

    return ConsultationResponse(
        reply=reply_text,
        response=reply_text,
        context_used=context_used,
        is_off_topic=off_topic,
    )
