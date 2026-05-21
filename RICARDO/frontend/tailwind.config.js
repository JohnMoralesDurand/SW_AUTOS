// Configuracion de Tailwind CSS con paleta verde pastel
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Paleta verde pastel personalizada del sistema
        mint: {
          50: "#f0faf5",
          100: "#dcf5e7",
          200: "#bce8d0",
          300: "#8fd4b0",
          400: "#5fb98a",
          500: "#3fa06f",
          600: "#2f8459",
          700: "#286a48",
          800: "#23553c",
          900: "#1f4633",
        },
        sage: {
          50: "#f6f9f3",
          100: "#e8f1e0",
          200: "#d1e3c2",
          300: "#aecd96",
          400: "#84b063",
          500: "#629447",
          600: "#4c7836",
          700: "#3d5e2c",
          800: "#324b27",
          900: "#2a3f23",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 18px -4px rgba(60, 130, 90, 0.18)",
      },
    },
  },
  plugins: [],
};
