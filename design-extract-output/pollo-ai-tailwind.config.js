/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        pollo: {
          bg: "#05070c",
          surface: "#0d1117",
          elevated: "#141a22",
          soft: "#1b2330",
          border: "rgba(255,255,255,0.08)",
          "border-strong": "rgba(255,255,255,0.16)",
          text: "#f8fafc",
          muted: "#b6c2d0",
          softText: "#8a97a8",
          cyan: "#5fd7ff",
          blue: "#4ea3ff",
          teal: "#4ce6b2",
          purple: "#8b7cff",
          pink: "#ff6bd6",
          success: "#33d17a",
          warning: "#ffb84d",
        },
      },
      fontFamily: {
        heading: ['Inter', '"SF Pro Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', '"SF Pro Text"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        "pollo-sm": "12px",
        "pollo-md": "16px",
        "pollo-lg": "24px",
        "pollo-pill": "9999px",
      },
      boxShadow: {
        "pollo-card": "0 10px 30px rgba(0,0,0,0.28)",
        "pollo-glow":
          "0 0 0 1px rgba(95,215,255,0.2), 0 18px 50px rgba(95,215,255,0.12)",
      },
      backgroundImage: {
        "pollo-brand":
          "linear-gradient(135deg, #5fd7ff 0%, #4ea3ff 35%, #8b7cff 68%, #ff6bd6 100%)",
        "pollo-teal":
          "linear-gradient(135deg, #4ce6b2 0%, #5fd7ff 100%)",
      },
    },
  },
  plugins: [],
};
