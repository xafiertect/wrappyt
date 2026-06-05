"""
Feature Engineering Utility
============================
Melakukan preprocessing dan derived feature generation on-the-fly
terhadap payload request sebelum dikirim ke model ML.

Model 1 (XGBoost Regression) : 22 features — model1_selected_features.pkl
Model 3 (Isolation Forest)   : 12 features — model3_anomaly_features.pkl
Model 4 (Decline Classifier) : 25 features — model4_selected_features.pkl

Semua feature diturunkan dari input API yang tersedia — tidak ada data leakage.
ts1_views = views (current views saat input, setara ts1 snapshot dalam training).
"""

import math
from typing import Union


def time_str_to_seconds(t: Union[str, float, None]) -> float:
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
    avg_view_sec       = time_str_to_seconds(avg_view_duration)
    video_duration_sec = time_str_to_seconds(video_duration)

    # ── Rolling baseline (dari input atau fallback ke current views) ──────────
    rolling_mean = rolling_mean_views_14d if rolling_mean_views_14d > 0 else float(views)
    lag_views    = lag_views_7d           if lag_views_7d > 0           else float(views)

    # ── Engagement ────────────────────────────────────────────────────────────
    like_rate               = likes / (views + 1)
    dislike_rate            = (likes * 0.05) / (views + 1)
    comment_rate            = comments / (views + 1)
    like_dislike_ratio      = likes / (likes * 0.05 + 1)
    comment_engagement_ratio= comments / (comments + likes + 1)
    retention_proxy         = avg_view_sec / (video_duration_sec + 1)
    engagement_score        = (like_rate * 0.5) + (comment_rate * 0.3) + (retention_proxy * 0.2)

    # ── CTR & Impressions ─────────────────────────────────────────────────────
    ctr_normalized         = ctr / 100.0
    impression_to_view_rate= views / (impressions + 1)
    ctr_impression_score   = ctr_normalized * impression_to_view_rate
    ctr_vs_channel_avg     = ctr / 5.0          # asumsi channel average 5%
    impressions_log        = math.log1p(impressions)

    if ctr < 3.0:
        ctr_category = 0
    elif ctr <= 7.0:
        ctr_category = 1
    else:
        ctr_category = 2

    # ── Temporal (hardcoded defaults — user tidak menginput tanggal) ──────────
    day_of_week = 4   # Jumat
    month       = 5   # Mei
    is_weekend  = 0

    # ── Rolling & Trend ───────────────────────────────────────────────────────
    rolling_cv_views      = 0.15
    rolling_std_est       = rolling_mean * rolling_cv_views + 1.0
    rolling_avg_views     = rolling_mean
    rolling_avg_views_15  = rolling_mean
    rolling_mean_views_7d = rolling_mean
    ema_views_5           = rolling_mean   # approx: no multi-step history available
    views_trend_ratio     = views / (rolling_mean + 1)
    views_deviation       = (views - rolling_mean) / rolling_std_est

    # ── Time decay ────────────────────────────────────────────────────────────
    HALF_LIFE    = 365
    decay_weight = math.exp(-math.log(2) / HALF_LIFE * max(video_age_days, 1))
    decayed_historical_views = rolling_mean * decay_weight

    # ── Velocity ──────────────────────────────────────────────────────────────
    view_velocity = views / (video_age_days + 1)

    # ── Revenue ───────────────────────────────────────────────────────────────
    revenue_per_view      = 150.0           # IDR per view (estimasi)
    is_monetized          = 1
    ad_impression_rate    = 0.85
    total_revenue_est     = revenue_per_view * views
    revenue_per_subscriber= total_revenue_est / (subscriber_gained + 1)
    adsense_share         = 0.80
    premium_share         = 0.05
    revenue_idr_log       = math.log1p(total_revenue_est)

    def safe(v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            return 0.0
        return round(v, 6)

    return {
        # ── Anchor: current views = ts1 equivalent ────────────────────────────
        "ts1_views":               int(views),

        # ── Engagement ────────────────────────────────────────────────────────
        "like_rate":               safe(like_rate),
        "dislike_rate":            safe(dislike_rate),
        "comment_rate":            safe(comment_rate),
        "like_dislike_ratio":      safe(like_dislike_ratio),
        "comment_engagement_ratio":safe(comment_engagement_ratio),
        "engagement_score":        safe(engagement_score),
        "retention_proxy":         safe(retention_proxy),

        # ── CTR & Impressions ─────────────────────────────────────────────────
        "ctr_normalized":          safe(ctr_normalized),
        "impression_to_view_rate": safe(impression_to_view_rate),
        "ctr_impression_score":    safe(ctr_impression_score),
        "ctr_vs_channel_avg":      safe(ctr_vs_channel_avg),
        "impressions_log":         safe(impressions_log),
        "ctr_category":            int(ctr_category),

        # ── Rolling & Trend ───────────────────────────────────────────────────
        "rolling_avg_views":       safe(rolling_avg_views),
        "rolling_avg_views_15":    safe(rolling_avg_views_15),
        "rolling_mean_views_7d":   safe(rolling_mean_views_7d),
        "ema_views_5":             safe(ema_views_5),
        "views_trend_ratio":       safe(views_trend_ratio),
        "rolling_cv_views":        safe(rolling_cv_views),
        "views_deviation":         safe(views_deviation),
        "decayed_historical_views":safe(decayed_historical_views),

        # ── Velocity & Age ────────────────────────────────────────────────────
        "view_velocity":           safe(view_velocity),
        "video_age_days":          int(video_age_days),
        "day_of_week":             int(day_of_week),
        "month":                   int(month),
        "is_weekend":              int(is_weekend),
        "video_duration_sec":      safe(video_duration_sec),

        # ── Revenue ───────────────────────────────────────────────────────────
        "revenue_per_view":        safe(revenue_per_view),
        "revenue_per_subscriber":  safe(revenue_per_subscriber),
        "adsense_share":           safe(adsense_share),
        "premium_share":           safe(premium_share),
        "ad_impression_rate":      safe(ad_impression_rate),
        "is_monetized":            int(is_monetized),
        "revenue_idr_log":         safe(revenue_idr_log),

        # ── Raw pass-through ──────────────────────────────────────────────────
        "ctr":              ctr,
        "impressions":      int(impressions),
        "retention_rate":   retention_rate,
        "subscriber_gained":int(subscriber_gained),
    }


# ── Model 1: 22 Features XGBoost Regression ───────────────────────────────────
# Urutan HARUS identik dengan training — dikonfirmasi dari model1_selected_features.pkl
MODEL1_FEATURES = [
    "ts1_views",
    "like_rate",
    "dislike_rate",
    "comment_rate",
    "like_dislike_ratio",
    "engagement_score",
    "impression_to_view_rate",
    "ctr_impression_score",
    "ctr_vs_channel_avg",
    "impressions_log",
    "ctr_category",
    "rolling_avg_views_15",
    "rolling_cv_views",
    "views_trend_ratio",
    "views_deviation",
    "video_age_days",
    "day_of_week",
    "month",
    "is_weekend",
    "video_duration_sec",
    "revenue_per_view",
    "is_monetized",
]

# ── Model 3: 12 Features Isolation Forest ─────────────────────────────────────
# Dikonfirmasi dari model3_anomaly_features.pkl
MODEL3_FEATURES = [
    "ts1_views",
    "rolling_avg_views",
    "rolling_mean_views_7d",
    "views_deviation",
    "engagement_score",
    "ctr_impression_score",
    "retention_proxy",
    "views_trend_ratio",
    "view_velocity",
    "video_age_days",
    "rolling_cv_views",
    "decayed_historical_views",
]

# ── Model 4: 25 Features Decline Classifier ───────────────────────────────────
# Dikonfirmasi dari model4_selected_features.pkl
MODEL4_FEATURES = [
    "video_age_days",
    "day_of_week",
    "month",
    "is_weekend",
    "video_duration_sec",
    "like_rate",
    "dislike_rate",
    "comment_rate",
    "like_dislike_ratio",
    "comment_engagement_ratio",
    "engagement_score",
    "impression_to_view_rate",
    "ctr_normalized",
    "ctr_impression_score",
    "ctr_category",
    "ema_views_5",
    "rolling_cv_views",
    "revenue_per_view",
    "revenue_per_subscriber",
    "adsense_share",
    "premium_share",
    "ad_impression_rate",
    "is_monetized",
    "revenue_idr_log",
    "ts1_views",
]
