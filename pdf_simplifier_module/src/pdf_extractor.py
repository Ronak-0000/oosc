import pymupdf
import re

def extract_pdf_chunks(pdf_path: str, chunk_size: int = 200, max_chunks: int = 5) -> list[str]:
    doc = pymupdf.open(pdf_path)
    clean_paragraphs = []

    for page in doc:
        text = page.get_text("text")
        
        # Split into logical lines/paragraphs
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines:
            # Skip short index table rows, page numbers, and headers
            if len(line.split()) < 8 or re.search(r'(\bPage\b|\bS\.No\b|\bLPA NO\b|\bWP\(C\)\b)', line, re.IGNORECASE):
                continue
            clean_paragraphs.append(line)

    full_text = " ".join(clean_paragraphs)
    words = full_text.split()
    
    if not words:
        return []

    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
    return chunks[:max_chunks]