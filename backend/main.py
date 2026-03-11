from __future__ import annotations

from pathlib import Path
import os

from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ocr_service import extract_text_from_image, format_notes
from document_service import generate_pdf_from_text, generate_docx_from_text

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

OCR_ENGINE = os.getenv("OCR_ENGINE", "pytesseract")

app = FastAPI(title="Smart Notes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    data = await file.read()
    raw_text = extract_text_from_image(data, engine=OCR_ENGINE)  # type: ignore[arg-type]
    notes_text = format_notes(raw_text)
    return {
        "filename": file.filename,
        "engine": OCR_ENGINE,
        "text": notes_text,
    }


@app.post("/export/pdf")
async def export_pdf(request: Request, file: UploadFile = File(...)):
    data = await file.read()
    raw_text = extract_text_from_image(data, engine=OCR_ENGINE)  # type: ignore[arg-type]
    notes_text = format_notes(raw_text)
    out_path = generate_pdf_from_text(notes_text, out_dir=UPLOADS_DIR, stem="smart_notes")

    download_url = request.url_for("uploads", path=out_path.name)
    return {
        "filename": file.filename,
        "engine": OCR_ENGINE,
        "text": notes_text,
        "download_url": str(download_url),
    }


@app.post("/export/docx")
async def export_docx(request: Request, file: UploadFile = File(...)):
    data = await file.read()
    raw_text = extract_text_from_image(data, engine=OCR_ENGINE)  # type: ignore[arg-type]
    notes_text = format_notes(raw_text)
    out_path = generate_docx_from_text(notes_text, out_dir=UPLOADS_DIR, stem="smart_notes")

    download_url = request.url_for("uploads", path=out_path.name)
    return {
        "filename": file.filename,
        "engine": OCR_ENGINE,
        "text": notes_text,
        "download_url": str(download_url),
    }
