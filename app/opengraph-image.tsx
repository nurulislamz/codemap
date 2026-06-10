import { ImageResponse } from "next/og";

export const alt = "LeetCode Backend Helper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "#08111d",
          color: "#f1f5f9",
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#9b6cff",
            letterSpacing: "-0.02em",
          }}
        >
          Backend Prep
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          LeetCode Backend Helper
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#94a3b8" }}>
          Personal backend interview prep dashboard.
        </div>
      </div>
    ),
    size,
  );
}
