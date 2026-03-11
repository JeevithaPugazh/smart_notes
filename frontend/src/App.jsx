import { useState } from "react";
import { ocrImage } from "./api.js";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setText("");

    if (!file) return;
    setLoading(true);
    try {
      const res = await ocrImage(file);
      setText(res.text ?? "");
    } catch (err) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 720 }}>
      <h1 style={{ margin: 0 }}>Smart Notes</h1>
      <p style={{ marginTop: 8, color: "#444" }}>
        Upload an image and run OCR via the FastAPI backend.
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={!file || loading}>
          {loading ? "Running..." : "Run OCR"}
        </button>
      </form>

      {error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : null}

      <pre
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f6f6f6",
          borderRadius: 8,
          whiteSpace: "pre-wrap"
        }}
      >
        {text || "OCR output will appear here."}
      </pre>
    </div>
  );
}

