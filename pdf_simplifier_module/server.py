import os
import tempfile
import fitz  # PyMuPDF
from fastapi import FastAPI, File, HTTPException, UploadFile
import torch
from transformers import AutoConfig, AutoTokenizer, T5ForConditionalGeneration

app = FastAPI(
    title="Civic & RTI PDF Simplifier API",
    description="Transforms bureaucratic RTI/civic PDF documents into plain-language summaries.",
    version="1.0.0",
)

MODEL_REPO = "Ronak0/rti-pdf-simplifier"
FALLBACK_BASE_MODEL = "google/flan-t5-base"

# Initialize Tokenizer with fallback
try:
  tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, legacy=False)
except Exception:
  tokenizer = AutoTokenizer.from_pretrained(FALLBACK_BASE_MODEL, legacy=False)

# Initialize Model with explicit architecture and fallback config
try:
  model = T5ForConditionalGeneration.from_pretrained(MODEL_REPO)
except Exception:
  try:
    config = AutoConfig.from_pretrained(FALLBACK_BASE_MODEL)
    model = T5ForConditionalGeneration.from_pretrained(
        MODEL_REPO, config=config
    )
  except Exception:
    # Direct fallback to base model if repo is not yet uploaded
    model = T5ForConditionalGeneration.from_pretrained(FALLBACK_BASE_MODEL)

model.eval()


def extract_pdf_chunks(
    pdf_path: str, chunk_size: int = 180, max_chunks: int = 6
) -> list[str]:
  """Extracts clean text from a PDF file and splits it into manageable word chunks."""
  doc = fitz.open(pdf_path)
  collected_lines = []

  for page in doc:
    text = page.get_text("text")
    lines = [
        line.strip()
        for line in text.split("\n")
        if len(line.strip().split()) >= 5
    ]
    collected_lines.extend(lines)

  full_text = " ".join(collected_lines)
  words = full_text.split()

  if not words:
    return []

  chunks = [
      " ".join(words[i : i + chunk_size])
      for i in range(0, len(words), chunk_size)
  ]
  return chunks[:max_chunks]


@app.get("/")
def root():
  return {
      "status": "online",
      "service": "Civic & RTI PDF Simplifier API",
      "model_loaded": MODEL_REPO,
  }


@app.post("/simplify")
async def simplify_pdf(file: UploadFile = File(...)):
  """Receives a PDF upload and returns simplified plain-language takeaways."""
  if not file.filename.lower().endswith(".pdf"):
    raise HTTPException(
        status_code=400,
        detail="Invalid file format. Please upload a valid PDF document.",
    )

  with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
    tmp.write(await file.read())
    tmp_path = tmp.name

  try:
    chunks = extract_pdf_chunks(tmp_path)
    if not chunks:
      return {
          "filename": file.filename,
          "simplified_points": [
              "No readable text could be extracted from this document."
          ],
      }

    simplified_points = []
    for chunk in chunks:
      prompt = f"simplify bureaucratic text into simple language: {chunk}"
      inputs = tokenizer(
          prompt, return_tensors="pt", max_length=512, truncation=True
      )

      with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_length=120,
            min_length=20,
            num_beams=4,
            no_repeat_ngram_size=3,
            repetition_penalty=2.5,
            early_stopping=True,
        )

      summary = tokenizer.decode(output_ids[0], skip_special_tokens=True)
      if summary and summary not in simplified_points:
        simplified_points.append(summary)

    return {"filename": file.filename, "simplified_points": simplified_points}

  finally:
    if os.path.exists(tmp_path):
      os.remove(tmp_path)