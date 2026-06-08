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
import base64
import random
import logging
from datetime import datetime, date, timedelta
from typing import List
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import (
    ThumbnailRequest, ThumbnailSuggestion,
    ThumbnailRenderRequest, ThumbnailRenderResult,
    ScheduleRequest, ScheduleOutput, OptimalSlot,
    DraftCreate, DraftUpdate, DraftOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/management", tags=["Hippo Academy Management"])

# ─── In-memory draft store (ganti dengan DB di produksi) ─────────────────────
_drafts_db: dict = {}

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAFTS_FILE = os.getenv("DRAFTS_FILE", os.path.join(_BACKEND_DIR, "data", "drafts.json"))


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
Jawab HANYA dalam format JSON yang valid dengan field berikut (tidak ada teks lain di luar JSON):
main_element, background_color, background_description, text_overlay, text_color, facial_expression, composition_tip, color_palette.
color_palette harus berupa array hex string seperti ["#FF4444", "#FFFFFF", "#1A1A2E"].
text_color harus berupa kode hex satu warna seperti "#FFDD00"."""


@router.post("/thumbnail/suggest", response_model=ThumbnailSuggestion)
async def suggest_thumbnail(request: ThumbnailRequest):
    """Generate rekomendasi desain thumbnail berbasis Gemini API."""
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
            detail="GEMINI_API_KEY tidak ditemukan."
        )

    # Konteks CTR untuk personalisasi saran
    ctr_context = ""
    if request.current_ctr is not None:
        if request.current_ctr < 2.0:
            ctr_context = f"\n- CTR Saat Ini: {request.current_ctr:.1f}% (RENDAH — desain harus sangat eye-catching dan kontroversial untuk mendorong klik)"
        elif request.current_ctr < 4.0:
            ctr_context = f"\n- CTR Saat Ini: {request.current_ctr:.1f}% (RATA-RATA — tingkatkan dengan elemen emosi dan teks yang lebih bold)"
        else:
            ctr_context = f"\n- CTR Saat Ini: {request.current_ctr:.1f}% (BAIK — pertahankan elemen yang bekerja, optimalkan warna dan komposisi)"

    description_context = f"\n- Deskripsi Konten: {request.description}" if request.description else ""

    prompt = f"""Buat saran desain thumbnail YouTube untuk video berikut:
- Judul: {request.video_title}
- Tipe Konten: {request.content_type}
- Target Audiens: {request.target_audience or 'Umum'}{description_context}{ctr_context}

Berikan output dalam format JSON valid sesuai schema berikut (semua field wajib diisi):
{{
  "main_element": "deskripsi detail elemen visual utama (orang, objek, grafis)",
  "background_color": "#HEX — warna dominan background",
  "background_description": "deskripsi detail latar belakang: gradien, tekstur, suasana warna, efek visual",
  "text_overlay": "teks overlay MAKSIMAL 5 kata, huruf kapital, impactful",
  "text_color": "#HEX — warna teks yang kontras dan mudah dibaca",
  "facial_expression": "deskripsi ekspresi wajah yang ideal untuk menarik klik",
  "composition_tip": "tips komposisi layout spesifik: posisi objek, rule of thirds, focal point",
  "color_palette": ["#hex1", "#hex2", "#hex3"]
}}"""

    try:
        client     = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_LITE_MODEL", "gemini-2.0-flash-lite")
        response   = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=THUMBNAIL_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text)

        return ThumbnailSuggestion(
            main_element=data.get("main_element", "Wajah presenter dengan ekspresi terkejut"),
            background_color=data.get("background_color", "#1A1A2E"),
            background_description=data.get("background_description", "Dark navy gradient dengan partikel cahaya subtle di latar"),
            text_overlay=data.get("text_overlay", "RAHASIA TERUNGKAP!"),
            text_color=data.get("text_color", "#FFDD00"),
            facial_expression=data.get("facial_expression", "Terkejut, mulut terbuka sedikit, mata lebar"),
            composition_tip=data.get("composition_tip", "Wajah di kiri, teks di kanan dengan Rule of Thirds"),
            color_palette=data.get("color_palette", ["#FF4444", "#FFFFFF", "#1A1A2E"]),
        )
    except Exception as e:
        logger.error(f"[Management] Thumbnail suggest error: {e}")
        # Fallback dinamis profesional standar Hippo Academy jika API Gemini limit/error
        title_summary = request.video_title[:30] + "..." if len(request.video_title) > 30 else request.video_title
        ctr_note = f" CTR {request.current_ctr:.1f}%." if request.current_ctr else ""
        return ThumbnailSuggestion(
            main_element=f"Presenter menunjuk grafis visual menarik atau mockup terkait '{title_summary}'",
            background_color="#1D1E2C",
            background_description="Dark navy premium dengan gradien diagonal dari biru gelap ke hitam, efek particle cahaya putih subtle di sudut kanan atas",
            text_overlay="TRIPEL VIEWS!",
            text_color="#FFDD00",
            facial_expression="Tersenyum antusias dengan pandangan fokus menatap audiens, ekspresi excited",
            composition_tip=f"Gunakan Rule of Thirds. Presenter di sisi kanan 60% frame, teks bold di kiri dengan stroke putih tebal.{ctr_note}",
            color_palette=["#FF0055", "#FFDD00", "#FFFFFF", "#1D1E2C"],
        )


# ═══════════════════════════════════════════════════════════════════════════════
# THUMBNAIL IMAGE RENDER (rantai fallback: Gemini → OpenAI → Pollinations)
# ═══════════════════════════════════════════════════════════════════════════════

def _render_with_gemini(prompt: str) -> "ThumbnailRenderResult | None":
    """Coba generate gambar dengan Gemini image-gen ('nano banana'). None kalau gagal/tidak ada key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types as genai_types

        client = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )
        for part in response.candidates[0].content.parts:
            inline = getattr(part, "inline_data", None)
            if inline is not None and inline.data:
                mime = inline.mime_type or "image/png"
                b64 = base64.b64encode(inline.data).decode("utf-8")
                return ThumbnailRenderResult(provider="gemini", image_data=f"data:{mime};base64,{b64}")
    except Exception as e:
        logger.warning(f"[Management] Render thumbnail via Gemini gagal, coba fallback: {e}")
    return None


