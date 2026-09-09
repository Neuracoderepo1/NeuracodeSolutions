import type { Config } from "tailwindcss";

/**
 * PROVISIONAL — see README.md.
 *
 * The login page pulled from the Claude Code session references
 * base-0/1/2/3, ink-primary/secondary/tertiary, signal-gold/red,
 * font-mono, and a text-micro size, but that session's actual
 * tailwind.config was never recovered. These hex values are a
 * reconstruction consistent with the project's established
 * "industrial cyberpunk brutalism" palette (amber/gold on
 * near-black, IBM Plex Mono) — NOT necessarily byte-identical to
 * whatever the original config had. Swap this file wholesale once
 * the real one is recovered; nothing else should need to change
 * since components only ever reference the token names below.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          0: "#0B0F14", // page background
          1: "#10161F", // panel / input background
          2: "#141B26", // alt panel
          3: "#232D3A", // borders
        },
        ink: {
          primary: "#E7ECF2",
          secondary: "#8B97A8",
          tertiary: "#5B6675",
        },
        signal: {
          gold: "#F0B429",
          red: "#F0554B",
          green: "#3FCB6E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        micro: ["11px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
    },
  },
  plugins: [],
};

export default config;
