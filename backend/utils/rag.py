"""
RAG Engine — Hippo Academy Knowledge Base
==========================================
Melakukan retrieval context dari hippo_kb.md berdasarkan kata kunci query user.
Digunakan sebagai context injection sebelum request dikirim ke Gemini API.
"""

import os
import re
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

# ─── Global KB Cache ─────────────────────────────────────────────────────────
_kb_sections: List[Tuple[str, str]] = []   # [(heading, content), ...]
_kb_raw: str = ""


def _load_kb() -> None:
    """Membaca hippo_kb.md dan memecah per section heading."""
    global _kb_sections, _kb_raw

    kb_path = os.getenv("HIPPO_KB_PATH", "./data/hippo_kb.md")
    if not os.path.exists(kb_path):
        logger.warning(f"[RAG] Knowledge base tidak ditemukan: {kb_path}")
        return

    with open(kb_path, "r", encoding="utf-8") as f:
        _kb_raw = f.read()

    # Pecah per section (## heading)
    chunks = re.split(r"\n(?=## )", _kb_raw)
    for chunk in chunks:
        lines = chunk.strip().splitlines()
        if not lines:
            continue
        heading = lines[0].replace("#", "").strip().lower()
        _kb_sections.append((heading, chunk.strip()))

    logger.info(f"[RAG] Knowledge base dimuat: {len(_kb_sections)} sections")


def _keyword_score(query: str, section_content: str) -> int:
    """
    Menghitung skor relevansi berdasarkan jumlah kata kunci query
    yang ditemukan di konten section (case-insensitive).
    """
    words = re.findall(r"\w+", query.lower())
    content_lower = section_content.lower()
    return sum(1 for w in words if len(w) > 3 and w in content_lower)


def retrieve_hippo_context(query: str, top_k: int = 2, max_chars: int = 1500) -> str:
    """
    Mengambil top_k section paling relevan dari knowledge base
    berdasarkan kemiripan kata kunci dengan query pengguna.

    Returns:
        String teks konteks yang siap di-inject ke prompt Gemini.
    """
    global _kb_sections

    if not _kb_sections:
        _load_kb()

    if not _kb_sections:
        return ""

    # Hitung skor relevansi tiap section
    scored = [
        (score, content)
        for heading, content in _kb_sections
        if (score := _keyword_score(query, content)) > 0
    ]

    # Urutkan berdasarkan skor tertinggi
    scored.sort(key=lambda x: x[0], reverse=True)

    # Ambil top_k dan gabungkan
    selected = [content for _, content in scored[:top_k]]

    if not selected:
        # Fallback: ambil section pertama (overview umum)
        selected = [_kb_sections[0][1]]

    context = "\n\n---\n\n".join(selected)

    # Truncate agar tidak melebihi batas karakter
    if len(context) > max_chars:
        context = context[:max_chars] + "\n...[konteks dipotong]"

    return context


def is_topic_relevant(query: str) -> bool:
    """
    Deteksi kasar apakah query relevan dengan topik YouTube / Hippo Academy.
    Digunakan untuk client-side warning sebelum dikirim ke Gemini.
    """
    youtube_keywords = [
        "youtube", "video", "channel", "thumbnail", "views", "penayangan",
        "ctr", "klik", "retensi", "subscriber", "upload", "konten", "monetisasi",
        "iklan", "adsense", "hook", "script", "skrip", "analitik", "performa",
        "hippo", "academy", "algoritma", "shorts", "vlog", "like", "komentar"
    ]
    query_lower = query.lower()
    return any(kw in query_lower for kw in youtube_keywords)
