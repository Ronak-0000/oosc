import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file

app = FastAPI(title="Civic & RTI PDF Simplifier API")

# CRITICAL: Allow your frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_SPACE_ID = "Ronak0/RC"
client = Client(HF_SPACE_ID)

@app.post("/simplify")
@app.post("/api/simplify")
async def simplify_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Must be a PDF file.")

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Forward to Hugging Face Space using fn_index=0 to bypass naming errors
        raw_result = client.predict(
            handle_file(tmp_path), 
            fn_index=0
        )
        
        # Parse the plain-language string back into a list
        points = [p.strip() for p in raw_result.split("\n\n") if p.strip()]
        return {"simplified_points": points}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
