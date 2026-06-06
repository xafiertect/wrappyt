import os
from dotenv import load_dotenv
load_dotenv()
from utils.youtube_oauth import build_flow
flow = build_flow()
auth_url, _ = flow.authorization_url(
    access_type="offline",
    include_granted_scopes="true",
    state="UY1M4ZZGMqEYg6oaeHCDFA",
    prompt="consent"
)
print(auth_url)
