const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function ocrImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/ocr`, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return await res.json();
}

