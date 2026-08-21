import fitz  # PyMuPDF
import re

def extract_pdf_chunks(pdf_path: str, chunk_size: int = 400) -> list[str]:
    doc = fitz.open(pdf_path)
    full_text = []

    for page in doc:
        text = page.get_text("text")
        # Strip excess newlines and consecutive whitespace
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            full_text.append(text)

    merged_text = " ".join(full_text)
    words = merged_text.split()
    
    # Split into chunks of ~400 words
    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
    return chunks
