"""
Router: /management
====================
Fitur pengelolaan konten Hippo Academy:
  - POST /management/thumbnail/suggest  — Saran desain thumbnail via Gemini
  - GET  /management/schedule/optimal-hours — Jam posting terbaik
  - CRUD /management/drafts             — Manajemen draf video
"""

import os
import uuid
import json
import logging
from datetime import datetime, date, timedelta
from typing import List
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import (
    ThumbnailRequest, ThumbnailSuggestion,
    ScheduleRequest, ScheduleOutput, OptimalSlot,
    DraftCreate, DraftUpdate, DraftOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/management", tags=["Hippo Academy Management"])

# ─── In-memory draft store (ganti dengan DB di produksi) ─────────────────────
_drafts_db: dict = {}

DRAFTS_FILE = os.getenv("DRAFTS_FILE", "./data/drafts.json")


def _load_drafts():
    global _drafts_db
    if os.path.exists(DRAFTS_FILE):
        try:
            with open(DRAFTS_FILE, "r") as f:
                _drafts_db = json.load(f)
        except Exception:
            _drafts_db = {}


def _save_drafts():
    os.makedirs(os.path.dirname(DRAFTS_FILE), exist_ok=True)
    with open(DRAFTS_FILE, "w") as f:
        json.dump(_drafts_db, f, indent=2, default=str)


_load_drafts()


# ═══════════════════════════════════════════════════════════════════════════════
# THUMBNAIL SUGGESTION
# ═══════════════════════════════════════════════════════════════════════════════

THUMBNAIL_SYSTEM_PROMPT = """Anda adalah desainer thumbnail YouTube profesional dengan keahlian dalam metodologi Hippo Academy.
Berikan saran desain thumbnail yang spesifik, actionable, dan terbukti meningkatkan CTR.
Jawab dalam format JSON yang valid dengan field: main_element, background_color, text_overlay, facial_expression, composition_tip, color_palette.
color_palette harus berupa array hex string seperti ["#FF4444", "#FFFFFF", "#1A1A2E"]."""


@router.post("/thumbnail/suggest", response_model=ThumbnailSuggestion)
async def suggest_thumbnail(request: ThumbnailRequest):
    """Generate rekomendasi desain thumbnail berbasis Gemini API."""
    try:
        import google.generativeai as genai
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Library google-generativeai belum terinstall."
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY tidak ditemukan."
        )

    prompt = f"""Buat saran desain thumbnail YouTube untuk video berikut:
- Judul: {request.video_title}
- Tipe Konten: {request.content_type}
- Target Audiens: {request.target_audience or 'Umum'}

Berikan output dalam format JSON valid sesuai schema berikut:
{{
  "main_element": "deskripsi elemen visual utama",
  "background_color": "warna background (nama warna atau hex)",
  "text_overlay": "teks overlay maksimal 5 kata",
  "facial_expression": "deskripsi ekspresi wajah yang ideal",
  "composition_tip": "tips komposisi layout spesifik",
  "color_palette": ["#hex1", "#hex2", "#hex3"]
}}"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=THUMBNAIL_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        data = json.loads(response.text)

        return ThumbnailSuggestion(
            main_element=data.get("main_element", "Wajah presenter dengan ekspresi terkejut"),
            background_color=data.get("background_color", "#1A1A2E"),
            text_overlay=data.get("text_overlay", "RAHASIA TERUNGKAP!"),
            facial_expression=data.get("facial_expression", "Terkejut, mulut terbuka sedikit"),
            composition_tip=data.get("composition_tip", "Wajah di kiri, teks di kanan dengan Rule of Thirds"),
            color_palette=data.get("color_palette", ["#FF4444", "#FFFFFF", "#1A1A2E"]),
        )
    except Exception as e:
        logger.error(f"[Management] Thumbnail suggest error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini API error: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# OPTIMAL POSTING SCHEDULE
# ═══════════════════════════════════════════════════════════════════════════════

HIPPO_SCHEDULE_DEFAULTS = [
    {"day": "Senin",   "time_wib": "12:00",  "score": 82.0, "reason": "Traffic tinggi saat istirahat siang weekday"},
    {"day": "Rabu",    "time_wib": "13:00",  "score": 85.0, "reason": "Mid-week peak, audiens aktif mencari konten edukatif"},
    {"day": "Kamis",   "time_wib": "17:00",  "score": 88.0, "reason": "Menjelang akhir pekan, traffic meningkat signifikan"},
    {"day": "Jumat",   "time_wib": "18:00",  "score": 90.0, "reason": "Prime time akhir pekan, engagement tertinggi dalam seminggu"},
    {"day": "Sabtu",   "time_wib": "10:00",  "score": 87.0, "reason": "Pengguna aktif lebih awal di weekend"},
    {"day": "Minggu",  "time_wib": "11:00",  "score": 84.0, "reason": "Sunday morning audience, ideal untuk konten inspiratif"},
    {"day": "Selasa",  "time_wib": "14:00",  "score": 78.0, "reason": "Sore weekday, traffic stabil"},
]


@router.get("/schedule/optimal-hours", response_model=ScheduleOutput)
async def get_optimal_hours(days_ahead: int = 7):
    """
    Mengembalikan rekomendasi jam posting terbaik berdasarkan standar Hippo Academy.
    Jika data historis channel tersedia, gunakan endpoint ini dengan data aktual.
    """
    today = date.today()
    day_map = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

    slots = []
    for i in range(min(days_ahead, 7)):
        target_date = today + timedelta(days=i)
        day_name = day_map[target_date.weekday()]
        # Cari rekomendasi standar untuk hari ini
        match = next((s for s in HIPPO_SCHEDULE_DEFAULTS if s["day"] == day_name), HIPPO_SCHEDULE_DEFAULTS[0])
        slots.append(OptimalSlot(
            day=f"{day_name} ({target_date.strftime('%d %b')})",
            time_wib=match["time_wib"],
            score=match["score"],
            reason=match["reason"],
        ))

    # Urutkan berdasarkan skor tertinggi
    slots.sort(key=lambda x: x.score, reverse=True)

    return ScheduleOutput(
        optimal_slots=slots,
        general_tip=(
            "Upload setidaknya 30-60 menit sebelum jam prime time agar video sudah terindeks. "
            "Konsistensi jadwal lebih penting daripada mengejar jam peak sesekali."
        ),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# VIDEO DRAFTS CRUD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/drafts", response_model=List[DraftOut])
async def list_drafts(status_filter: str = None):
    """Ambil semua draf. Gunakan ?status_filter=Draft untuk filter berdasarkan status."""
    drafts = list(_drafts_db.values())
    if status_filter:
        drafts = [d for d in drafts if d.get("status") == status_filter]
    # Parse datetime strings back
    return [DraftOut(**d) for d in drafts]


@router.post("/drafts", response_model=DraftOut, status_code=status.HTTP_201_CREATED)
async def create_draft(draft: DraftCreate):
    """Buat draf video baru."""
    now = datetime.utcnow()
    draft_id = str(uuid.uuid4())
    draft_data = {
        **draft.model_dump(),
        "id": draft_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    _drafts_db[draft_id] = draft_data
    _save_drafts()
    return DraftOut(**draft_data)


@router.get("/drafts/{draft_id}", response_model=DraftOut)
async def get_draft(draft_id: str):
    """Ambil satu draf berdasarkan ID."""
    if draft_id not in _drafts_db:
        raise HTTPException(status_code=404, detail="Draft tidak ditemukan.")
    return DraftOut(**_drafts_db[draft_id])


@router.put("/drafts/{draft_id}", response_model=DraftOut)
async def update_draft(draft_id: str, update: DraftUpdate):
    """Update draf yang sudah ada."""
    if draft_id not in _drafts_db:
        raise HTTPException(status_code=404, detail="Draft tidak ditemukan.")

    existing = _drafts_db[draft_id]
    updates = update.model_dump(exclude_none=True)
    existing.update(updates)
    existing["updated_at"] = datetime.utcnow().isoformat()
    _drafts_db[draft_id] = existing
    _save_drafts()
    return DraftOut(**existing)


@router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(draft_id: str):
    """Hapus draf."""
    if draft_id not in _drafts_db:
        raise HTTPException(status_code=404, detail="Draft tidak ditemukan.")
    del _drafts_db[draft_id]
    _save_drafts()
