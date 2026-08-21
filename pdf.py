import fitz  # PyMuPDF
import re

def extract_clean_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    full_text = []
    
    for page in doc:
        text = page.get_text("text")
        # Remove repeated headers/footers, excess whitespace, and control chars
        text = re.sub(r'\n+', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        full_text.append(text.strip())
        
    return "\n".join(full_text)
