import os
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
from pydantic import BaseModel


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Allow Python to find:
# oosc/rights_navigator/
sys.path.append(str(PROJECT_ROOT))


# ============================================================
# RIGHTS NAVIGATOR
# ============================================================

from rights_navigator.rights_navigator import get_rights_response


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Civic & RTI Hub API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HUGGING FACE TOKEN
# ============================================================

HF_TOKEN = os.getenv("HF_TOKEN")


# ============================================================
# HUGGING FACE SPACES
# ============================================================

# Friend's PDF Simplifier
SIMPLIFIER_SPACE_ID = "Ronak0/RC"

# Friend's RTI Drafter
DRAFTER_SPACE_ID = "Ronak0/rti-drafter"


# ============================================================
# CLIENTS
# ============================================================

# IMPORTANT:
# Do NOT connect to the Spaces when the server starts.
#
# They will be initialized only when /simplify or /draft
# is actually called.

simplifier_client = None
drafter_client = None


# ============================================================
# LAZY LOAD - PDF SIMPLIFIER
# ============================================================

def get_simplifier_client():

    global simplifier_client

    if simplifier_client is None:

        print("Connecting to PDF Simplifier Space...")

        simplifier_client = Client(
            SIMPLIFIER_SPACE_ID,
            token=HF_TOKEN
        )

        print("PDF Simplifier connected.")

    return simplifier_client


# ============================================================
# LAZY LOAD - RTI DRAFTER
# ============================================================

def get_drafter_client():

    global drafter_client

    if drafter_client is None:

        print("Connecting to RTI Drafter Space...")

        drafter_client = Client(
            DRAFTER_SPACE_ID,
            token=HF_TOKEN
        )

        print("RTI Drafter connected.")

    return drafter_client


# ============================================================
# REQUEST MODELS
# ============================================================

class DraftRequest(BaseModel):
    prompt: str


class RightsRequest(BaseModel):
    grievance: str


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
async def root():

    return {
        "status": "online",
        "service": "Civic & RTI Hub API",
        "endpoints": [
            "/simplify",
            "/draft",
            "/rights"
        ]
    }


# ============================================================
# PDF SIMPLIFIER
# ============================================================

@app.post("/simplify")
@app.post("/api/simplify")
async def simplify_pdf(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate PDF
    # --------------------------------------------------------

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Must be a PDF file."
        )


    # --------------------------------------------------------
    # Save uploaded PDF temporarily
    # --------------------------------------------------------

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as tmp:

        tmp.write(
            await file.read()
        )

        tmp_path = tmp.name


    try:

        # ----------------------------------------------------
        # Connect only when this endpoint is used
        # ----------------------------------------------------

        client = get_simplifier_client()


        # ----------------------------------------------------
        # Call friend's Hugging Face Space
        # ----------------------------------------------------

        raw_result = client.predict(
            pdf_file=handle_file(tmp_path),
            api_name="/simplify_document"
        )


        # ----------------------------------------------------
        # Format response
        # ----------------------------------------------------

        points = [
            p.strip()
            for p in raw_result.split("\n\n")
            if p.strip()
        ]


        return {
            "simplified_points": points
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"PDF simplifier error: {str(e)}"
        )


    finally:

        # ----------------------------------------------------
        # Delete temporary PDF
        # ----------------------------------------------------

        if os.path.exists(tmp_path):

            os.remove(tmp_path)


# ============================================================
# RTI DRAFTER
# ============================================================

@app.post("/draft")
@app.post("/api/draft")
async def draft_rti_endpoint(
    request: DraftRequest
):

    # --------------------------------------------------------
    # Validate request
    # --------------------------------------------------------

    if not request.prompt.strip():

        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty."
        )


    try:

        # ----------------------------------------------------
        # Connect only when this endpoint is used
        # ----------------------------------------------------

        client = get_drafter_client()


        # ----------------------------------------------------
        # Call friend's Hugging Face Space
        # ----------------------------------------------------

        draft_result = client.predict(
            user_prompt=request.prompt,
            api_name="/draft_rti"
        )


        return {
            "draft": draft_result
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"RTI drafter error: {str(e)}"
        )


# ============================================================
# RIGHTS NAVIGATOR
# ============================================================

@app.post("/rights")
@app.post("/api/rights")
async def rights_navigator_endpoint(
    request: RightsRequest
):

    # --------------------------------------------------------
    # Validate grievance
    # --------------------------------------------------------

    if not request.grievance.strip():

        raise HTTPException(
            status_code=400,
            detail="Grievance cannot be empty."
        )


    try:

        # ----------------------------------------------------
        # Call YOUR Rights Navigator
        # ----------------------------------------------------

        result = get_rights_response(
            request.grievance
        )


        return result


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Rights Navigator error: {str(e)}"
        )