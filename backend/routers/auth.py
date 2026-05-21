"""
Router: /auth
=============
Endpoint OAuth 2.0 untuk koneksi akun YouTube.
Mengelola login, callback, status autentikasi, dan pengambilan data real-time channel.
"""

import os
import secrets

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from utils.youtube_oauth import (
    build_flow, save_token, is_authenticated,
    is_configured, delete_token
)
from utils.youtube_api import (
    fetch_channel_info, fetch_recent_videos, fetch_video_analytics
)

router = APIRouter(prefix="/auth", tags=["YouTube OAuth"])

# State CSRF — disimpan di memory (cukup untuk single-user local app)
_oauth_state: str = ""


@router.get("/youtube/login")
async def youtube_login():
    """Memulai flow OAuth 2.0. Redirect ke halaman consent Google."""
    global _oauth_state

    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Integrasi YouTube belum dikonfigurasi. Tambahkan YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET di .env"
        )

    flow = build_flow()
    _oauth_state = secrets.token_urlsafe(16)

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=_oauth_state,
        prompt="consent"
    )
    return RedirectResponse(url=auth_url)


@router.get("/youtube/callback")
async def youtube_callback(code: str = "", state: str = "", error: str = ""):
    """Callback dari Google setelah user menyetujui OAuth."""
    global _oauth_state

    # Handle user rejection
    if error:
        return RedirectResponse(url="http://localhost:5173/?yt_error=access_denied")

    # Validasi CSRF state
    if not state or state != _oauth_state:
        raise HTTPException(status_code=400, detail="Request OAuth tidak valid. Coba login ulang.")

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code tidak ditemukan.")

    try:
        flow = build_flow()
        flow.fetch_token(code=code)
        save_token(flow.credentials)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menukar token: {str(e)}")

    return RedirectResponse(url="http://localhost:5173/?yt_connected=true")


@router.get("/youtube/status")
async def youtube_status():
    """Cek apakah user sudah terhubung dengan akun YouTube."""
    authenticated = is_authenticated()
    configured = is_configured()
    return {
        "is_authenticated": authenticated,
        "is_configured": configured,
    }


@router.get("/youtube/logout")
async def youtube_logout():
    """Hapus token OAuth — user harus login ulang untuk reconnect."""
    delete_token()
    return {"message": "Berhasil logout dari akun YouTube."}


@router.get("/youtube/channel")
async def get_channel_data(max_videos: int = 20):
    """
    Mengambil data channel dan daftar video terbaru secara real-time.
    Memerlukan autentikasi OAuth aktif.
    """
    if not is_authenticated():
        raise HTTPException(
            status_code=401,
            detail="Sesi YouTube telah habis. Silakan login ulang."
        )

    try:
        channel = fetch_channel_info()
        videos = fetch_recent_videos(max_results=max_videos)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil data channel: {str(e)}")

    return {
        "status": "success",
        "channel": channel,
        "videos": videos,
    }


@router.get("/youtube/video/{video_id}/metrics")
async def get_video_metrics(video_id: str):
    """
    Mengambil semua metrik real-time sebuah video dari YouTube Analytics API.
    Data dikembalikan dalam format siap pakai untuk form prediksi ML.
    """
    if not is_authenticated():
        raise HTTPException(
            status_code=401,
            detail="Sesi YouTube telah habis. Silakan login ulang."
        )

    try:
        channel = fetch_channel_info()
        channel_id = channel.get("channel_id", "")

        # Ambil info dasar video (durasi, age, likes, comments)
        videos = fetch_recent_videos(max_results=50)
        video_info = next((v for v in videos if v["video_id"] == video_id), None)

        if not video_info:
            raise HTTPException(status_code=404, detail="Video tidak ditemukan di channel Anda.")

        # Ambil data analytics (CTR, retensi, impressions, dll.)
        analytics = fetch_video_analytics(video_id, channel_id)

        # Gabungkan data video + analytics menjadi metrik lengkap
        metrics = {
            "views":                    video_info["views"],
            "likes":                    video_info["likes"],
            "comments":                 video_info["comments"],
            "video_duration":           video_info["video_duration"],
            "video_age_days":           video_info["video_age_days"],
            # Data dari Analytics API (jika tersedia)
            "ctr":                      analytics.get("ctr", 5.0),
            "impressions":              analytics.get("impressions", 100000),
            "avg_view_duration":        analytics.get("avg_view_duration", "00:03:00"),
            "retention_rate":           analytics.get("retention_rate", 35.0),
            "subscriber_gained":        analytics.get("subscriber_gained", 0),
            "lag_views_7d":             analytics.get("lag_views_7d", int(video_info["views"] * 0.8)),
            "rolling_mean_views_14d":   analytics.get("rolling_mean_views_14d", int(video_info["views"] * 0.9)),
        }

        return {
            "status": "success",
            "video_title": video_info["title"],
            "thumbnail": video_info["thumbnail"],
            "published_at": video_info["published_at"],
            "analytics_available": "_analytics_error" not in analytics,
            "metrics": metrics,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil metrik video: {str(e)}")
