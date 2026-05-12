import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "azul-escuro": "#1E3A5F",
        "azul-medio": "#2E5FA3",
        verde: "#2ECC71",
        vermelho: "#E74C3C",
        cinza: "#F5F7FA",
      },
    },
  },
  plugins: [],
};
export default config;
