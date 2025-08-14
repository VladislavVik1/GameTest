/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purpleTop: "#4b1e87",
          purpleMid: "#39206d",
          purpleBottom: "#1c1435",
          lime: "#8CF400",
          green: "#6ad01f",
        }
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.05)",
        btn: "0 10px 20px rgba(62,180,50,.35)",
        glow: "0 0 0 2px rgba(140,244,0,.15)",
      },
      borderRadius: {
        xl2: "1.2rem"
      },
      backgroundImage: {
        'board-gradient': "linear-gradient(180deg, #4b1e87 0%, #39206d 40%, #1c1435 100%)",
        'cell-idle': "linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,.25))",
        'cell-green': "linear-gradient(180deg, #66f08a, #3cd375)",
        'cell-blue': "linear-gradient(180deg, #69adff, #3a74ff)",
        'cell-yellow': "linear-gradient(180deg, #ffd46a, #ffb400)",
        'cell-red': "linear-gradient(180deg, #ff6262, #e03030)",
        'claim-btn': "linear-gradient(180deg, #9afc45, #59c91a)",
        'modal-bg': "radial-gradient(80% 60% at 50% 10%, rgba(255,255,255,.10), transparent 60%), radial-gradient(80% 50% at 50% 120%, rgba(255,255,255,.05), transparent 60%)",
      }
    },
  },
  plugins: [],
};
