/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        main: "inter",
        oswald: "oswald",
      },
      colors:{
        main:"#166534"
      }
    },
  },

  plugins: [],
};
