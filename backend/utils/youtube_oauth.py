"""
YouTube OAuth 2.0 Helper
========================
Mengelola OAuth flow, penyimpanan token, dan refresh token otomatis.
"""

import os
import json
import secrets
from datetime import datetime, timezone

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]

TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "token_store.json")


def _client_config() -> dict:
    client_id = os.getenv("YOUTUBE_CLIENT_ID", "")
    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET", "")
    redirect_uri = os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:8000/auth/youtube/callback")
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def is_configured() -> bool:
    """Cek apakah YOUTUBE_CLIENT_ID dan CLIENT_SECRET sudah diisi di .env."""
    return bool(os.getenv("YOUTUBE_CLIENT_ID") and os.getenv("YOUTUBE_CLIENT_SECRET"))


def build_flow() -> Flow:
    return Flow.from_client_config(
        client_config=_client_config(),
        scopes=SCOPES,
        redirect_uri=os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:8000/auth/youtube/callback"),
    )


def save_token(credentials: Credentials) -> None:
    data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes or SCOPES),
    }
    token_path = os.path.abspath(TOKEN_FILE)
    with open(token_path, "w") as f:
        json.dump(data, f, indent=2)


def load_token() -> Credentials | None:
    token_path = os.path.abspath(TOKEN_FILE)
    if not os.path.exists(token_path):
        return None
    try:
        with open(token_path) as f:
            data = json.load(f)
        creds = Credentials(
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=data.get("client_id"),
            client_secret=data.get("client_secret"),
            scopes=data.get("scopes", SCOPES),
        )
        # Auto-refresh jika token expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            save_token(creds)
        return creds
    except Exception:
        return None


def is_authenticated() -> bool:
    """Return True jika ada token valid dan belum expired."""
    creds = load_token()
    return creds is not None and creds.valid


def delete_token() -> None:
    token_path = os.path.abspath(TOKEN_FILE)
    if os.path.exists(token_path):
        os.remove(token_path)
