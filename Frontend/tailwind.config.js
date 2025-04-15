// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: ["light", "dark"] // Only these two themes
  }
}