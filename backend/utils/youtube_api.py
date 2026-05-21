"""
YouTube Data API v3 + Analytics Wrapper
========================================
Fungsi-fungsi untuk mengambil data channel, video, dan analytics real-time.
Semua fungsi menggunakan credentials dari youtube_oauth.py.
"""

import isodate
from datetime import date, datetime, timedelta, timezone
from googleapiclient.discovery import build
from .youtube_oauth import load_token

# Cache sederhana untuk menghindari quota berlebihan
_channel_cache: dict = {}
_cache_timestamp: datetime | None = None
CACHE_TTL_MINUTES = 15


def _is_cache_valid() -> bool:
    if _cache_timestamp is None:
        return False
    return (datetime.now(timezone.utc) - _cache_timestamp).seconds < (CACHE_TTL_MINUTES * 60)


def _get_youtube():
    creds = load_token()
    return build("youtube", "v3", credentials=creds)


def _get_analytics():
    creds = load_token()
    return build("youtubeAnalytics", "v2", credentials=creds)


def _seconds_to_hhmmss(seconds: float) -> str:
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{sec:02d}"


def fetch_channel_info() -> dict:
    """Ambil info dasar channel yang sedang login."""
    global _channel_cache, _cache_timestamp

    if _is_cache_valid() and _channel_cache:
        return _channel_cache

    yt = _get_youtube()
    resp = yt.channels().list(
        part="snippet,statistics,contentDetails",
        mine=True,
        fields="items(id,snippet(title,thumbnails/default/url),statistics(subscriberCount,viewCount,videoCount),contentDetails/relatedPlaylists/uploads)"
    ).execute()

    if not resp.get("items"):
        return {}

    ch = resp["items"][0]
    result = {
        "channel_id": ch["id"],
        "title": ch["snippet"]["title"],
        "thumbnail": ch["snippet"]["thumbnails"]["default"]["url"],
        "subscriber_count": int(ch["statistics"].get("subscriberCount", 0)),
        "total_views": int(ch["statistics"].get("viewCount", 0)),
        "video_count": int(ch["statistics"].get("videoCount", 0)),
        "uploads_playlist_id": ch["contentDetails"]["relatedPlaylists"]["uploads"],
    }

    _channel_cache = result
    _cache_timestamp = datetime.now(timezone.utc)
    return result


def fetch_recent_videos(max_results: int = 20) -> list[dict]:
    """Ambil daftar video terbaru dari channel (dari uploads playlist)."""
    yt = _get_youtube()
    channel = fetch_channel_info()
    uploads_id = channel.get("uploads_playlist_id")

    if not uploads_id:
        return []

    # Ambil playlist items (video ID saja)
    pl_resp = yt.playlistItems().list(
        part="contentDetails",
        playlistId=uploads_id,
        maxResults=min(max_results, 50),
        fields="items/contentDetails/videoId"
    ).execute()

    video_ids = [item["contentDetails"]["videoId"] for item in pl_resp.get("items", [])]
    if not video_ids:
        return []

    # Ambil detail video (statistik + durasi)
    vids_resp = yt.videos().list(
        part="snippet,statistics,contentDetails",
        id=",".join(video_ids),
        fields="items(id,snippet(title,publishedAt,thumbnails/medium/url),statistics(viewCount,likeCount,commentCount),contentDetails/duration)"
    ).execute()

    results = []
    for v in vids_resp.get("items", []):
        # Parse durasi ISO 8601 → HH:MM:SS
        raw_duration = v["contentDetails"]["duration"]
        try:
            dur_sec = int(isodate.parse_duration(raw_duration).total_seconds())
        except Exception:
            dur_sec = 0
        video_duration = _seconds_to_hhmmss(dur_sec)

        # Hitung usia video dalam hari
        published_str = v["snippet"]["publishedAt"]
        published_dt = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        age_days = (datetime.now(timezone.utc) - published_dt).days

        results.append({
            "video_id": v["id"],
            "title": v["snippet"]["title"],
            "thumbnail": v["snippet"]["thumbnails"].get("medium", {}).get("url", ""),
            "published_at": published_str,
            "video_age_days": age_days,
            "views": int(v["statistics"].get("viewCount", 0)),
            "likes": int(v["statistics"].get("likeCount", 0)),
            "comments": int(v["statistics"].get("commentCount", 0)),
            "video_duration": video_duration,
        })

    return results


def fetch_video_analytics(video_id: str, channel_id: str) -> dict:
    """
    Ambil analytics real-time untuk satu video menggunakan YouTube Analytics API.
    Mengembalikan metrik yang dipetakan langsung ke format input model ML.
    """
    analytics = _get_analytics()
    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=30)).isoformat()

    try:
        resp = analytics.reports().query(
            ids=f"channel=={channel_id}",
            startDate=start_date,
            endDate=end_date,
            metrics=(
                "views,"
                "estimatedMinutesWatched,"
                "averageViewDuration,"
                "averageViewPercentage,"
                "impressions,"
                "impressionClickThroughRate,"
                "subscribersGained"
            ),
            filters=f"video=={video_id}",
            dimensions="day",
        ).execute()
    except Exception as e:
        # Analytics API mungkin tidak tersedia untuk semua video
        return {"_analytics_error": str(e)}

    rows = resp.get("rows", [])
    if not rows:
        return {}

    # Kolom: [date, views, estimatedMinutes, avgViewDuration, avgViewPct, impressions, ctr, subsGained]
    total_views       = sum(r[1] for r in rows)
    avg_duration_sec  = sum(r[3] for r in rows) / len(rows)
    avg_retention_pct = sum(r[4] for r in rows) / len(rows)
    total_impressions = sum(r[5] for r in rows)
    avg_ctr_raw       = sum(r[6] for r in rows) / len(rows)  # dalam desimal (0.xx)
    total_subs        = sum(r[7] for r in rows)

    # Lag 7 hari & rolling mean 14 hari
    lag_7d_views   = int(sum(r[1] for r in rows[-7:])) if len(rows) >= 7 else int(total_views)
    rolling_14d    = int(sum(r[1] for r in rows[-14:]) / min(14, len(rows))) if rows else 0

    return {
        "views":                    int(total_views),
        "ctr":                      round(avg_ctr_raw * 100, 2),
        "impressions":              int(total_impressions),
        "avg_view_duration":        _seconds_to_hhmmss(avg_duration_sec),
        "retention_rate":           round(avg_retention_pct, 2),
        "subscriber_gained":        int(total_subs),
        "lag_views_7d":             lag_7d_views,
        "rolling_mean_views_14d":   rolling_14d,
    }
