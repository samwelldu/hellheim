/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Theme Colors
        midnight: {
          950: '#050508', // Ultra deep void
          900: '#0a0a0f', // Deep void
          800: '#151520', // Dark background
          700: '#1c1c2e', // Card background
          600: '#2a2a40', // Border/Input
          500: '#3f3f60', // Muted 
          400: '#6b6b90', // Body text
          300: '#9494b8', // Light text
          100: '#e0e0ff', // Highlight
        },
        void: {
          DEFAULT: '#7241ff', // Void purple main
          light: '#b08bff',
          dark: '#4a25a0',
        },
        accent: {
          cyan: '#00f0ff', // Magical glow
          gold: '#ffd700', // Legendary
        }
      },
      fontFamily: {
        serif: ['Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      backgroundImage: {
        'void-gradient': 'linear-gradient(to bottom right, #0a0a0f, #151520)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
      }
    },
  },
  plugins: [],
}
