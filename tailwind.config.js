/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        esi: {
          50: '#FCE8F3',
          100: '#FAE8F0',
          200: '#F5C2DD',
          300: '#F09AC9',
          400: '#E570B0',
          500: '#C1346A', // BORDEAUX PRINCIPAL
          600: '#A71E52',
          700: '#8B1448',
          800: '#6E103A',
          900: '#520C2B',
        },
        secondary: {
          50: '#F8F9FA',
          100: '#ECF0F1',
          200: '#D5DBDB',
          300: '#BDC3C7',
          400: '#95A5A6',
          500: '#7F8C8D',
          600: '#34495E',
          700: '#2C3E50', // Gris ardoise
          800: '#212F3D',
          900: '#17202A',
        },
        // Accents
        stic: {
          500: '#2196F3',
          600: '#1976D2',
        },
        stgi: {
          500: '#4CAF50',
          600: '#388E3C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
