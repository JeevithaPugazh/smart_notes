from __future__ import annotations

from pathlib import Path
import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ocr_service import extract_text_from_image
from pdf_service import save_text_as_pdf

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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    data = await file.read()
    text = extract_text_from_image(data, engine=OCR_ENGINE)  # type: ignore[arg-type]
    return {"filename": file.filename, "text": text}


@app.post("/export/pdf")
async def export_pdf(file: UploadFile = File(...)):
    data = await file.read()
    text = extract_text_from_image(data, engine=OCR_ENGINE)  # type: ignore[arg-type]
    out_path = save_text_as_pdf(text=text, out_dir=UPLOADS_DIR, stem="smart_notes")
    return {"pdf_path": str(out_path)}
