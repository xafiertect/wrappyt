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

# ─── System Instruction (Hippo Academy Guardrail) ────────────────────────────
SYSTEM_INSTRUCTION = """Anda adalah "Hippo Academy AI Consultant", asisten khusus yang membantu kreator YouTube mengoptimalkan performa channel mereka berdasarkan metodologi Hippo Academy.

BATASAN PENTING:
1. Anda HANYA boleh menjawab pertanyaan yang berkaitan dengan optimasi YouTube, analitik video, performa channel, pembuatan thumbnail, penjadwalan konten, draf video, strategi konten, dan materi pembelajaran Hippo Academy.
2. Jika pengguna menanyakan hal di luar lingkup di atas (misalnya: coding umum, resep masakan, politik, sejarah umum, dll.), Anda WAJIB menolak secara sopan dengan kalimat: "Maaf, sebagai AI Consultant Hippo Academy, saya hanya dapat membantu Anda dalam hal optimasi channel YouTube dan pengelolaan konten."
3. Gunakan data kontekstual Hippo Academy yang disediakan untuk memberikan rekomendasi praktis dan spesifik.
4. Jawablah dengan gaya bahasa yang profesional, memotivasi, dan mudah dipahami oleh kreator konten.
5. Jika ada data statistik channel yang disertakan, gunakan data tersebut untuk personalisasi jawaban.
6. Selalu berikan langkah-langkah yang actionable, bukan hanya teori umum."""


def _build_channel_context(channel_stats) -> str:
    """Membangun teks konteks dari statistik channel pengguna."""
    if not channel_stats:
        return ""
    parts = ["📊 **Data Channel Pengguna Saat Ini:**"]
    if channel_stats.avg_ctr is not None:
        status = "✅ Sehat" if channel_stats.avg_ctr >= 4.0 else "⚠️ Perlu perbaikan"
        parts.append(f"- Rata-rata CTR: {channel_stats.avg_ctr:.1f}% ({status})")
    if channel_stats.avg_retention is not None:
        status = "✅ Baik" if channel_stats.avg_retention >= 45.0 else "⚠️ Di bawah standar"
        parts.append(f"- Rata-rata Retensi: {channel_stats.avg_retention:.1f}% ({status})")
    if channel_stats.recent_views_drop is not None:
        parts.append(f"- Penurunan views terkini: {'⚠️ YA — segera tindak lanjut' if channel_stats.recent_views_drop else '✅ Tidak ada'}")
    if channel_stats.total_videos is not None:
        parts.append(f"- Total video: {channel_stats.total_videos}")
    return "\n".join(parts)


@router.post("/chat", response_model=ConsultationResponse)
async def chat_with_ai(request: ConsultationRequest):
    """
    Chat dengan AI Consultant Hippo Academy.
    Menggunakan RAG dari knowledge base Hippo Academy + Gemini API.
    """
    try:
        import google.generativeai as genai
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Library google-generativeai belum terinstall. Jalankan: pip install google-generativeai"
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY tidak ditemukan di environment variables."
        )

    # ── RAG: Retrieve Hippo Academy context ──────────────────────────────────
    from utils.rag import retrieve_hippo_context, is_topic_relevant

    off_topic = not is_topic_relevant(request.message)
    kb_context = retrieve_hippo_context(request.message) if not off_topic else ""
    context_used = bool(kb_context)

    # ── Build augmented prompt ────────────────────────────────────────────────
    channel_ctx = _build_channel_context(request.channel_stats)

    augmented_parts = []
    if kb_context:
        augmented_parts.append(f"📚 **Referensi Hippo Academy:**\n{kb_context}")
    if channel_ctx:
        augmented_parts.append(channel_ctx)
    augmented_parts.append(f"**Pertanyaan pengguna:** {request.message}")

    full_prompt = "\n\n".join(augmented_parts)

    # ── Build conversation history ────────────────────────────────────────────
    history = [
        {"role": msg.role, "parts": [msg.content]}
        for msg in request.history
    ]

    # ── Call Gemini API ───────────────────────────────────────────────────────
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_INSTRUCTION,
        )
        chat = model.start_chat(history=history)
        response = chat.send_message(full_prompt)
        reply_text = response.text

    except Exception as e:
        logger.error(f"[Consultation] Gemini API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini API tidak tersedia: {str(e)}"
        )

    return ConsultationResponse(
        reply=reply_text,
        context_used=context_used,
        is_off_topic=off_topic,
    )
