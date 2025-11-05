/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { lg: "1140px" } },
    extend: {
      colors: {
        bg: "#0A0B0C",
        surface: "#111317",
        surface2: "#151922",
        border: "#232633",
        primary: "#7EE7FF",
        accent: "#A78BFA",
        muted: "#9AA3B2"
      },
      boxShadow: {
        card: "0 6px 30px rgba(0,0,0,.35)",
        glow: "0 0 0 1px rgba(126,231,255,.15), 0 10px 40px rgba(126,231,255,.08)"
      },
      borderRadius: { xl: "16px", "2xl": "22px" },
      backdropBlur: { xs: "2px" }
    }
  },
  plugins: []
}
