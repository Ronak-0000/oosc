import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Target legitimate portal pages hosting circulars/orders/acts
GOVT_SOURCES = [
    "https://cic.gov.in/archive-high-court-ruling",
    # Add other target portal listing URLs here
]

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
os.makedirs(RAW_DATA_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def sanitize_filename(url: str) -> str:
    path = urlparse(url).path
    filename = os.path.basename(path)
    if not filename.endswith(".pdf"):
        filename += ".pdf"
    # Remove invalid filename characters
    return re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)

def download_pdf(url: str, output_path: str) -> bool:
    try:
        response = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        if response.status_code == 200 and "%PDF" in response.text[:10]:
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"[DOWNLOADED] {output_path}")
            return True
    except Exception as e:
        print(f"[ERROR] Failed to fetch {url}: {e}")
    return False

def sync_government_pdfs(max_docs_per_source: int = 5):
    for base_url in GOVT_SOURCES:
        print(f"\nScanning: {base_url} ...")
        try:
            res = requests.get(base_url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(res.text, "html.parser")
            
            downloaded = 0
            for link in soup.find_all("a", href=True):
                href = link["href"]
                if ".pdf" in href.lower():
                    full_pdf_url = urljoin(base_url, href)
                    file_name = sanitize_filename(full_pdf_url)
                    target_file = os.path.join(RAW_DATA_DIR, file_name)

                    if not os.path.exists(target_file):
                        if download_pdf(full_pdf_url, target_file):
                            downloaded += 1
                    else:
                        print(f"[EXISTS] {file_name} already in data/raw/")

                    if downloaded >= max_docs_per_source:
                        break
        except Exception as e:
            print(f"[ERROR] Scraper failed on {base_url}: {e}")

if __name__ == "__main__":
    sync_government_pdfs()
