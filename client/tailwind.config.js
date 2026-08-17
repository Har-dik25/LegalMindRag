/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core Palette from LegalMind / Samvidhan AI Design System
        "obsidian": "#0E0F12",
        "panel-slate": "#16181D",
        "brass": "#B08D57",
        "sage": "#6F8F82",
        "parchment": "#EDE6D6",
        
        "background": "#0E0F12",
        "on-background": "#e3e2e6",
        "surface": "#121316",
        "surface-dim": "#121316",
        "surface-bright": "#38393c",
        "surface-container-lowest": "#0d0e11",
        "surface-container-low": "#1b1b1f",
        "surface-container": "#1f1f23",
        "surface-container-high": "#292a2d",
        "surface-container-highest": "#343538",
        
        "primary": "#e8c086",
        "on-primary": "#432c00",
        "primary-container": "#b08d57",
        "on-primary-container": "#3d2700",
        "primary-fixed": "#ffdeae",
        "primary-fixed-dim": "#e8c086",
        
        "secondary": "#accebf",
        "on-secondary": "#17362c",
        "secondary-container": "#2e4d42",
        "on-secondary-container": "#9bbcae",
        "secondary-fixed": "#c8eadb",
        "secondary-fixed-dim": "#accebf",
        
        "tertiary": "#dac49a",
        "on-tertiary": "#3c2f10",
        "tertiary-container": "#a4906a",
        "on-tertiary-container": "#362a0c",
        "tertiary-fixed": "#f7e0b4",
        "tertiary-fixed-dim": "#dac49a",
        
        "on-surface": "#e3e2e6",
        "on-surface-variant": "#d1c5b6",
        "outline": "#9a8f81",
        "outline-variant": "#4e453a",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
      },
      fontFamily: {
        "headline-md": ["Fraunces", "EB Garamond", "serif"],
        "headline-lg": ["Fraunces", "EB Garamond", "serif"],
        "display-lg": ["Fraunces", "EB Garamond", "serif"],
        "fraunces": ["Fraunces", "serif"],
        "garamond": ["EB Garamond", "serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "citation": ["JetBrains Mono", "monospace"],
        "mono": ["JetBrains Mono", "monospace"],
        "legal": ["Source Serif 4", "serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "sm": "0.125rem",
        "lg": "0.375rem",
        "xl": "0.5rem",
        "2xl": "0.75rem",
        "full": "9999px",
      },
      spacing: {
        "margin-desktop": "48px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "gutter": "24px",
        "margin-mobile": "16px"
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
