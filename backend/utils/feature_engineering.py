"""
Feature Engineering Utility
============================
Melakukan preprocessing dan derived feature generation on-the-fly
terhadap payload request sebelum dikirim ke model ML.
Sesuai dengan 30 selected features dari Model 1 XGBoost.
"""

import math
from typing import Union


def time_str_to_seconds(t: Union[str, float, None]) -> float:
    """
    Konversi durasi dari format HH:MM:SS / MM:SS / detik ke float detik.
    Mengmengembalikan 0.0 jika input tidak valid.
    """
    if t is None:
        return 0.0
    if isinstance(t, (int, float)):
        return float(t)
    try:
        parts = str(t).strip().split(":")
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        return float(parts[0])
    except Exception:
        return 0.0


def compute_features(
    views: int,
    ctr: float,
    impressions: int,
    avg_view_duration: Union[str, float],
    video_duration: Union[str, float],
    likes: int,
    comments: int,
    retention_rate: float,
    subscriber_gained: int,
    video_age_days: int,
    lag_views_7d: float = 0.0,
    rolling_mean_views_14d: float = 0.0,
) -> dict:
    """
    Menghitung ke-30 derived features sesuai dengan feature list dari training.
    Mengembalikan dictionary lengkap dengan format yang siap di-scale/input ke model.
    """
    avg_view_sec = time_str_to_seconds(avg_view_duration)
    video_duration_sec = time_str_to_seconds(video_duration)

    # 1. Base engagement rates
    like_rate = likes / (views + 1)
    dislike_rate = (likes * 0.05) / (views + 1)  # Fallback dislike (5% dari likes)
    comment_rate = comments / (views + 1)
    like_dislike_ratio = likes / (likes * 0.05 + 1)

    # 2. Retention & engagement score
    retention_proxy = avg_view_sec / (video_duration_sec + 1)
    engagement_score = (like_rate * 0.5) + (comment_rate * 0.3) + (retention_proxy * 0.2)

    # 3. CTR & Impressions
    ctr_normalized = ctr / 100.0
    impression_to_view_rate = views / (impressions + 1)
    ctr_impression_score = ctr_normalized * impression_to_view_rate
    ctr_vs_channel_avg = ctr / 5.0  # Asumsi channel average CTR = 5.0%

    if ctr < 3.0:
        ctr_category = 0  # Low
    elif ctr <= 7.0:
        ctr_category = 1  # Mid
    else:
        ctr_category = 2  # High

    # 4. Temporal & Time Decay
    day_of_week = 4   # Default: Friday (4)
    month = 5         # Default: May (5)
    is_weekend = 0    # Default: Weekday (0)

    # 5. Growth Rates (Wildan)
    lag_views = lag_views_7d if lag_views_7d else views
    rolling_mean = rolling_mean_views_14d if rolling_mean_views_14d else views

    growth_1_to_2 = ((views - lag_views) / (lag_views + 1)) * 100
    growth_3_to_4 = growth_1_to_2  # Fallback: asumsi trend stabil
    avg_growth_rate = growth_1_to_2
    growth_trend = 0.0

    peak_views = max(views, lag_views * 1.2)
    view_velocity = views / (video_age_days + 1)

    # 6. Rolling & Trends (Akmal)
    rolling_mean_views_7d = rolling_mean
    views_trend_ratio = views / (rolling_mean + 1)
    rolling_cv_views = 0.15  # Default Coefficient of Variation
    views_deviation = views - rolling_mean

    # 7. Flags
    is_viral = 1 if views > 50000 else 0
    is_declining = 1 if views < (rolling_mean * 0.7) else 0

    # 8. Revenue (Zahra)
    revenue_per_view = 150.0  # Est IDR 150 per view
    is_monetized = 1
    ad_impression_rate = 0.85
    revenue_category = 1      # Mid revenue category

    def safe(v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            return 0.0
        return round(v, 6)

    return {
        # Growth (Wildan)
        "growth_1_to_2": safe(growth_1_to_2),
        "growth_3_to_4": safe(growth_3_to_4),
        "avg_growth_rate": safe(avg_growth_rate),
        "growth_trend": safe(growth_trend),
        "peak_views": safe(peak_views),
        "view_velocity": safe(view_velocity),

        # Temporal / Age (Akmal)
        "video_age_days": int(video_age_days),
        "day_of_week": int(day_of_week),
        "month": int(month),
        "is_weekend": int(is_weekend),

        # Status / Durasi
        "is_viral": int(is_viral),
        "video_duration_sec": safe(video_duration_sec),

        # Engagement (Qiqi)
        "like_rate": safe(like_rate),
        "dislike_rate": safe(dislike_rate),
        "comment_rate": safe(comment_rate),
        "like_dislike_ratio": safe(like_dislike_ratio),
        "engagement_score": safe(engagement_score),

        # CTR (Yusuf)
        "impression_to_view_rate": safe(impression_to_view_rate),
        "ctr_impression_score": safe(ctr_impression_score),
        "ctr_vs_channel_avg": safe(ctr_vs_channel_avg),
        "ctr_category": int(ctr_category),

        # Rolling & Trend (Akmal)
        "rolling_mean_views_7d": safe(rolling_mean_views_7d),
        "views_trend_ratio": safe(views_trend_ratio),
        "rolling_cv_views": safe(rolling_cv_views),
        "is_declining": int(is_declining),
        "views_deviation": safe(views_deviation),

        # Revenue (Zahra)
        "revenue_per_view": safe(revenue_per_view),
        "is_monetized": int(is_monetized),
        "ad_impression_rate": safe(ad_impression_rate),
        "revenue_category": int(revenue_category),

        # Fitur tambahan untuk Model 3 (jika ada)
        "views": views,
        "ctr": ctr,
        "impressions": impressions,
        "retention_rate": retention_rate,
        "subscriber_gained": subscriber_gained,
    }


# Urutan 30 Fitur Model 1 XGBoost hasil Selected Features PKL (Urutan HARUS Sama!)
MODEL1_FEATURES = [
    "growth_1_to_2",
    "growth_3_to_4",
    "avg_growth_rate",
    "growth_trend",
    "peak_views",
    "view_velocity",
    "video_age_days",
    "day_of_week",
    "month",
    "is_weekend",
    "is_viral",
    "video_duration_sec",
    "like_rate",
    "dislike_rate",
    "comment_rate",
    "like_dislike_ratio",
    "engagement_score",
    "impression_to_view_rate",
    "ctr_impression_score",
    "ctr_vs_channel_avg",
    "ctr_category",
    "rolling_mean_views_7d",
    "views_trend_ratio",
    "rolling_cv_views",
    "is_declining",
    "views_deviation",
    "revenue_per_view",
    "is_monetized",
    "ad_impression_rate",
    "revenue_category",
]

# Daftar fitur untuk Model 3 (Isolation Forest)
MODEL3_FEATURES = [
    "views",
    "ctr",
    "impressions",
    "engagement_score",
    "retention_rate",
    "subscriber_gained",
    "video_age_days",
    "rolling_mean_views_7d",
]
