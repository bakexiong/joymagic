export const polloTheme = {
  meta: {
    source: "manual extraction from pollo.ai public pages",
    confidence: "medium",
  },
  colors: {
    background: "#05070c",
    surface: "#0d1117",
    surfaceElevated: "#141a22",
    surfaceSoft: "#1b2330",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    text: "#f8fafc",
    textMuted: "#b6c2d0",
    textSoft: "#8a97a8",
    accentCyan: "#5fd7ff",
    accentBlue: "#4ea3ff",
    accentTeal: "#4ce6b2",
    accentPurple: "#8b7cff",
    accentPink: "#ff6bd6",
    success: "#33d17a",
    warning: "#ffb84d",
  },
  gradients: {
    brand:
      "linear-gradient(135deg, #5fd7ff 0%, #4ea3ff 35%, #8b7cff 68%, #ff6bd6 100%)",
    teal: "linear-gradient(135deg, #4ce6b2 0%, #5fd7ff 100%)",
  },
  typography: {
    heading: 'Inter, "SF Pro Display", ui-sans-serif, system-ui, sans-serif',
    body: 'Inter, "SF Pro Text", ui-sans-serif, system-ui, sans-serif',
    scale: {
      h1: "56px",
      h2: "36px",
      h3: "22px",
      bodyLg: "18px",
      body: "16px",
      caption: "13px",
    },
  },
  radius: {
    sm: "12px",
    md: "16px",
    lg: "24px",
    pill: "9999px",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "48px",
    8: "64px",
  },
  shadows: {
    card: "0 10px 30px rgba(0,0,0,0.28)",
    glow: "0 0 0 1px rgba(95,215,255,0.2), 0 18px 50px rgba(95,215,255,0.12)",
  },
};

export default polloTheme;
