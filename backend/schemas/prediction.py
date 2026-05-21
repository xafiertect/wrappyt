"""
Pydantic Schemas — YouTube View Decline Diagnosis & Hippo Academy
=================================================================
Semua request/response schema API terdefinisi di sini.
Validasi dilakukan secara ketat menggunakan Pydantic v2.
"""

from pydantic import BaseModel, Field, field_validator
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
    lag_views_7d: float = Field(default=0.0, ge=0, description="Views 7 hari sebelumnya")
    rolling_mean_views_14d: float = Field(
        default=0.0, ge=0, description="Rata-rata views 14 hari terakhir"
    )

    @field_validator("ctr", "retention_rate")
    @classmethod
    def check_percentage(cls, v: float, info) -> float:
        if not (0 <= v <= 100):
            raise ValueError(f"{info.field_name} harus antara 0 dan 100")
        return v


class ViewsForecast(BaseModel):
    days_7: int = Field(description="Prediksi views 7 hari ke depan")
    days_14: int = Field(description="Prediksi views 14 hari ke depan")
    days_30: int = Field(description="Prediksi views 30 hari ke depan")


class AnomalyResult(BaseModel):
    is_anomaly: bool = Field(description="True jika terdeteksi anomali penurunan")
    anomaly_score: float = Field(description="Skor anomali (semakin negatif = semakin anomali)")
    label: Literal["Normal", "Anomali"] = Field(description="Label status video")


class PredictionOutput(BaseModel):
    status: Literal["Viral", "Normal", "Declining"]
    confidence: float = Field(ge=0, le=1, description="Confidence score prediksi status")
    predicted_views: ViewsForecast
    anomaly: AnomalyResult
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
    content: str


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
    context_used: bool = Field(description="True jika knowledge base Hippo Academy digunakan")
    is_off_topic: bool = Field(
        default=False, description="True jika pertanyaan di luar topik YouTube/Hippo Academy"
    )


# ─── Management Schemas (Hippo Academy) ──────────────────────────────────────

class ThumbnailRequest(BaseModel):
    video_title: str = Field(min_length=3, max_length=200, description="Judul video")
    content_type: str = Field(
        default="Edukasi",
        description="Tipe konten: Edukasi, Tutorial, Vlog, Review, dll."
    )
    target_audience: Optional[str] = Field(default=None, description="Target audiens")


class ThumbnailSuggestion(BaseModel):
    main_element: str = Field(description="Objek/elemen visual utama yang disarankan")
    background_color: str = Field(description="Warna background yang direkomendasikan")
    text_overlay: str = Field(description="Teks overlay maksimal 3-5 kata")
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
