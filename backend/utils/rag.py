"""
RAG Engine — Hippo Academy Knowledge Base
==========================================
Retrieval context dari hippo_kb.md berdasarkan relevansi query pengguna.
"""

import os
import re
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

# --- Global KB Cache ---------------------------------------------------------
_kb_sections: List[Tuple[str, str]] = []
_kb_raw: str = ""

# Sinonim & ekspansi kata kunci untuk retrieval lebih luas
_SYNONYMS = {
    "ctr":         ["klik", "click", "tayangan", "impression", "thumbnail"],
    "retensi":     ["retention", "tonton", "watch time", "durasi", "bertahan"],
    "views":       ["penayangan", "tontonan", "tonton", "viral", "populer"],
    "anomali":     ["anomaly", "turun", "drop", "penurunan", "decline", "drastis"],
    "thumbnail":   ["gambar", "cover", "desain", "visual", "foto", "sampul"],
    "algoritma":   ["algorithm", "rekomendasi", "recommend", "suggest", "fyp"],
    "monetisasi":  ["monetize", "revenue", "pendapatan", "adsense", "iklan", "ads"],
    "subscriber":  ["subs", "subscriber", "penonton setia", "follower"],
    "upload":      ["posting", "publish", "jadwal", "schedule", "rilis"],
    "script":      ["skrip", "naskah", "konten", "cerita", "narasi"],
    "engagement":  ["interaksi", "like", "komentar", "share", "diskusi"],
    "viral":       ["trending", "populer", "hits", "booming", "meledak"],
    "seo":         ["judul", "title", "tag", "deskripsi", "description", "keyword"],
    "prediksi":    ["forecast", "predict", "model", "xgboost", "prophet", "ml"],
    "hook":        ["pembuka", "intro", "opening", "detik pertama", "awal"],
    "pacing":      ["tempo", "ritme", "editing", "cut", "transisi"],
    "niche":       ["topik", "genre", "kategori", "tema", "konten"],
    "channel":     ["saluran", "akun", "kreator", "creator", "youtuber"],
}

# Topik yang jelas tidak relevan (blocklist, bukan allowlist)
_OFFTOPIC_HARD_BLOCK = [
    "resep masakan", "cara masak", "cuaca hari ini", "ramalan cuaca",
    "harga saham", "investasi saham", "kurs dollar", "nilai tukar",
    "jadwal liga", "skor bola", "prediksi bola", "pertandingan",
    "cara main game", "cheat game", "walkthrough",
    "lowongan kerja", "gaji pns", "berita politik", "pemilu",
    "obat", "penyakit", "dokter", "medis",
]


def _load_kb() -> None:
    """Membaca hippo_kb.md dan memecah per section heading."""
    global _kb_sections, _kb_raw

    _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kb_path = os.getenv("HIPPO_KB_PATH", os.path.join(_backend_dir, "data", "hippo_kb.md"))
    if not os.path.exists(kb_path):
        logger.warning(f"[RAG] Knowledge base tidak ditemukan: {kb_path}")
        return

    with open(kb_path, "r", encoding="utf-8") as f:
        _kb_raw = f.read()

    chunks = re.split(r"\n(?=## )", _kb_raw)
    for chunk in chunks:
        lines = chunk.strip().splitlines()
        if not lines:
            continue
        heading = lines[0].replace("#", "").strip().lower()
        _kb_sections.append((heading, chunk.strip()))

    logger.info(f"[RAG] Knowledge base dimuat: {len(_kb_sections)} sections")


def _expand_query(query: str) -> List[str]:
    """Ekspansi query dengan sinonim agar retrieval lebih luas."""
    words = re.findall(r"\w+", query.lower())
    expanded = set(words)
    for word in words:
        for key, synonyms in _SYNONYMS.items():
            if word == key or word in synonyms:
                expanded.add(key)
                expanded.update(synonyms)
    return list(expanded)


def _keyword_score(query: str, section_content: str) -> float:
    """
    Skor relevansi gabungan: exact match + synonym match + partial match.
    Tidak ada minimum panjang kata - 'ctr', 'seo', 'ml' semuanya valid.
    """
    expanded_words = _expand_query(query)
    content_lower  = section_content.lower()
    score = 0.0

    for word in expanded_words:
        if word in content_lower:
            # Exact word boundary match bernilai lebih tinggi
            if re.search(r'\b' + re.escape(word) + r'\b', content_lower):
                score += 2.0
            else:
                score += 1.0

    # Bonus jika query phrase-nya langsung ada di konten
    query_lower = query.lower().strip()
    if len(query_lower) > 6 and query_lower in content_lower:
        score += 5.0

    return score


def retrieve_hippo_context(query: str, top_k: int = 4, max_chars: int = 5000) -> str:
    """
    Ambil top_k section paling relevan dari KB.
    Selalu kembalikan konteks — jika tidak ada match, kembalikan semua section overview.
    """
    global _kb_sections

    if not _kb_sections:
        _load_kb()

    if not _kb_sections:
        return ""

    scored = []
    for heading, content in _kb_sections:
        s = _keyword_score(query, content)
        scored.append((s, content))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Ambil yang relevan (score > 0), fallback ke top-2 section jika semua 0
    relevant = [(s, c) for s, c in scored if s > 0]
    if not relevant:
        relevant = scored[:2]

    selected = [c for _, c in relevant[:top_k]]
    context  = "\n\n---\n\n".join(selected)

    if len(context) > max_chars:
        context = context[:max_chars] + "\n...[konteks dipotong]"

    return context


def is_topic_relevant(query: str) -> bool:
    """
    Cek apakah query layak dijawab AI Consultant.
    Strategi: BLOCKLIST — default RELEVAN, tolak hanya yang jelas di luar scope.
    Jauh lebih luas dari sebelumnya: pertanyaan teknis, kreatif, dan bisnis konten
    semuanya dianggap relevan.
    """
    query_lower = query.lower()

    # Hard block: topik yang benar-benar tidak ada hubungannya
    for phrase in _OFFTOPIC_HARD_BLOCK:
        if phrase in query_lower:
            return False

    # Semua pertanyaan lain dianggap relevan —
    # biarkan Gemini + system prompt yang menentukan batas jawaban
    return True
