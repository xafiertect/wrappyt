"""
Router: /predict
================
Endpoint prediksi views (Model 1 XGBoost) + deteksi anomali (Model 3 Isolation Forest).
Setiap request diproses dengan feature engineering on-the-fly sebelum masuk model.
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import PredictionInput, PredictionOutput, ViewsForecast, AnomalyResult, DeclineResult, ProjectionPoint
from utils.model_loader import get_model, is_model_available
from utils.feature_engineering import compute_features, MODEL1_FEATURES, MODEL3_FEATURES, MODEL4_FEATURES

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
        scaler_m1 = get_model("scaler_m1")
        X1 = pd.DataFrame([feats])[MODEL1_FEATURES].values
        X1_scaled = scaler_m1.transform(X1) if scaler_m1 is not None else X1

        # Dapatkan prediksi mentah model XGBoost
        xgb_model = get_model("xgb_30d") or get_model("xgb_7d") or get_model("xgb_14d")
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
        X3 = pd.DataFrame([feats])[MODEL3_FEATURES].values
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
    # Rule berbasis pengalaman Hippo Academy:
    #   ≥ 2.000 views per 2 jam pertama → VIRAL
    #   1.000 – 1.999 views per 2 jam   → NORMAL (borderline)
    #   < 1.000 views per 2 jam         → TIDAK VIRAL
    #
    # Normalisasi: hitung rate views per 2 jam berdasarkan usia video.
    # Jika video_age_hours tidak di-input, fallback ke video_age_days × 24.

    V0 = input_data.views
    age_hours = (
        input_data.video_age_hours
        if input_data.video_age_hours is not None
        else input_data.video_age_days * 24
    )

    # views_per_2h = kecepatan akumulasi views dinormalisasi ke per-2-jam
    if age_hours > 0:
        views_per_2h = (V0 / age_hours) * 2.0
    else:
        # Video baru sekali (< 1 jam), gunakan views langsung
        views_per_2h = float(V0)

    if views_per_2h >= 2000 and not anomaly_flag:
        status_label = "Viral"
        # Semakin jauh di atas 2000, semakin tinggi confidence
        confidence   = round(min(0.99, 0.70 + (views_per_2h - 2000) / 10000), 4)
    elif views_per_2h < 1000 or anomaly_flag:
        status_label = "Tidak Viral"
        if anomaly_flag and views_per_2h >= 1000:
            confidence = 0.80  # anomali override — meski views oke
        else:
            confidence = round(min(0.99, 0.55 + max(0.0, 1000 - views_per_2h) / 5000), 4)
    else:
        # Normal: 1.000 ≤ views_per_2h < 2.000
        status_label = "Normal"
        # Confidence dinamis: 0.42 (tepat di 1000) → 0.72 (mendekati 2000)
        # — tidak pernah 0 sehingga tidak membingungkan di frontend
        confidence   = round(min(0.72, max(0.42, 0.42 + (views_per_2h - 1000) / 3333)), 4)

    is_viral = status_label == "Viral"

    # Power-law interpolation realistis berbasis timeline 30 hari (720 jam) untuk 1, 2, dan 3 hari
    V1 = max(0, int(V0 + (raw_pred - V0) * (24 / 720) ** 0.5))
    V2 = max(0, int(V0 + (raw_pred - V0) * (48 / 720) ** 0.5))
    V3 = max(0, int(V0 + (raw_pred - V0) * (72 / 720) ** 0.5))

    # Buat data titik koordinat chart proyeksi (termasuk interval per jam antara Hari 1-2)
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
            X4 = pd.DataFrame([feats])[MODEL4_FEATURES].values
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
        recommendation=recommendation,
    )
