import os
import tempfile
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
from pydantic import BaseModel

app = FastAPI(title="Civic & RTI Hub API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN")

# Model 1: PDF Simplifier
SIMPLIFIER_SPACE_ID = "Ronak0/RC"
simplifier_client = Client(SIMPLIFIER_SPACE_ID, hf_token=HF_TOKEN)

# Model 2: RTI Drafter (replace with your exact HF username/space-name)
DRAFTER_SPACE_ID = "Ronak0/rti-drafter"
drafter_client = Client(DRAFTER_SPACE_ID, hf_token=HF_TOKEN)


class DraftRequest(BaseModel):
  prompt: str


# ================= Endpoints =================


@app.post("/simplify")
@app.post("/api/simplify")
async def simplify_pdf(file: UploadFile = File(...)):
  if not file.filename.lower().endswith(".pdf"):
    raise HTTPException(status_code=400, detail="Must be a PDF file.")

  with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
    tmp.write(await file.read())
    tmp_path = tmp.name

  try:
    raw_result = simplifier_client.predict(
        pdf_file=handle_file(tmp_path), api_name="/simplify_document"
    )

    points = [p.strip() for p in raw_result.split("\n\n") if p.strip()]
    return {"simplified_points": points}

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
  finally:
    if os.path.exists(tmp_path):
      os.remove(tmp_path)


@app.post("/draft")
@app.post("/api/draft")
async def draft_rti_endpoint(request: DraftRequest):
  if not request.prompt.strip():
    raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

  try:
    draft_result = drafter_client.predict(
        user_prompt=request.prompt, api_name="/draft_rti"
    )
    return {"draft": draft_result}

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
