import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { exportPdf, exportDocx } from "./api.js";

export default function App() {
  const [file, setFile] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [notesText, setNotesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [docxUrl, setDocxUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onFileChange(e) {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setPreviewName(nextFile ? nextFile.name : "");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
    setNotesText("");
    setError("");
    setPdfUrl("");
    setDocxUrl("");
  }

  async function onConvert(e) {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setPdfUrl("");
    setDocxUrl("");
    setNotesText("");

    try {
      const [pdfRes, docxRes] = await Promise.all([
        exportPdf(file),
        exportDocx(file)
      ]);

      setPdfUrl(pdfRes.download_url || "");
      setDocxUrl(docxRes.download_url || "");
      setNotesText(pdfRes.text || docxRes.text || "");
    } catch (err) {
      setError(err?.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  const hasDownloads = !!pdfUrl || !!docxUrl;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 16,
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          background: "#ffffff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: "#111827"
          }}
        >
          Smart Notes Digitization
        </h1>
        <p style={{ marginTop: 8, marginBottom: 20, color: "#4b5563", fontSize: 14 }}>
          Upload a photo or scan of your notes and turn them into clean, downloadable
          study documents.
        </p>

        <form onSubmit={onConvert}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 20,
              borderRadius: 12,
              border: "1px dashed #d1d5db",
              background: "#f9fafb",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: "999px",
                border: "1px solid #9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "#4b5563",
                background: "#ffffff"
              }}
            >
              +
            </span>
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
              Choose a notes image
            </span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              JPG, PNG or PDF scans work best
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </label>

          {previewName ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "#4b5563",
                padding: "6px 10px",
                borderRadius: 8,
                background: "#eff6ff"
              }}
            >
              Selected: <strong>{previewName}</strong>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!file || loading}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: !file || loading ? "not-allowed" : "pointer",
              background: !file || loading ? "#e5e7eb" : "#2563eb",
              color: !file || loading ? "#9ca3af" : "#ffffff",
              transition: "background 0.15s ease"
            }}
          >
            {loading ? "Converting..." : "Convert Notes"}
          </button>
        </form>

        {error ? (
          <p style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>{error}</p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            marginTop: 8,
            alignItems: "stretch"
          }}
        >
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              padding: 10,
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={previewName || "Uploaded notes"}
                style={{
                  maxWidth: "100%",
                  maxHeight: 360,
                  objectFit: "contain",
                  borderRadius: 8
                }}
              />
            ) : (
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Your notes image will appear here.
              </span>
            )}
          </div>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              padding: 12,
              minHeight: 220,
              overflow: "auto",
              fontSize: 14,
              lineHeight: 1.5
            }}
          >
            {notesText ? (
              <ReactMarkdown>{notesText}</ReactMarkdown>
            ) : (
              <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "system-ui" }}>
                Your cleaned-up Markdown notes will appear here after conversion.
              </span>
            )}
          </div>
        </div>

        {hasDownloads ? (
          <div
            style={{
              marginTop: 12,
              paddingTop: 14,
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: "1 1 160px",
                  textAlign: "center",
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111827",
                  textDecoration: "none",
                  background: "#f9fafb"
                }}
              >
                Download PDF
              </a>
            ) : null}

            {docxUrl ? (
              <a
                href={docxUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: "1 1 160px",
                  textAlign: "center",
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111827",
                  textDecoration: "none",
                  background: "#f9fafb"
                }}
              >
                Download Word
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

