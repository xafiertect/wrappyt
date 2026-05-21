"""
Model Loader Utility
====================
Memuat semua asset ML (model .pkl, scaler) ke memory saat startup.
Mendukung 2 naming convention:
  - Multi-horizon: model1_xgboost_7d.pkl / model1_xgboost_14d.pkl / model1_xgboost_30d.pkl
  - Single (legacy): model1_xgboost_regression.pkl (fallback jika multi-horizon belum ada)
"""

import os
import logging
import joblib

logger = logging.getLogger(__name__)

_models: dict = {}
_is_loaded: bool = False


def _try_load(path: str):
    """Load .pkl jika ada, return None jika tidak."""
    if os.path.exists(path):
        obj = joblib.load(path)
        logger.info(f"[ModelLoader] Loaded: {os.path.basename(path)}")
        return obj
    return None


def load_all_models() -> None:
    """
    Memuat seluruh asset ML ke dictionary global _models.
    Dipanggil satu kali saat startup FastAPI (via lifespan event).
    """
    global _models, _is_loaded

    model_dir  = os.getenv("MODEL_PATH",  "./models")
    scaler_dir = os.getenv("SCALER_PATH", "./scalers")

    # ── Model 1: XGBoost Regression ──────────────────────────────────────────
    # Coba load versi multi-horizon dulu
    xgb_7d  = _try_load(os.path.join(model_dir, "model1_xgboost_7d.pkl"))
    xgb_14d = _try_load(os.path.join(model_dir, "model1_xgboost_14d.pkl"))
    xgb_30d = _try_load(os.path.join(model_dir, "model1_xgboost_30d.pkl"))

    # Fallback ke model single regression jika multi-horizon belum ada
    if not all([xgb_7d, xgb_14d, xgb_30d]):
        single = _try_load(os.path.join(model_dir, "model1_xgboost_regression.pkl"))
        if single:
            logger.warning(
                "[ModelLoader] Multi-horizon models tidak ditemukan. "
                "Menggunakan model1_xgboost_regression.pkl sebagai fallback untuk semua horizon."
            )
            xgb_7d = xgb_14d = xgb_30d = single
        else:
            logger.critical(
                "[ModelLoader] Tidak ada model XGBoost yang bisa dimuat. "
                "Endpoint /predict akan mengembalikan 503."
            )

    _models["xgb_7d"]  = xgb_7d
    _models["xgb_14d"] = xgb_14d
    _models["xgb_30d"] = xgb_30d

    # ── Scaler Model 1 ────────────────────────────────────────────────────────
    scaler_m1 = (
        _try_load(os.path.join(scaler_dir, "scaler_model1.pkl"))
        or _try_load(os.path.join(model_dir, "scaler.pkl"))  # legacy name
    )
    if scaler_m1 is None:
        logger.warning("[ModelLoader] Scaler Model 1 tidak ditemukan — prediksi mungkin error.")
    _models["scaler_m1"] = scaler_m1

    # ── Model 2: Prophet (optional) ───────────────────────────────────────────
    _models["prophet"] = _try_load(os.path.join(model_dir, "model2_prophet_timeseries.pkl"))
    if _models["prophet"] is None:
        logger.warning("[ModelLoader] Model 2 (Prophet) tidak ditemukan — endpoint /stats/forecast tidak aktif.")

    # ── Model 3: Isolation Forest ─────────────────────────────────────────────
    iso = _try_load(os.path.join(model_dir, "model3_isolation_forest.pkl"))
    _models["iso_forest"] = iso
    if iso is None:
        logger.warning("[ModelLoader] Model 3 (Isolation Forest) tidak ditemukan — deteksi anomali dinonaktifkan.")

    # Scaler Model 3
    scaler_m3 = _try_load(os.path.join(scaler_dir, "scaler_model3.pkl"))
    _models["scaler_m3"] = scaler_m3

    # ── Model Selected Features (opsional) ───────────────────────────────────
    _models["selected_features"] = _try_load(
        os.path.join(model_dir, "model1_selected_features.pkl")
    )

    _is_loaded = True
    loaded = [k for k, v in _models.items() if v is not None]
    logger.info(f"[ModelLoader] Startup selesai. Model aktif: {loaded}")


def get_model(key: str):
    """Mengambil asset dari registry. Raise RuntimeError jika belum dimuat."""
    if not _is_loaded:
        raise RuntimeError("Model belum dimuat. Pastikan load_all_models() dipanggil saat startup.")
    if key not in _models:
        raise KeyError(f"Asset '{key}' tidak terdaftar di registry model.")
    return _models[key]


def is_model_available(key: str) -> bool:
    """Cek apakah model tersedia dan bukan None."""
    return _is_loaded and _models.get(key) is not None
