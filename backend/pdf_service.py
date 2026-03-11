from __future__ import annotations

from datetime import datetime
from pathlib import Path


def save_text_as_pdf(*, text: str, out_dir: Path, stem: str) -> Path:
    """
    Placeholder PDF export implementation.
    Replace with a real PDF writer (reportlab, fpdf2, weasyprint, etc).
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"{stem}_{ts}.pdf"

    # For now: write a text file with a .pdf extension to keep the workflow unblocked.
    out_path.write_bytes((text or "").encode("utf-8"))
    return out_path

