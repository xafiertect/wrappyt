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

    # ── Call Gemini API (google.genai SDK v2) — everything inside one try ────────
    try:
        # Build conversation history inside try so any genai_types errors are caught
        history_contents = [
            genai_types.Content(
                role=msg.role,
                parts=[genai_types.Part.from_text(text=msg.content or "")]
            )
            for msg in request.history
            if msg.content
        ]

        client = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        chat = client.chats.create(
            model=model_name,
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
            history=history_contents,
        )
        response = chat.send_message(full_prompt)
        reply_text = response.text

    except Exception as e:
        logger.error(f"[Consultation] Gemini API error: {e}")
        # Fallback lokal cerdas standar Hippo Academy jika API Gemini limit/error
        # PENTING: blok ini selalu return 200 — tidak boleh raise HTTPException
        msg_lower = request.message.lower()
        if "ctr" in msg_lower or "thumbnail" in msg_lower:
            reply_text = (
                "Berdasarkan pedoman Hippo Academy, CTR yang rendah biasanya disebabkan oleh desain thumbnail atau judul yang kurang menarik.\n\n"
                "**Rekomendasi tindakan segera:**\n"
                "1. **Redesign Thumbnail**: Gunakan warna kontras tinggi (seperti merah/kuning dengan latar navy gelap) dan pastikan ekspresi wajah presenter terlihat jelas (Rule of Thirds).\n"
                "2. **Optimalkan Judul**: Buat judul yang memicu rasa ingin tahu (curiosity gap) tanpa clickbait yang menipu.\n"
                "3. **Evaluasi Analytics**: Bandingkan CTR video Anda dengan rata-rata channel (target minimal Hippo Academy adalah 4.0%)."
            )
        elif "retensi" in msg_lower or "retention" in msg_lower or "durasi" in msg_lower:
            reply_text = (
                "Untuk meningkatkan retensi penonton dan durasi tonton rata-rata, Anda dapat menerapkan strategi retensi Hippo Academy:\n\n"
                "**Rekomendasi tindakan segera:**\n"
                "1. **Hook 10 Detik Pertama**: Singkirkan intro yang bertele-tele. Langsung sampaikan value utama video dalam 10 detik pertama.\n"
                "2. **Pacing Dinamis**: Gunakan B-roll, transisi cepat, zoom halus, dan efek suara setiap 3-5 detik untuk menjaga fokus penonton.\n"
                "3. **Reset Atensi**: Masukkan elemen visual baru atau ganti topik bahasan secara tak terduga untuk mereset kebosanan penonton."
            )
        elif "anomali" in msg_lower or "turun" in msg_lower or "penurunan" in msg_lower:
            reply_text = (
                "Jika Anda mendeteksi adanya anomali atau penurunan views secara tiba-tiba, berikut adalah panduan tindakan darurat Hippo Academy:\n\n"
                "**Rekomendasi tindakan segera:**\n"
                "1. **Cek Realtime Analytics**: Pantau traffic per jam untuk melihat apakah penurunan terjadi secara sistemik di seluruh video atau hanya pada video terbaru.\n"
                "2. **Audit Metadata Terkini**: Apakah Anda baru saja mengubah judul atau thumbnail? Jika ya, kembalikan ke versi sebelumnya yang stabil.\n"
                "3. **Tingkatkan Interaksi**: Balas komentar-komentar awal dengan pertanyaan terbuka untuk memicu diskusi baru, yang dapat mendorong algoritma merekomendasikan video kembali."
            )
        elif "viral" in msg_lower or "views" in msg_lower or "prediksi" in msg_lower:
            reply_text = (
                "Berdasarkan model prediksi Hippo Academy, berikut faktor utama yang menentukan potensi viral sebuah video:\n\n"
                "**Faktor Kritis:**\n"
                "1. **Momentum 2 Jam Pertama**: Video dengan ≥1.000 views dalam 2 jam pertama upload memiliki peluang viral 3x lebih tinggi.\n"
                "2. **CTR & Retensi Bersamaan**: CTR ≥4% + Retensi ≥45% adalah kombinasi terkuat untuk mendorong rekomendasi algoritma.\n"
                "3. **Distribusi Awal**: Share video ke 3-5 komunitas relevan dalam 30 menit pertama setelah upload untuk memicu momentum awal."
            )
        else:
            reply_text = (
                "Halo! Terima kasih telah berkonsultasi dengan Hippo Academy AI Consultant.\n\n"
                "Berikut adalah strategi emas dari Hippo Academy untuk optimasi performa channel Anda:\n\n"
                "1. **Analisis CTR**: Pastikan CTR Anda selalu di atas target minimal 4.0% dengan thumbnail beresolusi tinggi dan berkarakter.\n"
                "2. **Pahami Retensi**: Jaga agar retensi penonton di atas 45.0% dengan memangkas bagian video yang membosankan dan mempercepat tempo cerita.\n"
                "3. **Konsistensi Posting**: Unggah konten secara konsisten di hari-hari produktif (Rabu, Jumat, atau Sabtu) sesuai analisis data audiens Anda.\n\n"
                "_Catatan: Layanan AI sedang dalam mode terbatas. Respons di atas berdasarkan knowledge base lokal Hippo Academy._"
            )

    return ConsultationResponse(
        reply=reply_text,
        response=reply_text,
        context_used=context_used,
        is_off_topic=off_topic,
    )
