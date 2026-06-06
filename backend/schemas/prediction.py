"""
Pydantic Schemas — YouTube View Decline Diagnosis & Hippo Academy
=================================================================
Semua request/response schema API terdefinisi di sini.
Validasi dilakukan secara ketat menggunakan Pydantic v2.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal, List, Optional, Dict, Any
from datetime import datetime


# ─── Error Response ───────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Prediction Schemas (Model 1 + Model 3) ───────────────────────────────────

class PredictionInput(BaseModel):
    views: int = Field(ge=0, description="Total views video saat ini")
    ctr: float = Field(ge=0, le=100, description="Click-through rate (%)")
    impressions: int = Field(ge=0, description="Total impressions")
    avg_view_duration: str = Field(
        description="Rata-rata durasi tonton — format HH:MM:SS, MM:SS, atau detik (float)"
    )
    video_duration: str = Field(
        default="00:10:00",
        description="Durasi total video — format HH:MM:SS atau MM:SS"
    )
    likes: int = Field(default=0, ge=0, description="Jumlah like")
    comments: int = Field(default=0, ge=0, description="Jumlah komentar")
    retention_rate: float = Field(
        default=0.0, ge=0, le=100,
        description="Persentase penayangan rata-rata (%)"
    )
    subscriber_gained: int = Field(default=0, ge=0, description="Subscriber yang diperoleh")
    video_age_days: int = Field(default=1, ge=0, description="Usia video (hari sejak upload)")
    video_age_hours: Optional[int] = Field(
        default=None, ge=0,
        description="Usia video dalam jam — lebih presisi dari hari; dipakai untuk Hippo Academy 2-jam viral rule. Jika None, dihitung dari video_age_days × 24."
    )
    lag_views_7d: float = Field(default=0.0, ge=0, description="Views 7 hari sebelumnya")
    rolling_mean_views_14d: float = Field(
        default=0.0, ge=0, description="Rata-rata views 14 hari terakhir"
    )
    video_title: str = Field(
        default="",
        max_length=300,
        description="Judul video — digunakan untuk fitur NLP Model 5 Survival"
    )
    channel_avg_velocity_2h: Optional[float] = Field(
        default=None, ge=0,
        description="Rata-rata views per 2 jam channel (untuk relative viral threshold). "
                    "Jika None, backend gunakan default 500 atau hitung dari data YouTube."
    )
    publish_hour: Optional[int] = Field(
        default=None, ge=0, le=23,
        description="Jam upload video (0-23 WIB) — untuk fitur primetime Model 5"
    )

    @field_validator("ctr", "retention_rate")
    @classmethod
    def check_percentage(cls, v: float, info) -> float:
        if not (0 <= v <= 100):
            raise ValueError(f"{info.field_name} harus antara 0 dan 100")
        return v


class ProjectionPoint(BaseModel):
    label: str
    views: int


class ViewsForecast(BaseModel):
    days_1: int = Field(description="Prediksi views 1 hari ke depan")
    days_2: int = Field(description="Prediksi views 2 hari ke depan")
    days_3: int = Field(description="Prediksi views 3 hari ke depan")
    chart_data: List[ProjectionPoint] = Field(default=[], description="Data points untuk chart proyeksi (termasuk detail per jam)")


class AnomalyResult(BaseModel):
    is_anomaly: bool = Field(description="True jika terdeteksi anomali penurunan")
    anomaly_score: float = Field(description="Skor anomali (semakin negatif = semakin anomali)")
    label: Literal["Normal", "Anomali"] = Field(description="Label status video")


class DeclineResult(BaseModel):
    is_declining: bool = Field(description="True jika diprediksi video mengalami penurunan views")
    decline_probability: float = Field(ge=0, le=1, description="Probabilitas penurunan (0–1)")
    risk_level: Literal["Low Risk", "Medium Risk", "High Risk", "Critical"] = Field(
        description="Level risiko penurunan: Low (<30%), Medium (30-55%), High (55-75%), Critical (>75%)"
    )


class SurvivalResult(BaseModel):
    viral_prob_2h: float = Field(ge=0, le=1, description="P(viral dalam 2 jam) dari Model 5")
    viral_prob_24h: float = Field(ge=0, le=1, description="P(viral dalam 24 jam) dari Model 5")
    viral_prob_48h: float = Field(ge=0, le=1, description="P(viral dalam 48 jam) dari Model 5")
    status: Literal["Viral", "Normal", "Tidak Viral"] = Field(description="Status dari survival model")
    confidence: float = Field(ge=0, le=1)
    viral_ratio: float = Field(description="Relative velocity: views_2h / channel_avg_2h")


class PredictionOutput(BaseModel):
    status: Literal["Viral", "Normal", "Tidak Viral"]
    confidence: float = Field(ge=0, le=1, description="Confidence score prediksi status (0–1)")
    is_viral: bool = Field(description="True jika video diprediksi berpotensi viral (Hippo Academy 2-jam rule: views/2h ≥ 2.000)")
    predicted_views: ViewsForecast
    anomaly: AnomalyResult
    decline: Optional[DeclineResult] = Field(default=None, description="Hasil Model 4 Decline Classifier — None jika model tidak tersedia")
    survival: Optional[SurvivalResult] = Field(
        default=None,
        description="Hasil Model 5 Survival (Cox PH) — None jika model belum dilatih"
    )
    recommendation: str = Field(description="Rekomendasi actionable berdasarkan hasil prediksi")


# ─── Time Series Forecast Schemas (Model 2) ───────────────────────────────────

class ForecastPoint(BaseModel):
    date: str = Field(description="Tanggal forecast (YYYY-MM-DD)")
    yhat: float = Field(description="Prediksi views")
    yhat_lower: float = Field(description="Batas bawah confidence interval 95%")
    yhat_upper: float = Field(description="Batas atas confidence interval 95%")


class ForecastOutput(BaseModel):
    horizon_days: int = Field(description="Jumlah hari yang diforecast")
    forecast: List[ForecastPoint]
    model_used: str = Field(description="Model yang digunakan: Prophet atau ARIMA")


# ─── AI Consultation Schemas (Gemini RAG) ────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: Optional[str] = Field(default="")
    parts: Optional[Any] = Field(default=None)

    @model_validator(mode="before")
    @classmethod
    def resolve_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            parts_val = data.get("parts")
            content_val = data.get("content")
            
            if content_val is None and parts_val is not None:
                if isinstance(parts_val, list):
                    text_parts = []
                    for p in parts_val:
                        if isinstance(p, dict) and "text" in p:
                            text_parts.append(p["text"])
                        elif isinstance(p, str):
                            text_parts.append(p)
                    content_val = " ".join(text_parts)
                else:
                    content_val = str(parts_val)
                data["content"] = content_val
                
            if data.get("content") is None:
                data["content"] = ""
        return data


class ChannelStats(BaseModel):
    avg_ctr: Optional[float] = Field(default=None, description="Rata-rata CTR channel (%)")
    avg_retention: Optional[float] = Field(default=None, description="Rata-rata retensi (%)")
    recent_views_drop: Optional[bool] = Field(
        default=None, description="True jika ada penurunan views signifikan baru-baru ini"
    )
    total_videos: Optional[int] = Field(default=None, description="Total video di channel")


class ConsultationRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000, description="Pertanyaan pengguna")
    history: List[ChatMessage] = Field(default=[], description="Riwayat percakapan sebelumnya")
    channel_stats: Optional[ChannelStats] = Field(
        default=None, description="Data statistik channel untuk personalisasi jawaban"
    )


class ConsultationResponse(BaseModel):
    reply: str = Field(description="Jawaban AI Consultant")
    response: str = Field(default="", description="Jawaban AI Consultant (alias untuk frontend)")
    context_used: bool = Field(description="True jika knowledge base Hippo Academy digunakan")
    is_off_topic: bool = Field(
        default=False, description="True jika pertanyaan di luar topik YouTube/Hippo Academy"
    )


# ─── Management Schemas (Hippo Academy) ──────────────────────────────────────

class ThumbnailRequest(BaseModel):
    video_title: str = Field(min_length=3, max_length=200, description="Judul video")
    description: Optional[str] = Field(
        default=None, max_length=500,
        description="Deskripsi singkat konten video — digunakan untuk mempersonalisasi saran desain"
    )
    content_type: str = Field(
        default="Edukasi",
        description="Tipe konten: Edukasi, Tutorial, Vlog, Review, dll."
    )
    target_audience: Optional[str] = Field(default=None, description="Target audiens")
    current_ctr: Optional[float] = Field(
        default=None, ge=0, le=100,
        description="CTR video saat ini (%) — digunakan untuk konteks optimasi desain"
    )


class ThumbnailSuggestion(BaseModel):
    main_element: str = Field(description="Objek/elemen visual utama yang disarankan")
    background_color: str = Field(description="Warna background utama (hex)")
    background_description: str = Field(
        default="",
        description="Deskripsi detail latar belakang (gradien, tekstur, suasana, dll.)"
    )
    text_overlay: str = Field(description="Teks overlay maksimal 3-5 kata")
    text_color: str = Field(
        default="#FFFFFF",
        description="Warna teks overlay yang direkomendasikan (hex)"
    )
    facial_expression: str = Field(description="Ekspresi wajah yang ideal (jika ada orang)")
    composition_tip: str = Field(description="Tips komposisi layout thumbnail")
    color_palette: List[str] = Field(description="Palet warna yang disarankan (hex)")


class ScheduleRequest(BaseModel):
    days_ahead: int = Field(default=7, ge=1, le=30, description="Jumlah hari ke depan untuk jadwal")


class OptimalSlot(BaseModel):
    day: str
    time_wib: str
    score: float = Field(description="Skor optimalitas 0-100")
    reason: str


class ScheduleOutput(BaseModel):
    optimal_slots: List[OptimalSlot]
    general_tip: str


class DraftStatus(str):
    DRAFT = "Draft"
    READY = "Ready to Post"
    SCHEDULED = "Scheduled"
    PUBLISHED = "Published"


class DraftCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = Field(default=None)
    tags: List[str] = Field(default=[])
    target_publish_date: Optional[str] = Field(
        default=None, description="Tanggal rilis target (YYYY-MM-DD)"
    )
    status: str = Field(default="Draft")
    thumbnail_concept_prompt: Optional[str] = Field(
        default=None, description="Prompt ide visual thumbnail"
    )
    script_outline: Optional[str] = Field(default=None, description="Outline skrip video")


class DraftUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    target_publish_date: Optional[str] = None
    status: Optional[str] = None
    thumbnail_concept_prompt: Optional[str] = None
    script_outline: Optional[str] = None


class DraftOut(DraftCreate):
    id: str
    created_at: datetime
    updated_at: datetime
