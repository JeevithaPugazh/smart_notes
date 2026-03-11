import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";

const MESSAGES = [
  "Reading your handwriting...",
  "Consulting the V8 Engine...",
  "Polishing your study guide...",
];

// Each sparkle: angle (deg), distance from centre (px), dot size (px), delay, duration
const SPARKLES = [
  { angle: 0,   dist: 54, size: 7, delay: "0.0s", dur: "1.4s" },
  { angle: 45,  dist: 50, size: 5, delay: "0.2s", dur: "1.2s" },
  { angle: 90,  dist: 56, size: 8, delay: "0.4s", dur: "1.6s" },
  { angle: 135, dist: 50, size: 5, delay: "0.6s", dur: "1.3s" },
  { angle: 180, dist: 54, size: 7, delay: "0.8s", dur: "1.5s" },
  { angle: 225, dist: 50, size: 5, delay: "1.0s", dur: "1.2s" },
  { angle: 270, dist: 56, size: 8, delay: "1.2s", dur: "1.7s" },
  { angle: 315, dist: 50, size: 6, delay: "1.4s", dur: "1.4s" },
];

const SPARKLE_COLORS = ["#a855f7", "#f59e0b", "#c084fc", "#fbbf24"];

const KEYFRAMES = `
  @keyframes wandTilt {
    0%   { transform: rotate(-16deg) translate(-2px,  2px); }
    50%  { transform: rotate( 16deg) translate( 2px, -2px); }
    100% { transform: rotate(-16deg) translate(-2px,  2px); }
  }
  @keyframes wandGlow {
    0%   { filter: drop-shadow(0 0  8px #a855f7cc) drop-shadow(0 0 16px #f59e0b55); }
    50%  { filter: drop-shadow(0 0 20px #a855f7ff) drop-shadow(0 0 38px #f59e0b99); }
    100% { filter: drop-shadow(0 0  8px #a855f7cc) drop-shadow(0 0 16px #f59e0b55); }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
    50%       { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
  }
  @keyframes fadeMsg {
    0%   { opacity: 0; transform: translateY(8px);  }
    12%  { opacity: 1; transform: translateY(0);    }
    85%  { opacity: 1; transform: translateY(0);    }
    100% { opacity: 0; transform: translateY(-6px); }
  }
`;

export default function MagicLoading() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: "32px 16px",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Wand + sparkles container */}
        <div
          style={{
            position: "relative",
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* SVG gradient used by the Wand2 stroke */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#a855f7" />
                <stop offset="60%"  stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Sparkle dots */}
          {SPARKLES.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const x = Math.cos(rad) * s.dist;
            const y = Math.sin(rad) * s.dist;
            const color = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: s.size,
                  height: s.size,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 6px 3px ${color}99`,
                  animation: `sparkle ${s.dur} ${s.delay} ease-in-out infinite`,
                  // base transform handled by keyframe (includes translate centering)
                  transform: "translate(-50%, -50%) scale(0.25)",
                }}
              />
            );
          })}

          {/* Wand icon */}
          <div
            style={{
              animation: "wandTilt 2s ease-in-out infinite, wandGlow 2s ease-in-out infinite",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Wand2
              size={48}
              strokeWidth={1.6}
              color="url(#wandGrad)"
            />
          </div>
        </div>

        {/* Cycling message */}
        <p
          key={msgIdx}
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.01em",
            background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #d97706 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "fadeMsg 2.2s ease forwards",
            textAlign: "center",
          }}
        >
          {MESSAGES[msgIdx]}
        </p>
      </div>
    </>
  );
}
