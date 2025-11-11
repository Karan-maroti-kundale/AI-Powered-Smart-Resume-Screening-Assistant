/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}","./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: { brand: "#111827", accent: "#6366f1", good: "#10b981", warn: "#f59e0b", bad: "#ef4444" },
      borderRadius: { '2xl': '1.25rem' },
      boxShadow: { 'soft': '0 10px 25px rgba(0,0,0,0.08)' }
    },
  },
  plugins: [],
};
