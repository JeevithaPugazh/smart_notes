const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function postForm(endpoint, file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return await res.json();
}

export function exportPdf(file) {
  return postForm("/export/pdf", file);
}

export function exportDocx(file) {
  return postForm("/export/docx", file);
}