async def _render_with_openai(prompt: str) -> "ThumbnailRenderResult | None":
    """Coba generate gambar dengan OpenAI Images API. None kalau gagal/tidak ada key."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        import httpx

        async with httpx.AsyncClient(timeout=90.0) as http_client:
            resp = await http_client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1"),
                    "prompt": prompt,
                    "size": "1536x1024",
                    "n": 1,
                },
            )
            resp.raise_for_status()
            b64 = resp.json()["data"][0]["b64_json"]
            return ThumbnailRenderResult(provider="openai", image_data=f"data:image/png;base64,{b64}")
    except Exception as e:
        logger.warning(f"[Management] Render thumbnail via OpenAI gagal, coba fallback: {e}")
    return None


def _render_with_pollinations(prompt: str) -> ThumbnailRenderResult:
    """Fallback terakhir: Pollinations AI — gratis, tanpa API key, selalu tersedia."""
    encoded = quote(prompt)
    seed = random.randint(0, 1_000_000)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1280&height=720&nologo=true&seed={seed}&model=turbo"
    return ThumbnailRenderResult(provider="pollinations", image_url=url)


@router.post("/thumbnail/render", response_model=ThumbnailRenderResult)
async def render_thumbnail_image(request: ThumbnailRenderRequest):
    """
    Generate gambar thumbnail AI dari prompt visual.
    Rantai fallback otomatis kalau provider sebelumnya limit/gagal:
    Gemini image-gen ('nano banana') → OpenAI (gpt-image-1) → Pollinations AI (gratis).
    """
    result = _render_with_gemini(request.prompt)
    if result is not None:
        return result

    result = await _render_with_openai(request.prompt)
    if result is not None:
        return result

    return _render_with_pollinations(request.prompt)


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
