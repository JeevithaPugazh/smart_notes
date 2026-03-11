import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { exportPdf, exportDocx } from "./api.js";
import MagicLoading from "./MagicLoading.jsx";

const GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }

  .upload-zone:hover {
    border-color: #7c3aed !important;
    background: rgba(139, 92, 246, 0.06) !important;
  }

  .download-btn:hover { opacity: 0.88; }

  .convert-btn:not(:disabled):hover {
    box-shadow: 0 6px 28px rgba(124, 58, 237, 0.5) !important;
    opacity: 0.95;
  }

  /* Markdown content in the Study Guide card */
  .md-prose { color: #1f2937; }
  .md-prose h1 {
    font-size: 1.55em; font-weight: 700; color: #1e1b4b;
    margin: 0.2em 0 0.5em; letter-spacing: -0.02em;
  }
  .md-prose h2 {
    font-size: 1.2em; font-weight: 700; color: #312e81;
    margin: 1em 0 0.4em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid rgba(199, 210, 254, 0.7);
  }
  .md-prose h3 {
    font-size: 1.05em; font-weight: 600; color: #3730a3;
    margin: 0.8em 0 0.3em;
  }
  .md-prose p { margin: 0.3em 0 0.7em; line-height: 1.75; }
  .md-prose ul, .md-prose ol {
    padding-left: 1.4em; margin: 0.25em 0 0.7em;
  }
  .md-prose li { margin: 0.3em 0; line-height: 1.65; }
  .md-prose strong { color: #1e1b4b; font-weight: 650; }
  .md-prose code {
    background: rgba(237, 233, 254, 0.8);
    color: #6d28d9;
    border-radius: 5px;
    padding: 1px 6px;
    font-size: 0.87em;
  }
`;

const UploadIcon = ({ active }) => (
  <svg
    width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#7c3aed" : "#a78bfa"}
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg
    width="42" height="42" viewBox="0 0 24 24" fill="none"
    stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", margin: "0 auto 10px" }}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const DocPlaceholderIcon = () => (
  <svg
    width="42" height="42" viewBox="0 0 24 24" fill="none"
    stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", margin: "0 auto 10px" }}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

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
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function onFileChange(e) {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setPreviewName(nextFile ? nextFile.name : "");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
      const [pdfRes, docxRes] = await Promise.all([exportPdf(file), exportDocx(file)]);
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
  const btnDisabled = !file || loading;

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Page wrapper ── */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px 16px 60px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          background: `
            radial-gradient(ellipse at 12% 18%, #ddd6fe 0%, transparent 46%),
            radial-gradient(ellipse at 88% 12%, #bfdbfe 0%, transparent 46%),
            radial-gradient(ellipse at 75% 88%, #c7d2fe 0%, transparent 46%),
            radial-gradient(ellipse at 22% 82%, #e0e7ff 0%, transparent 46%),
            radial-gradient(ellipse at 50% 50%, #f0f4ff 0%, #eef2ff 100%)
          `,
        }}
      >
        {/* ── Glass card ── */}
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            background: "rgba(255, 255, 255, 0.68)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 24,
            border: "1px solid rgba(255, 255, 255, 0.88)",
            boxShadow:
              "0 24px 80px rgba(109, 40, 217, 0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >

          {/* ── Header ── */}
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ✦ Smart Notes
            </h1>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.65,
                maxWidth: 520,
              }}
            >
              Upload a photo of your handwritten notes and receive a polished,
              AI-generated study guide — ready to download as PDF or Word.
            </p>
          </div>

          {/* ── Upload form ── */}
          <form onSubmit={onConvert} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Drop zone */}
            <label
              className="upload-zone"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "40px 24px",
                borderRadius: 16,
                border: "2px dashed #a78bfa",
                background: "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                textAlign: "center",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(237, 233, 254, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadIcon />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
                  Drop your notes image here
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                  or{" "}
                  <span style={{ color: "#7c3aed", fontWeight: 500 }}>
                    click to browse
                  </span>{" "}
                  — JPG, PNG, or PDF
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
            </label>

            {/* Selected file badge */}
            {previewName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: "rgba(237, 233, 254, 0.6)",
                  border: "1px solid rgba(167, 139, 250, 0.35)",
                  fontSize: 13,
                  color: "#4c1d95",
                  fontWeight: 500,
                }}
              >
                <FileIcon />
                <span>
                  <strong>{previewName}</strong> — ready to convert
                </span>
              </div>
            )}

            {/* Convert button */}
            <button
              type="submit"
              className="convert-btn"
              disabled={btnDisabled}
              style={{
                padding: "13px 20px",
                borderRadius: 999,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: btnDisabled ? "not-allowed" : "pointer",
                background: btnDisabled
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                color: btnDisabled ? "#9ca3af" : "#fff",
                boxShadow: btnDisabled ? "none" : "0 4px 20px rgba(124, 58, 237, 0.35)",
                transition: "opacity 0.15s ease, box-shadow 0.2s ease",
              }}
            >
              {loading ? "Converting..." : "Convert Notes →"}
            </button>
          </form>

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                padding: "11px 16px",
                borderRadius: 10,
                background: "rgba(254, 226, 226, 0.8)",
                border: "1px solid rgba(252, 165, 165, 0.5)",
                color: "#b91c1c",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* ── Side-by-side preview ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 16,
            }}
          >
            {/* Original image card */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(199, 210, 254, 0.6)",
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 320,
              }}
            >
              <div
                style={{
                  padding: "9px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#7c3aed",
                  borderBottom: "1px solid rgba(199, 210, 254, 0.5)",
                  background: "rgba(237, 233, 254, 0.45)",
                }}
              >
                Original Notes
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={previewName || "Uploaded notes"}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 380,
                      objectFit: "contain",
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <ImagePlaceholderIcon />
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>
                      Your notes image will appear here
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Study guide card */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(199, 210, 254, 0.6)",
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 320,
              }}
            >
              <div
                style={{
                  padding: "9px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#7c3aed",
                  borderBottom: "1px solid rgba(199, 210, 254, 0.5)",
                  background: "rgba(237, 233, 254, 0.45)",
                }}
              >
                Study Guide
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: loading || !notesText ? 0 : "8px 20px 20px",
                }}
              >
                {loading ? (
                  <MagicLoading />
                ) : notesText ? (
                  <div className="md-prose">
                    <ReactMarkdown>{notesText}</ReactMarkdown>
                  </div>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px 16px",
                      textAlign: "center",
                    }}
                  >
                    <DocPlaceholderIcon />
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>
                      Your polished study guide will appear here
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Download bar ── */}
          {hasDownloads && (
            <div
              style={{
                paddingTop: 20,
                borderTop: "1px solid rgba(199, 210, 254, 0.5)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6b7280",
                  marginRight: 4,
                }}
              >
                Download as:
              </span>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="download-btn"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    boxShadow: "0 4px 16px rgba(124, 58, 237, 0.30)",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  ↓ PDF
                </a>
              )}
              {docxUrl && (
                <a
                  href={docxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="download-btn"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.30)",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  ↓ Word
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
