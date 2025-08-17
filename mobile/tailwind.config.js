/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FBFDFC",
        navyblue: "#0A193A",
        brand: "#12C3B4",
        muted: "#EFEFEF",
      },
      fontFamily: {
        albert: ["AlbertSansRegular"],
        "albert-light": ["AlbertSansLight"],
        "albert-semibold": ["AlbertSansSemiBold"],
        "albert-bold": ["AlbertSansBold"],

        inter: ["InterRegular"],
        "inter-light": ["InterLight"],
        "inter-medium": ["InterMedium"],
        "inter-semibold": ["InterSemiBold"],
        "inter-bold": ["InterBold"],

        manrope: ["ManropeRegular"],
        "manrope-light": ["ManropeLight"],
        "manrope-medium": ["ManropeMedium"],
        "manrope-semibold": ["ManropeSemiBold"],
        "manrope-bold": ["ManropeBold"],
        "manrope-extrabold": ["ManropeExtraBold"],
        "manrope-extralight": ["ManropeExtraLight"],

        spacemono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
