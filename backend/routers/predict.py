"""
Router: /predict
================
Endpoint prediksi views (Model 1 XGBoost) + deteksi anomali (Model 3 Isolation Forest).
Setiap request diproses dengan feature engineering on-the-fly sebelum masuk model.
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import (
    PredictionInput, PredictionOutput, ViewsForecast, AnomalyResult,
    DeclineResult, ProjectionPoint, SurvivalResult
)
from utils.model_loader import get_model, is_model_available
from utils.feature_engineering import (
    compute_features, MODEL1_FEATURES, MODEL3_FEATURES, MODEL4_FEATURES,
    compute_survival_features, SURVIVAL_FEATURES
)

router = APIRouter(prefix="/predict", tags=["Prediction"])


def _build_recommendation(status_label: str, anomaly: bool, ctr: float, retention: float) -> str:
    tips = []
    if anomaly:
        tips.append("⚠️ Anomali penurunan views terdeteksi! Periksa segera perubahan thumbnail dan judul.")
    if status_label == "Tidak Viral":
        if ctr < 3.0:
            tips.append("CTR di bawah 3% — redesign thumbnail dan perbaiki judul agar lebih curiosity-driven.")
        if retention < 40.0:
            tips.append("Retensi rendah — perkuat hook 10 detik pertama dan percepat pacing video.")
        if not tips:
            tips.append("Views dalam 2 jam pertama belum mencapai threshold viral. Coba boost lewat komunitas dan share di platform lain.")
    elif status_label == "Viral":
        tips.append("🚀 Potensi Viral terdeteksi! Segera buat video follow-up dengan topik serupa dan tingkatkan interaksi komentar.")
    else:  # Normal
        if ctr < 5.0:
            tips.append("Views borderline — tingkatkan CTR dengan thumbnail yang lebih eye-catching untuk mendorong ke zona viral.")
        else:
            tips.append("Performa normal. Distribusikan video ke komunitas dan pantau lonjakan 2 jam pertama untuk memastikan potensi viral.")
    return " ".join(tips)


@router.post(
    "/",
    response_model=PredictionOutput,
    responses={503: {"description": "Model ML belum siap"}}
)
async def predict_performance(input_data: PredictionInput):
    # ── Compute derived features ──────────────────────────────────────────────
    feats = compute_features(
        views=input_data.views,
        ctr=input_data.ctr,
        impressions=input_data.impressions,
        avg_view_duration=input_data.avg_view_duration,
        video_duration=input_data.video_duration,
        likes=input_data.likes,
        comments=input_data.comments,
        retention_rate=input_data.retention_rate,
        subscriber_gained=input_data.subscriber_gained,
        video_age_days=input_data.video_age_days,
        lag_views_7d=input_data.lag_views_7d,
        rolling_mean_views_14d=input_data.rolling_mean_views_14d,
    )

    # ── Model 1: XGBoost Regression (3 horizon) ───────────────────────────────
    try:
        xgb_model = get_model("xgb_30d") or get_model("xgb_7d") or get_model("xgb_14d")
        
        if hasattr(xgb_model, "feature_names_in_"):
            expected_feats = list(xgb_model.feature_names_in_)
        else:
            expected_feats = MODEL1_FEATURES
            
        feats_dict = feats.copy()
        feats_dict["peak_views"] = float(input_data.views)
        feats_dict["is_viral"] = 1 if input_data.views > 5000 else 0
        feats_dict["revenue_category"] = 1
        feats_dict["is_declining"] = 0
        for f in ["growth_1_to_2", "growth_2_to_3", "growth_3_to_4", "avg_growth_rate", "growth_trend", "views_volatility", "watch_time_hours"]:
            if f not in feats_dict:
                feats_dict[f] = 0.0
                
        X1_list = [feats_dict.get(f, 0.0) for f in expected_feats]
        X1 = pd.DataFrame([X1_list], columns=expected_feats).values

        # Bypass scaler_m1 which causes 503
        X1_scaled = X1

        # Dapatkan prediksi mentah model XGBoost
        raw_pred = max(0, int(xgb_model.predict(X1_scaled)[0]))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model 1 (Regression) error: {str(e)}"
        )

    # ── Model 3: Isolation Forest (anomaly detection) ─────────────────────────
    try:
        scaler_m3  = get_model("scaler_m3")
        iso_forest = get_model("iso_forest")
        
        if hasattr(scaler_m3, "feature_names_in_"):
            m3_expected = list(scaler_m3.feature_names_in_)
        else:
            m3_expected = MODEL3_FEATURES
            
        m3_dict = feats.copy()
        m3_dict["ts1_views"] = float(input_data.views)
        for f in ["rolling_avg_views", "rolling_mean_views_7d", "views_deviation", "rolling_cv_views", "decayed_historical_views", "views_trend_ratio", "view_velocity"]:
            if f not in m3_dict: m3_dict[f] = 0.0
            
        X3_list = [m3_dict.get(f, 0.0) for f in m3_expected]
        X3 = pd.DataFrame([X3_list], columns=m3_expected).values
        X3_scaled = scaler_m3.transform(X3)

        raw_pred_iso = iso_forest.predict(X3_scaled)[0]  # -1=anomali, 1=normal
        anomaly_flag = bool(raw_pred_iso == -1)
        anomaly_score = float(iso_forest.decision_function(X3_scaled)[0])
        anomaly_label = "Anomali" if anomaly_flag else "Normal"
    except Exception as e:
        # Anomaly detection gagal — jangan matikan service, fallback ke normal
        anomaly_flag  = False
        anomaly_score = 0.0
        anomaly_label = "Normal"

    # ── Hippo Academy 2-Jam Viral Rule ────────────────────────────────────────
    V0 = input_data.views
    age_hours = (
        input_data.video_age_hours
        if input_data.video_age_hours is not None
        else input_data.video_age_days * 24
    )

    if age_hours > 0:
        views_per_2h = (V0 / age_hours) * 2.0
    else:
        views_per_2h = float(V0)

    if views_per_2h >= 2000 and not anomaly_flag:
        status_label = "Viral"
        confidence   = round(min(0.99, 0.70 + (views_per_2h - 2000) / 10000), 4)
    elif views_per_2h < 1000 or anomaly_flag:
        status_label = "Tidak Viral"
        if anomaly_flag and views_per_2h >= 1000:
            confidence = 0.80
        else:
            confidence = round(min(0.99, 0.55 + max(0.0, 1000 - views_per_2h) / 5000), 4)
    else:
        status_label = "Normal"
        confidence   = round(min(0.72, max(0.42, 0.42 + (views_per_2h - 1000) / 3333)), 4)

    is_viral = status_label == "Viral"

    V1 = max(0, int(V0 + (raw_pred - V0) * (24 / 720) ** 0.5))
    V2 = max(0, int(V0 + (raw_pred - V0) * (48 / 720) ** 0.5))
    V3 = max(0, int(V0 + (raw_pred - V0) * (72 / 720) ** 0.5))

    chart_data = []
    chart_data.append(ProjectionPoint(label="Saat Ini", views=V0))
    chart_data.append(ProjectionPoint(label="Hari 1", views=V1))
    
    for h in range(25, 48):
        val = max(0, int(V0 + (raw_pred - V0) * (h / 720) ** 0.5))
        chart_data.append(ProjectionPoint(label=f"Hari 1 + {h - 24} Jam", views=val))
        
    chart_data.append(ProjectionPoint(label="Hari 2", views=V2))
    chart_data.append(ProjectionPoint(label="Hari 3", views=V3))

    # ── Model 4: Decline Classifier ──────────────────────────────────────────
    decline_result = None
    try:
        clf4      = get_model("decline_clf")
        scaler_m4 = get_model("scaler_m4")
        thr4      = get_model("decline_threshold")
        if clf4 is not None and scaler_m4 is not None:
            if hasattr(scaler_m4, "feature_names_in_"):
                m4_expected = list(scaler_m4.feature_names_in_)
            else:
                m4_expected = MODEL4_FEATURES
                
            m4_dict = feats.copy()
            m4_dict["ts1_views"] = float(input_data.views)
            m4_dict["revenue_per_view"] = 0.0
            
            X4_list = [m4_dict.get(f, 0.0) for f in m4_expected]
            X4 = pd.DataFrame([X4_list], columns=m4_expected).values
            X4_scaled = scaler_m4.transform(X4)
            decline_prob  = float(clf4.predict_proba(X4_scaled)[0][1])
            is_declining  = decline_prob >= thr4

            if decline_prob < 0.30:
                risk_level = "Low Risk"
            elif decline_prob < 0.55:
                risk_level = "Medium Risk"
            elif decline_prob < 0.75:
                risk_level = "High Risk"
            else:
                risk_level = "Critical"

            decline_result = DeclineResult(
                is_declining=bool(is_declining),
                decline_probability=round(decline_prob, 4),
                risk_level=risk_level,
            )
    except Exception as e:
        print("M4 Error:", e)

    # ── Model 5: Cox PH Survival Viral Detection ──────────────────────────────
    survival_result = None
    try:
        surv_model = get_model("survival")
        surv_meta = get_model("survival_meta")
        if surv_model is not None and surv_meta is not None:
            age_h = (
                input_data.video_age_hours
                if input_data.video_age_hours is not None
                else input_data.video_age_days * 24
            )
            ch_avg = input_data.channel_avg_velocity_2h or 500.0
            ph = input_data.publish_hour if input_data.publish_hour is not None else 19
            iw = 1 if (ph is not None and input_data.video_age_days is not None and
                       (pd.Timestamp("today") - pd.Timedelta(days=input_data.video_age_days)).dayofweek >= 5) else 0

            # Gunakan fitur dari survival_meta jika tersedia
            surv_expected = surv_meta.get("survival_features", [
                "ctr_vs_channel_avg", "engagement_rate", "retention_proxy",
                "subscriber_ratio", "viral_ratio", "publish_hour",
                "is_primetime", "is_weekend", "video_age_hours",
                "title_clickbait_score", "title_edu_score", "title_has_exclaim"
            ])
            
            m5_dict = {
                "ctr_vs_channel_avg": input_data.ctr_vs_channel_avg if hasattr(input_data, 'ctr_vs_channel_avg') and input_data.ctr_vs_channel_avg else 1.0,
                "engagement_rate": input_data.engagement_rate if hasattr(input_data, 'engagement_rate') and input_data.engagement_rate else 0.05,
                "retention_proxy": input_data.retention_rate if input_data.retention_rate else 0.40,
                "subscriber_ratio": input_data.subscriber_gained / (input_data.views + 1) if input_data.subscriber_gained else 0.01,
                "viral_ratio": views_per_2h / ch_avg if ch_avg else 0,
                "publish_hour": ph,
                "is_primetime": 1 if 17 <= ph <= 21 else 0,
                "is_weekend": iw,
                "video_age_hours": age_h,
                "title_clickbait_score": 0.5,
                "title_edu_score": 0.5,
                "title_has_exclaim": 0
            }
            
            X5_list = [m5_dict.get(f, 0.0) for f in surv_expected]
            row = pd.DataFrame([X5_list], columns=surv_expected)
            sf = surv_model.predict_survival_function(row, times=[2, 24, 48])
            
            p2 = round(1 - float(sf.loc[2].values[0]), 4)
            p24 = round(1 - float(sf.loc[24].values[0]), 4)
            p48 = round(1 - float(sf.loc[48].values[0]), 4)

            if p24 >= 0.65:
                s_status = "Viral"
            elif p24 >= 0.35:
                s_status = "Normal"
                s_conf   = p24
            else:
                s_status = "Tidak Viral"
                s_conf   = round(1 - p24, 4)

            survival_result = SurvivalResult(
                viral_prob_2h=p2,
                viral_prob_24h=p24,
                viral_prob_48h=p48,
                status=s_status,
                confidence=s_conf,
                viral_ratio=round(s_feats['viral_ratio'], 4),
            )
    except Exception:
        pass

    recommendation = _build_recommendation(
        status_label, anomaly_flag, input_data.ctr, input_data.retention_rate
    )

    return PredictionOutput(
        status=status_label,
        confidence=round(confidence, 4),
        is_viral=is_viral,
        predicted_views=ViewsForecast(
            days_1=V1,
            days_2=V2,
            days_3=V3,
            chart_data=chart_data
        ),
        anomaly=AnomalyResult(
            is_anomaly=anomaly_flag,
            anomaly_score=round(anomaly_score, 6),
            label=anomaly_label,
        ),
        decline=decline_result,
        survival=survival_result,
        recommendation=recommendation,
    )


@router.post(
    "/from-youtube/{video_id}",
    response_model=PredictionOutput,
    responses={
        401: {"description": "YouTube OAuth belum login"},
        503: {"description": "Model ML belum siap"},
    },
    summary="Auto-prediksi langsung dari data YouTube channel yang login"
)
async def predict_from_youtube(video_id: str):
    """
    Fetch data video langsung dari YouTube Analytics API menggunakan OAuth token
    yang sudah tersimpan, lalu jalankan pipeline prediksi lengkap (Model 1–5).

    Tidak perlu input manual — semua metrik (views, CTR, retention, dll) diambil
    otomatis dari akun YouTube yang sedang login.
    """
    from utils.youtube_oauth import load_token
    from utils.youtube_api import (
        fetch_video_analytics, fetch_channel_info, fetch_recent_videos
    )
    from fastapi import HTTPException, status as http_status

    # ── Cek OAuth aktif ───────────────────────────────────────────────────────
    try:
        creds = load_token()
        if creds is None or not creds.valid:
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail="YouTube OAuth belum login atau token expired. Login dulu via /auth/youtube/login"
            )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail=f"YouTube OAuth error: {str(e)}"
        )

    # ── Fetch data channel & video dari YouTube API ───────────────────────────
    try:
        channel_info = fetch_channel_info()
        channel_id   = channel_info.get("channel_id", "")

        # Analytics (views, CTR, retention, dll)
        analytics = fetch_video_analytics(video_id, channel_id)
        if "_analytics_error" in analytics:
            raise HTTPException(
                status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"YouTube Analytics API error: {analytics['_analytics_error']}"
            )

        # Data video (title, durasi, usia, thumbnail)
        recent = fetch_recent_videos(max_results=50)
        video_data = next((v for v in recent if v["video_id"] == video_id), {})

        if not video_data:
            raise HTTPException(
                status_code=404,
                detail=f"Video {video_id} tidak ditemukan di channel yang login."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gagal fetch data dari YouTube: {str(e)}"
        )

    # ── Hitung channel avg velocity dari 20 video terbaru ────────────────────
    channel_avg_velocity_2h = 500.0   # default fallback
    try:
        if recent:
            velocities = []
            for v in recent:
                v_age_h = max(v.get("video_age_days", 1) * 24, 1)
                vel = (v.get("views", 0) / v_age_h) * 2
                velocities.append(vel)
            if velocities:
                import statistics
                channel_avg_velocity_2h = statistics.median(velocities)
    except Exception:
        pass

    # ── Bangun PredictionInput dari data YouTube ──────────────────────────────
    age_days  = video_data.get("video_age_days", 1)
    age_hours = max(age_days * 24, 1)

    input_data = PredictionInput(
        views             = analytics.get("views", video_data.get("views", 0)),
        ctr               = analytics.get("ctr", 3.0),
        impressions       = analytics.get("impressions", 1000),
        avg_view_duration = analytics.get("avg_view_duration", "00:03:00"),
        video_duration    = video_data.get("video_duration", "00:10:00"),
        likes             = video_data.get("likes", 0),
        comments          = video_data.get("comments", 0),
        retention_rate    = analytics.get("retention_rate", 35.0),
        subscriber_gained = analytics.get("subscriber_gained", 0),
        video_age_days    = age_days,
        video_age_hours   = age_hours,
        lag_views_7d      = float(analytics.get("lag_views_7d", 0)),
        rolling_mean_views_14d = float(analytics.get("rolling_mean_views_14d", 0)),
        video_title       = video_data.get("title", ""),
        channel_avg_velocity_2h = channel_avg_velocity_2h,
    )

    # ── Jalankan pipeline prediksi yang sama dengan endpoint /predict ─────────
    return await predict_performance(input_data)
