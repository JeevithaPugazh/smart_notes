from __future__ import annotations

from pathlib import Path
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types as genai_types

from ocr_service import extract_text_from_image, format_notes
from document_service import generate_pdf_from_text, generate_docx_from_text

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Prefer a strong Gemini 3 Flash vision model by default; allow override via GEMINI_MODEL.
# You can set GEMINI_MODEL=gemini-1.5-pro if your key has access.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
OCR_ENGINE = os.getenv("OCR_ENGINE", "pytesseract")

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

app = FastAPI(title="Smart Notes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


def process_image(image_bytes: bytes) -> dict:
    """
    Main image-processing pipeline.

    - If GEMINI_API_KEY is set, use Gemini 3 Flash (or GEMINI_MODEL override) as a
      professional editor to read handwriting and produce a polished Markdown page.
    - Otherwise, fall back to the legacy OCR engine (pytesseract/Anthropic) plus
      formatting.
    """
    if not image_bytes:
        raise ValueError("No image data provided.")

    # When a Gemini API key is present, ALWAYS use Gemini and never fall back
    # to raw OCR. This prevents noisy Tesseract output when you expect clean
    # Markdown.
    if gemini_client is not None:
        if not gemini_client:
            raise RuntimeError("GEMINI_API_KEY is not configured for Gemini OCR.")

        prompt = (
            "You are a Master Transcriber and professional technical editor. "
            "Do NOT perform raw OCR.\n\n"
            "Carefully READ the handwritten notes in the image, interpret their meaning "
            "with expert judgment, and completely REWRITE them as a polished professional "
            "engineering document.\n\n"
            "Mandatory corrections — apply these exactly:\n"
            '- "Nodes sv"  →  "Node.js Server"\n'
            '- "VB engine" →  "V8 Engine"\n'
            '- "14 Sings"  →  "Single-threaded"\n\n'
            "Formatting rules (output ONLY valid Markdown):\n"
            "  - Use `#` for the main title (textbook-style chapter heading).\n"
            "  - Use `##` for section subheadings.\n"
            "  - Use bullet lists for steps, lists, and key ideas.\n"
            "  - Use **bold** for every important technical term and concept.\n\n"
            "Quality rules:\n"
            "- Fix all spelling and grammar errors.\n"
            "- Reorganize content where needed so it reads like a page from a modern "
            "programming textbook.\n"
            "- If handwriting is messy or ambiguous, use context clues to choose the "
            "most logical and technically correct interpretation.\n"
            "- Output ONLY the final Markdown document. Do not explain your process, "
            "add preamble, or include any text outside the document."
        )

        parts = [
            genai_types.Part.from_text(text=prompt),
            genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        ]

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=parts,
            config=genai_types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.9,
                top_k=32,
                max_output_tokens=4096,
            ),
        )

        markdown = (getattr(response, "text", "") or "").strip()
        return {
            "engine": "gemini",
            "raw_text": markdown,
            "notes_text": markdown,
        }

    # Fallback path when Gemini is not configured at all.
    raw_text = extract_text_from_image(image_bytes, engine=OCR_ENGINE)  # type: ignore[arg-type]
    notes_text = format_notes(raw_text)
    return {
        "engine": OCR_ENGINE,
        "raw_text": raw_text,
        "notes_text": notes_text,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty file upload.")

        result = process_image(data)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}") from exc

    return {
        "filename": file.filename,
        "engine": result["engine"],
        "text": result["notes_text"],
    }


@app.post("/export/pdf")
async def export_pdf(request: Request, file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty file upload.")

        result = process_image(data)
        notes_text = result["notes_text"]
        out_path = generate_pdf_from_text(notes_text, out_dir=UPLOADS_DIR, stem="smart_notes")
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"PDF export failed: {exc}") from exc

    download_url = request.url_for("uploads", path=out_path.name)
    return {
        "filename": file.filename,
        "engine": result["engine"],
        "text": notes_text,
        "download_url": str(download_url),
    }


@app.post("/export/docx")
async def export_docx(request: Request, file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty file upload.")

        result = process_image(data)
        notes_text = result["notes_text"]
        out_path = generate_docx_from_text(notes_text, out_dir=UPLOADS_DIR, stem="smart_notes")
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {exc}") from exc

    download_url = request.url_for("uploads", path=out_path.name)
    return {
        "filename": file.filename,
        "engine": result["engine"],
        "text": notes_text,
        "download_url": str(download_url),
    }
