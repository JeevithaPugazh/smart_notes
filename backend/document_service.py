from __future__ import annotations

from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from docx import Document


def _timestamped_path(out_dir: Path, stem: str, suffix: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return out_dir / f"{stem}_{ts}{suffix}"


def generate_pdf_from_text(text: str, out_dir: Path, stem: str = "smart_notes") -> Path:
    """
    Generate a simple, readable PDF containing the given notes text.
    """
    out_path = _timestamped_path(out_dir, stem, ".pdf")

    c = canvas.Canvas(str(out_path), pagesize=LETTER)
    width, height = LETTER

    text_obj = c.beginText()
    text_obj.setTextOrigin(40, height - 50)
    text_obj.setLeading(16)
    text_obj.setFont("Helvetica", 11)

    for line in (text or "").splitlines():
        # Basic safeguard to avoid extremely long lines falling off the page.
        if len(line) > 120:
            chunks = [line[i : i + 120] for i in range(0, len(line), 120)]
            for chunk in chunks:
                text_obj.textLine(chunk)
        else:
            text_obj.textLine(line)

    c.drawText(text_obj)
    c.showPage()
    c.save()

    return out_path


def generate_docx_from_text(text: str, out_dir: Path, stem: str = "smart_notes") -> Path:
    """
    Generate a Word document from the given notes text.
    """
    out_path = _timestamped_path(out_dir, stem, ".docx")

    doc = Document()

    for line in (text or "").splitlines():
        stripped = line.strip()
        if not stripped:
            doc.add_paragraph("")
            continue

        # Very simple bullet detection.
        bullet_prefixes = ("- ", "* ", "• ")
        if any(stripped.startswith(p) for p in bullet_prefixes):
            content = stripped[2:].lstrip()
            doc.add_paragraph(content, style="List Bullet")
        else:
            doc.add_paragraph(stripped)

    doc.save(out_path)
    return out_path

