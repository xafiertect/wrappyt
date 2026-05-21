"""
Router: /predict
================
Endpoint prediksi views (Model 1 XGBoost) + deteksi anomali (Model 3 Isolation Forest).
Setiap request diproses dengan feature engineering on-the-fly sebelum masuk model.
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, status

from schemas.prediction import PredictionInput, PredictionOutput, ViewsForecast, AnomalyResult
from utils.model_loader import get_model, is_model_available
from utils.feature_engineering import compute_features, MODEL1_FEATURES, MODEL3_FEATURES

router = APIRouter(prefix="/predict", tags=["Prediction"])


def _build_recommendation(status_label: str, anomaly: bool, ctr: float, retention: float) -> str:
    tips = []
    if anomaly:
        tips.append("⚠️ Anomali penurunan views terdeteksi! Periksa segera perubahan thumbnail dan judul.")
    if status_label == "Declining":
        if ctr < 3.0:
            tips.append("CTR di bawah 3% — redesign thumbnail dan perbaiki judul agar lebih curiosity-driven.")
        if retention < 40.0:
            tips.append("Retensi rendah — perkuat hook 10 detik pertama dan percepat pacing video.")
        if not tips:
            tips.append("Performa sedang menurun. Coba konsistensi jadwal upload dan perbanyak engagement di komentar.")
    elif status_label == "Viral":
        tips.append("🚀 Performa Viral! Segera buat video follow-up dengan topik serupa dan tingkatkan interaksi komentar.")
    else:
        tips.append("Performa stabil. Pertahankan konsistensi dan pantau metrik CTR serta retensi secara rutin.")
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

        pred_7d  = max(0, int(get_model("xgb_7d").predict(X1_scaled)[0]))
        pred_14d = max(0, int(get_model("xgb_14d").predict(X1_scaled)[0]))
        pred_30d = max(0, int(get_model("xgb_30d").predict(X1_scaled)[0]))
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

        raw_pred     = iso_forest.predict(X3_scaled)[0]  # -1=anomali, 1=normal
        anomaly_flag = bool(raw_pred == -1)
        anomaly_score = float(iso_forest.decision_function(X3_scaled)[0])
        anomaly_label = "Anomali" if anomaly_flag else "Normal"
    except Exception as e:
        # Anomaly detection gagal — jangan matikan service, fallback ke normal
        anomaly_flag  = False
        anomaly_score = 0.0
        anomaly_label = "Normal"

    # ── Tentukan status channel berdasarkan tren prediksi ────────────────────
    trend_ratio = pred_7d / (input_data.views + 1)
    if trend_ratio > 1.5:
        status_label = "Viral"
        confidence   = min(0.99, trend_ratio / 3)
    elif trend_ratio < 0.7 or anomaly_flag:
        status_label = "Declining"
        confidence   = min(0.99, 1 - trend_ratio)
    else:
        status_label = "Normal"
        confidence   = 0.75

    recommendation = _build_recommendation(
        status_label, anomaly_flag, input_data.ctr, input_data.retention_rate
    )

    return PredictionOutput(
        status=status_label,
        confidence=round(confidence, 4),
        predicted_views=ViewsForecast(days_7=pred_7d, days_14=pred_14d, days_30=pred_30d),
        anomaly=AnomalyResult(
            is_anomaly=anomaly_flag,
            anomaly_score=round(anomaly_score, 6),
            label=anomaly_label,
        ),
        recommendation=recommendation,
    )
