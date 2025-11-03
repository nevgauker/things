/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1976D2", // Flutter Material blue
          light: "#63A4FF",
          dark: "#004BA0"
        },
        surface: "#F7FAFC"
      },
      borderRadius: {
        xl: "1rem"
      }
    },
  },
  plugins: [],
};
