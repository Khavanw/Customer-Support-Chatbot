import os
import requests
from urllib.parse import urljoin

QDRANT_HOST = os.getenv('QDRANT_HOST', 'qdrant')
QDRANT_PORT = os.getenv('QDRANT_PORT', '6333')

def check_qdrant_health():
    try:
        url = f"http://{QDRANT_HOST}:{QDRANT_PORT}/collections"
        response = requests.get(url)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Qdrant health check failed: {e}")
        return False

if __name__ == "__main__":
    if not check_qdrant_health():
        exit(1)
    exit(0)