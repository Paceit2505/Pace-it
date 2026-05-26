/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#141414",
        border: "#2A2A2A",
        accent: "#C8FF00",
        alert: "#FF4D00",
        success: "#22C55E",
        muted: "#888888",
      },
      fontFamily: {
        "barlow-bold": ["BarlowCondensed_700Bold"],
        "barlow-semibold": ["BarlowCondensed_600SemiBold"],
        "dm-sans": ["DMSans_400Regular"],
        "dm-sans-medium": ["DMSans_500Medium"],
        "jetbrains": ["JetBrainsMono_400Regular"],
      },
    },
  },
  plugins: [],
};
