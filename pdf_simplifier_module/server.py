from fastapi import FastAPI, File, UploadFile, HTTPException
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import pymupdf
import torch
import tempfile
import os
import re

app = FastAPI(title="Civic PDF Simplifier API")

MODEL_REPO = "Ronak0/rti-pdf-simplifier"

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_REPO)
model.eval()

def extract_pdf_chunks(pdf_path: str, chunk_size: int = 200, max_chunks: int = 5) -> list[str]:
    doc = pymupdf.open(pdf_path)
    clean_lines = []
    for page in doc:
        text = page.get_text("text")
        lines = [line.strip() for line in text.split("\n") if len(line.strip().split()) >= 6]
        clean_lines.extend(lines)
    
    full_text = " ".join(clean_lines)
    words = full_text.split()
    if not words:
        return []
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)][:max_chunks]

@app.get("/")
def health_check():
    return {"status": "running", "model": MODEL_REPO}

@app.post("/simplify")
async def simplify_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        chunks = extract_pdf_chunks(tmp_path)
        if not chunks:
            return {"simplified_points": ["No readable text found in document."]}

        simplified_points = []
        for chunk in chunks:
            prompt = f"simplify bureaucratic text into simple language: {chunk}"
            inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
            with torch.no_grad():
                output_tokens = model.generate(
                    **inputs,
                    max_length=120,
                    min_length=20,
                    num_beams=4,
                    no_repeat_ngram_size=3,
                    repetition_penalty=2.5,
                    early_stopping=True
                )
            summary = tokenizer.decode(output_tokens[0], skip_special_tokens=True)
            simplified_points.append(summary)

        return {"simplified_points": simplified_points}

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
