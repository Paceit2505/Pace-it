import os
from dotenv import load_dotenv

load_dotenv()

BLING_ACCESS_TOKEN = os.getenv("BLING_ACCESS_TOKEN", "")
BLING_REFRESH_TOKEN = os.getenv("BLING_REFRESH_TOKEN", "")
BLING_CLIENT_ID = os.getenv("BLING_CLIENT_ID", "")
BLING_CLIENT_SECRET = os.getenv("BLING_CLIENT_SECRET", "")
