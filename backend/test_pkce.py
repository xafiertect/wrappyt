import os
from dotenv import load_dotenv
load_dotenv()
from utils.youtube_oauth import build_flow
flow = build_flow()
auth_url, _ = flow.authorization_url()
print("Verifier:", getattr(flow, "code_verifier", None))
