import os
import tempfile
from fastapi import FastAPI, File, HTTPException, UploadFile
from gradio_client import Client, handle_file
import pymupdf

app = FastAPI(
    title="Civic & RTI PDF Simplifier API",
    description="Transforms bureaucratic RTI/civic PDF documents into plain-language summaries.",
    version="1.0.0",
)

HF_SPACE_ID = "Ronak0/RC"

# Connect to the live Gradio Space instance running your fine-tuned model
try:
  client = Client(HF_SPACE_ID)
except Exception as e:
  client = None
  print(f"[WARNING] Could not initialize Gradio client connection: {e}")


def extract_pdf_chunks(
    pdf_path: str, chunk_size: int = 180, max_chunks: int = 6
) -> list[str]:
  doc = pymupdf.open(pdf_path)
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
      "connected_space": HF_SPACE_ID,
  }


@app.post("/simplify")
async def simplify_pdf(file: UploadFile = File(...)):
  if not file.filename.lower().endswith(".pdf"):
    raise HTTPException(
        status_code=400,
        detail="Invalid file format. Please upload a valid PDF document.",
    )

  with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
    tmp.write(await file.read())
    tmp_path = tmp.name

  try:
    # 1. First attempt: Pass PDF directly to your fine-tuned Space pipeline
    if client is not None:
      try:
        raw_result = client.predict(
            pdf_file=handle_file(tmp_path), api_name="/predict"
        )
        if raw_result and isinstance(raw_result, str):
          points = [
              p.strip() for p in raw_result.split("\n\n") if p.strip()
          ]
          return {"filename": file.filename, "simplified_points": points}
      except Exception as err:
        print(f"[INFO] Direct space call fallback: {err}")

    # 2. Local fallback chunk extraction if direct space payload differs
    chunks = extract_pdf_chunks(tmp_path)
    if not chunks:
      return {
          "filename": file.filename,
          "simplified_points": [
              "No readable text could be extracted from this document."
          ],
      }

    return {
        "filename": file.filename,
        "simplified_points": [
            f"Extracted Section {i+1}: {chunk[:160]}..."
            for i, chunk in enumerate(chunks)
        ],
    }

  finally:
    if os.path.exists(tmp_path):
      os.remove(tmp_path)