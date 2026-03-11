from __future__ import annotations

import base64
import io
import os
from typing import Literal

from PIL import Image
import pytesseract


EngineName = Literal["pytesseract", "anthropic"]


def _ocr_with_pytesseract(image_bytes: bytes) -> str:
    if not image_bytes:
        return ""

    with Image.open(io.BytesIO(image_bytes)) as img:
        img = img.convert("RGB")
        text = pytesseract.image_to_string(img, lang="eng")
    return text.strip()


def _ocr_with_anthropic(image_bytes: bytes) -> str:
    """
    Use Anthropic (Claude) for high-quality note reading.

    Requires:
    - `anthropic` Python package installed
    - `ANTHROPIC_API_KEY` set in environment / .env
    """
    try:
        import anthropic  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "anthropic package is not installed. Install it with 'pip install anthropic' "
            "or switch OCR_ENGINE back to 'pytesseract'."
        ) from exc

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to your backend .env file "
            "or environment to use the Anthropic OCR engine."
        )

    client = anthropic.Anthropic(api_key=api_key)

    b64_data = base64.b64encode(image_bytes).decode("utf-8")

    message = client.messages.create(
        model=os.getenv("ANTHROPIC_OCR_MODEL", "claude-3-haiku-20240307"),
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are an OCR and note-cleaning assistant. "
                            "Read the text from this image of notes and return a clean, "
                            "structured plain-text version suitable for converting to a "
                            "digital document. Preserve headings and bullet structure."
                        ),
                    },
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64_data,
                        },
                    },
                ],
            }
        ],
    )

    for block in message.content:
        if getattr(block, "type", None) == "text":
            return block.text.strip()

    raise RuntimeError("Anthropic OCR response did not contain text content.")


def extract_text_from_image(image_bytes: bytes, engine: EngineName = "pytesseract") -> str:
    """
    High-level OCR entrypoint used by FastAPI routes.

    - engine="pytesseract": local Tesseract OCR (good for offline / local testing)
    - engine="anthropic": Claude-based OCR for higher-quality reading of messy notes
    """
    if engine == "anthropic":
        return _ocr_with_anthropic(image_bytes)

    return _ocr_with_pytesseract(image_bytes)

