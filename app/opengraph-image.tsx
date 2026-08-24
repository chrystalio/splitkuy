import { ImageResponse } from "next/og";

// Match the metadata size hint declared in app/layout.tsx so the <meta> tags
// reference the exact dimensions this file produces.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SplitKuy — proportional bill splitting for Indonesian Rupiah";

// Dark-mode tokens — mirrors app/globals.css `.dark` block.
const tokens = {
  bg: "#0b0f19", // hsl(222.2 47.4% 6%)
  surface: "#111827", // slightly lifted card surface
  surfaceHover: "#1f2937", // input field fill
  fg: "#f8fafc", // foreground
  muted: "#94a3b8", // muted-foreground (slate-400)
  label: "#cbd5e1", // small uppercase label
  border: "#293548", // border dark
  borderStrong: "#475569", // chevron / accent line
};

// Reusable section label (uppercase, tracked, muted)
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: tokens.muted,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

// Collapsed dropdown row (Discounts / Taxes / Fees look)
function CollapsedRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 48,
        padding: "0 22px",
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 12,
        marginBottom: 8,
        color: tokens.label,
        fontSize: 17,
        fontWeight: 500,
      }}
    >
      {label}
      {/* Chevron */}
      <div
        style={{
          display: "flex",
          width: 10,
          height: 10,
          borderRight: `2px solid ${tokens.muted}`,
          borderBottom: `2px solid ${tokens.muted}`,
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: tokens.bg,
        color: tokens.fg,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: 56,
        justifyContent: "space-between",
      }}
    >
      {/* Left column — brand + tagline + description */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          paddingRight: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -3,
              color: tokens.fg,
            }}
          >
            SplitKuy
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 600,
              color: tokens.fg,
              marginTop: 16,
              lineHeight: 1.2,
            }}
          >
            Split the caffeine, not the headache.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 400,
              color: tokens.muted,
              marginTop: 20,
              lineHeight: 1.4,
              maxWidth: 520,
            }}
          >
            A frictionless web app for team lunch and coffee runs with
            proportional tax math. No accounts, no sign-ups, no drama.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            color: tokens.muted,
          }}
        >
          Made with ☕ by Chrystalio · © 2026
        </div>
      </div>

      {/* Right column — mock app UI */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 520,
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 20,
          padding: 32,
          justifyContent: "space-between",
        }}
      >
        {/* PEOPLE */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Label>PEOPLE</Label>
          <div style={{ display: "flex", fontSize: 16, color: tokens.muted, marginBottom: 12 }}>
            No people yet
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                height: 50,
                padding: "0 18px",
                background: tokens.surfaceHover,
                border: `1px solid ${tokens.border}`,
                borderRadius: 12,
                color: tokens.muted,
                fontSize: 18,
              }}
            >
              Add person name
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 50,
                padding: "0 24px",
                background: tokens.fg,
                color: tokens.bg,
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Add
            </div>
          </div>
        </div>

        {/* DISCOUNTS / TAXES / FEES */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 22 }}>
          <CollapsedRow label="Discounts" />
          <CollapsedRow label="Taxes" />
          <CollapsedRow label="Fees" />
        </div>

        {/* SUMMARY */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: tokens.muted,
              }}
            >
              SUMMARY
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 600,
                color: tokens.fg,
              }}
            >
              Rp 0
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 50,
              background: tokens.surfaceHover,
              border: `1px solid ${tokens.border}`,
              borderRadius: 12,
              color: tokens.label,
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Copy summary
          </div>
        </div>
      </div>
    </div>
    ),
    {
      ...size,
    }
  );
}