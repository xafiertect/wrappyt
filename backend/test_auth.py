import os
from dotenv import load_dotenv

load_dotenv()
client_id = os.getenv("YOUTUBE_CLIENT_ID", "")
print(f"[{client_id}] length: {len(client_id)}")
